from io import BytesIO

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.params import Depends

from app.googledrivefunc import DriveFileOperations
from app.dependencies import get_drive_file_ops
from app.schemas import FileBase
import json

router = APIRouter()


@router.post('/upload')
async def document_upload(drive_ops: DriveFileOperations =
                          Depends(get_drive_file_ops),
                            file: UploadFile = File(...),
                          document: str = Form(...)):

    # Parse the JSON string into a Pydantic model
    document_data = json.loads(document)
    parsed_document = FileBase(**document_data)
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