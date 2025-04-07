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
from ..dependencies import get_current_user

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_FILE_TYPES = ['.pdf', '.docx', '.txt']

@router.get("/")
async def get_documents():
    return {"message": "Document management API is running"}

@router.post('/upload')
async def document_upload(
    drive_ops: DriveFileOperations = Depends(get_drive_file_ops),
    file: UploadFile = File(...),
    document: str = Form(...),
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        print("Starting document upload...")
        print(f"Current user email: {current_user_email}")
        print(f"Document data: {document}")
        
        # Parse the JSON string into a Pydantic model
        document_data = json.loads(document)
        parsed_document = FileBase(**document_data)
        parsed_document.filename = file.filename
        print(f"Parsed document: {parsed_document}")

        # Validate file type
        file_extension = os.path.splitext(file.filename)[1]
        if file_extension not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Get user
        user = db.query(Users).filter(Users.email == parsed_document.email).first()
        if not user:
            raise HTTPException(status_code=400, detail="User does not exist")
        print(f"Found user: {user.email}")

        # Check if file already exists
        existing = db.query(Files).filter(
            Files.filename == parsed_document.filename,
            Files.user_id == user.id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="A file by that name is already loaded")

        # Read file content once
        content = await file.read()
        print("File content read successfully")
        
        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")

        print("Saving file to Google Drive...")
        # Save document to folder
        drive_ops.check_and_save_file(
            file.filename,
            BytesIO(content),
            parsed_document.email)
        print("File saved to Google Drive successfully")

        print("Creating database record...")
        # Create file record in database
        try:
            db_file = create_file(parsed_document, db, user.id, current_user_email)
            print("Database record created successfully")
        except Exception as e:
            print(f"Error creating database record: {str(e)}")
            raise

        # Prepare response data
        response_data = {
            "id": db_file.id,
            "filename": file.filename,
            "document_type": parsed_document.document_type,
            "email": parsed_document.email,
            "uploaded_by": current_user_email
        }

        # Safely handle created_at if it exists
        if hasattr(db_file, 'created_at') and db_file.created_at:
            response_data["created_at"] = db_file.created_at.isoformat()
        else:
            response_data["created_at"] = None

        print("Upload completed successfully")
        return response_data
    except json.JSONDecodeError:
        print("Error: Invalid document data format")
        raise HTTPException(status_code=400, detail="Invalid document data format")
    except Exception as e:
        print(f"Error in document upload: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding file: {str(e)}")


def create_file(file: FileBase, db: Session, user_id: int, uploaded_by: str):
    print(f"Creating file record with: filename={file.filename}, document_type={file.document_type}, user_id={user_id}, uploaded_by={uploaded_by}")
    db_file = Files(
        filename=file.filename,
        document_type=file.document_type,
        user_id=user_id,
        uploaded_by=uploaded_by
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    print("File record created successfully")
    return db_file


@router.delete('/delete/{document_id}')
async def delete_document(
    document_id: int,
    drive_ops: DriveFileOperations = Depends(get_drive_file_ops),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    try:
        # Find the file in the database
        db_file = db.query(Files).filter(Files.id == document_id).first()
        if not db_file:
            raise HTTPException(status_code=404, detail="File not found")

        # Get the user who owns the file
        user = db.query(Users).filter(Users.id == db_file.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if current user is admin or the owner of the file
        current_user_obj = db.query(Users).filter(Users.email == current_user).first()
        if not current_user_obj:
            raise HTTPException(status_code=401, detail="Unauthorized")

        if current_user_obj.role != "admin" and current_user_obj.id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this file")

        # Delete from Google Drive
        drive_delete_count = drive_ops.find_and_delete_files(
            file_name=db_file.filename,
            folder_name=user.email
        )

        # Delete from database
        db.delete(db_file)
        db.commit()

        return JSONResponse(
            status_code=200,
            content={
                "message": "File deleted successfully",
                "drive_files_deleted": drive_delete_count,
                "filename": db_file.filename
            }
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@router.get("/documents/{email}")
async def get_documents_by_user(
    email: str,
    page: int = 1,
    per_page: int = 5,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    try:
        # Get user
        user = db.query(Users).filter(Users.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get current user's role
        current_user_obj = db.query(Users).filter(Users.email == current_user).first()
        if not current_user_obj:
            raise HTTPException(status_code=401, detail="Unauthorized")

        # Calculate offset
        offset = (page - 1) * per_page

        # If current user is admin, get all documents
        if current_user_obj.role == "admin":
            total_documents = db.query(Files).count()
            documents = db.query(Files).order_by(Files.created_at.desc()).offset(offset).limit(per_page).all()
        else:
            # For regular users, get only their documents
            total_documents = db.query(Files).filter(Files.user_id == user.id).count()
            documents = db.query(Files).filter(
                Files.user_id == user.id
            ).order_by(Files.created_at.desc()).offset(offset).limit(per_page).all()

        # Format documents for response
        formatted_documents = []
        for doc in documents:
            doc_user = db.query(Users).filter(Users.id == doc.user_id).first()
            formatted_documents.append({
                "id": doc.id,
                "filename": doc.filename,
                "document_type": doc.document_type,
                "email": doc_user.email if doc_user else "unknown",
                "uploaded_by": doc.uploaded_by,
                "created_at": doc.created_at.isoformat()
            })

        return {
            "documents": formatted_documents,
            "total": total_documents,
            "page": page,
            "per_page": per_page,
            "total_pages": (total_documents + per_page - 1) // per_page
        }

    except Exception as e:
        print(f"Error in get_documents_by_user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

@router.get('/users/search/{query}')
async def search_users(query: str, db: Session = Depends(get_db)):
    try:
        # Search for users by email or fullname
        users = db.query(Users).filter(
            (Users.email.ilike(f"%{query}%")) | 
            (Users.fullname.ilike(f"%{query}%"))
        ).all()
        
        # Format the response
        formatted_users = []
        for user in users:
            user_data = {
                "id": user.id,
                "email": user.email,
                "fullname": user.fullname,
                "role": user.role
            }
            formatted_users.append(user_data)
            
        return formatted_users
    except Exception as e:
        print(f"Error searching users: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching users: {str(e)}")

@router.get('/recent-uploads')
async def get_recent_uploads(limit: int = 10, db: Session = Depends(get_db)):
    try:
        print("Fetching recent uploads...")
        # Get recent uploads with user information
        recent_uploads = db.query(Files, Users).join(
            Users, Files.user_id == Users.id
        ).order_by(
            Files.created_at.desc()
        ).limit(limit).all()
        
        print(f"Found {len(recent_uploads)} recent uploads")
        
        # Format the response
        formatted_uploads = []
        for file, user in recent_uploads:
            upload_data = {
                "id": file.id,
                "filename": file.filename,
                "document_type": file.document_type,
                "created_at": file.created_at.isoformat() if file.created_at else None,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "fullname": user.fullname
                }
            }
            formatted_uploads.append(upload_data)
            
        print("Formatted uploads:", formatted_uploads)
        return formatted_uploads
    except Exception as e:
        print(f"Error fetching recent uploads: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching recent uploads: {str(e)}") 