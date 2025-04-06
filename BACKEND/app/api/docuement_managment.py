import os
from io import BytesIO
import json

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.params import Depends
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse, StreamingResponse
from fastapi.responses import Response

from ..googledrivefunc import DriveFileOperations
from ..dependencies import get_drive_file_ops
from ..schemas import FileBase
from ..database import get_db
from ..models import Files, Users

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_FILE_TYPES = ['.pdf', '.docx', '.txt']

@router.get("/")
async def get_documents():
    return {"message": "Document management API is running"}

@router.post('/upload')
async def document_upload(drive_ops: DriveFileOperations =
                          Depends(get_drive_file_ops),
                            file: UploadFile = File(...),
                          document: str = Form(...),
                          db: Session =  Depends(get_db)):
    try:
        # Parse the JSON string into a Pydantic model
        document_data = json.loads(document)
        parsed_document = FileBase(**document_data)
        parsed_document.filename = file.filename

        # Validate file type
        file_extension = os.path.splitext(file.filename)[1]
        if file_extension not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Get user
        user = db.query(Users).filter(Users.email == parsed_document.email).first()
        if not user:
            raise HTTPException(status_code=400, detail="User does not exist")

        # Check if file already exists
        existing = db.query(Files).filter(
            Files.filename == parsed_document.filename,
            Files.user_id == user.id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="A file by that name is already loaded")

        # Read file content once
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")

        # Save document to folder
        drive_ops.check_and_save_file(
            file.filename,
            BytesIO(content),
            parsed_document.email)

        # Create file record in database
        db_file = create_file(parsed_document, db, user.id)

        # Prepare response data
        response_data = {
            "id": db_file.id,
            "filename": file.filename,
            "document_type": parsed_document.document_type,
            "email": parsed_document.email
        }

        # Safely handle created_at if it exists
        if hasattr(db_file, 'created_at') and db_file.created_at:
            response_data["created_at"] = db_file.created_at.isoformat()
        else:
            response_data["created_at"] = None

        return response_data
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid document data format")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding file: {str(e)}")


def create_file(file: FileBase, db:Session , user_id):
    db_file = Files(
            filename = file.filename,
            document_type = file.document_type,
            user_id = user_id
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


@router.delete('/delete/{email}/{filename}')
async def delete_document(
        email: str,
        filename: str,
        drive_ops: DriveFileOperations = Depends(get_drive_file_ops),
        db: Session = Depends(get_db)
):

    try:
        # Find the user
        user = db.query(Users).filter(Users.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Find the file in the database
        db_file = db.query(Files).filter(
            Files.filename == filename,
            Files.user_id == user.id
        ).first()

        if not db_file:
            raise HTTPException(status_code=404, detail="File not found")

        # Delete from Google Drive
        drive_delete_count = drive_ops.find_and_delete_files(
            file_name=filename,
            folder_name=email
        )

        # Delete from database
        db.delete(db_file)
        db.commit()

        return JSONResponse(
            status_code=200,
            content={
                "message": "File deleted successfully",
                "drive_files_deleted": drive_delete_count,
                "filename": filename
            }
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@router.get('/documents/{email}')
async def get_user_documents(email: str, db: Session = Depends(get_db)):
    try:
        # Find the user
        user = db.query(Users).filter(Users.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get all documents for the user
        documents = db.query(Files).filter(Files.user_id == user.id).all()
        
        # Format the response
        formatted_documents = []
        for doc in documents:
            document_data = {
                "id": doc.id,
                "filename": doc.filename,
                "document_type": doc.document_type
            }
            # Safely handle created_at if it exists
            if hasattr(doc, 'created_at') and doc.created_at:
                document_data["created_at"] = doc.created_at.isoformat()
            else:
                document_data["created_at"] = None
                
            formatted_documents.append(document_data)

        return formatted_documents
    except Exception as e:
        print(f"Error fetching documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")
    

@router.get('/download/{email}/{filename}')
async def download_document(
    email: str,
    filename: str,
    drive_ops: DriveFileOperations = Depends(get_drive_file_ops),
    db: Session = Depends(get_db)
):
    try:
        # Find the user
        user = db.query(Users).filter(Users.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Find the file in the database
        db_file = db.query(Files).filter(
            Files.filename == filename,
            Files.user_id == user.id
        ).first()

        if not db_file:
            raise HTTPException(status_code=404, detail="File not found in database")

        # Find file in Google Drive and get content
        try:
            file_content = drive_ops.download_file(filename, email)
            
            # Determine content type based on file extension
            content_type = 'application/octet-stream'  # default
            if filename.lower().endswith('.pdf'):
                content_type = 'application/pdf'
            elif filename.lower().endswith('.docx'):
                content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            elif filename.lower().endswith('.txt'):
                content_type = 'text/plain'

            return StreamingResponse(
                BytesIO(file_content),
                media_type=content_type,
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Content-Length': str(len(file_content))
                }
            )
        except Exception as e:
            print(f"Error downloading file from Google Drive: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error downloading file from storage: {str(e)}"
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error processing download request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing download request: {str(e)}"
        )
    
@router.get('/preview/{email}/{filename}')
async def preview_document(
    email: str,
    filename: str,
    drive_ops: DriveFileOperations = Depends(get_drive_file_ops)
):
    try:
        preview_url = drive_ops.get_preview_url(filename, email)
        return {"preview_url": preview_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))