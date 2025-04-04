import os
from io import BytesIO

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.params import Depends
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from app.googledrivefunc import DriveFileOperations
from app.dependencies import get_drive_file_ops
from app.schemas import FileBase
import json
from ..database import get_db
from ..models import Files,Users

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_FILE_TYPES = ['.pdf', '.docx', '.txt']

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

        if file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")

        # Validate file type
        file_extension = os.path.splitext(file.filename)[1]
        if file_extension not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid file type")

        user = user = db.query(Users).filter(Users.email == parsed_document.email).first()


        # Check if File is already uploaded
        if user:
            existing = db.query(Files).filter(
                Files.filename == parsed_document.filename,
                Files.user_id == user.id
            ).first()  # Use `.first()` to fetch the first matching result, or `None` if no match
        else:
            existing = None
            raise HTTPException(status_code=400, detail="User does not exist")


        if existing:
            raise HTTPException(status_code=400, detail="A file by that name is already loaded")
        else:
            create_file(parsed_document,db,user.id)


        #Save document to folder
        drive_ops.check_and_save_file(
            file.filename,
            BytesIO(await file.read()),
            parsed_document.email)

        # Do something with the file and parsed document data
        content = await file.read()
        return {
            "filename": file.filename,
            "document": parsed_document,
            "file_size": len(content)
        }
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