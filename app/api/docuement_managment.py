from fastapi import APIRouter, UploadFile, File, Form
from app.schemas import FileBase
import json

router = APIRouter()


@router.post('/upload')
async def document_upload(file: UploadFile = File(...), document: str = Form(...)):
    # Parse the JSON string into a Pydantic model
    document_data = json.loads(document)
    parsed_document = FileBase(**document_data)

    # Do something with the file and parsed document data
    content = await file.read()
    return {
        "filename": file.filename,
        "document": parsed_document,
        "file_size": len(content)
    }