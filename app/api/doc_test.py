from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas import FileBase
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from typing import Optional
import json
import io
import os

router = APIRouter()

# Initialize Google Drive API
SCOPES = ['https://www.googleapis.com/auth/drive.file']


def get_drive_service():
    """Initialize and return Google Drive service"""
    credentials = service_account.Credentials.from_service_account_file(
        os.getenv('DRIVE_CREDENTIALS'),
        scopes=SCOPES
    )
    return build('drive', 'v3', credentials=credentials)


def find_or_create_user_folder(service, username: str) -> str:
    """Find existing user folder or create new one, return folder ID"""
    # Search for existing folder
    query = f"name = '{username}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    results = service.files().list(q=query, spaces='drive').execute()
    items = results.get('files', [])

    if items:
        return items[0]['id']

    # Create new folder if none exists
    folder_metadata = {
        'name': username,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    folder = service.files().create(body=folder_metadata, fields='id').execute()
    return folder['id']


def get_unique_filename(service, folder_id: str, filename: str) -> str:
    """Generate unique filename if duplicate exists"""
    base_name, extension = os.path.splitext(filename)
    counter = 1
    current_name = filename

    while True:
        # Check if file exists
        query = f"name = '{current_name}' and '{folder_id}' in parents and trashed = false"
        results = service.files().list(q=query).execute()

        if not results.get('files'):
            return current_name

        current_name = f"{base_name}_{counter}{extension}"
        counter += 1


@router.post('/uploadtest')
async def document_upload(
        file: UploadFile = File(...),
        document: str = Form(...),
        username: str = Form(...)
):
    try:
        # Parse document data
        document_data = json.loads(document)
        parsed_document = FileBase(**document_data)

        # Initialize Drive service
        service = get_drive_service()

        # Get or create user folder
        folder_id = find_or_create_user_folder(service, username)

        # Get unique filename
        unique_filename = get_unique_filename(service, folder_id, file.filename)

        # Read file content
        content = await file.read()
        file_stream = io.BytesIO(content)

        # Prepare file metadata
        file_metadata = {
            'name': unique_filename,
            'parents': [folder_id]
        }

        # Upload file
        media = MediaIoBaseUpload(
            file_stream,
            mimetype=file.content_type,
            resumable=True
        )

        uploaded_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink'
        ).execute()

        return {
            "filename": unique_filename,
            "document": parsed_document,
            "file_size": len(content),
            "drive_file_id": uploaded_file['id'],
            "drive_view_link": uploaded_file['webViewLink']
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file to Google Drive: {str(e)}"
        )