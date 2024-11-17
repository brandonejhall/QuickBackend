from fastapi import FastAPI,UploadFile,File,Form
from .models import *
import json

# start server -- fastapi dev main.py 
app = FastAPI()


@app.post("/register")
async def register(user: User):
    return user


@app.post("/login")
async def login(userlogin: UserLogin):
    return userlogin


@app.post('/uploadDocuments')
async def documentUplaod  (file: UploadFile,document: str = Form(...)):
    # Parse the JSON string into a Pydantic model
    document_data = json.loads(document)
    parsed_document = Document(**document_data)

    # Do something with the file and parsed document data
    content = await file.read()
    return {
        "filename": file.filename,
        "document": parsed_document,
        "file_size": len(content)
    }