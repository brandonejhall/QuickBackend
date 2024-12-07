import os
from io import BytesIO

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.params import Depends
from sqlalchemy.orm import Session

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