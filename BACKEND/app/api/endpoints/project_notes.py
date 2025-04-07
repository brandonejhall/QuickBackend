from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List
from app.database import get_db
from app.models.project_notes import ProjectNote
from app.schemas.project_notes import ProjectNoteCreate, ProjectNoteUpdate, ProjectNote as ProjectNoteSchema
from app.googledrivefunc.fileoperations import DriveFileOperations
from app.dependencies import get_drive_file_ops
from app.core.security import get_current_user, get_db_user
from app.models.user import Users, UserRole
from datetime import datetime
import io
from fastapi.responses import StreamingResponse
from io import BytesIO

router = APIRouter()

async def upload_project_note_file(file: UploadFile, drive_ops: DriveFileOperations):
    content = await file.read()
    content_io = io.BytesIO(content)
    
    # Use the existing check_and_save_file function
    drive_ops.check_and_save_file(file.filename, content_io, "project_notes")
    
    # Since check_and_save_file doesn't return the file info, we need to get it
    # Get the file ID from the folder
    folder_query = f"name = 'project_notes' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    folders = drive_ops.service.files().list(
        q=folder_query,
        spaces='drive',
        fields='files(id, name)'
    ).execute()
    
    folder_id = folders.get('files', [])[0]['id']
    
    # Find the file in the folder
    file_query = f"name = '{file.filename}' and '{folder_id}' in parents and trashed = false"
    files = drive_ops.service.files().list(
        q=file_query,
        spaces='drive',
        fields='files(id, name)'
    ).execute()
    
    file_info = files.get('files', [])[0]
    return file_info['id'], file_info['name'], file.content_type

async def delete_file_from_drive(file_id: str, drive_ops: DriveFileOperations):
    drive_ops.find_and_delete_files(file_id)

@router.post("/", response_model=ProjectNoteSchema)
async def create_project_note(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(None),
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    drive_ops: DriveFileOperations = Depends(get_drive_file_ops)
):
    current_user = get_db_user(current_user_email, db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create project notes")
    
    db_note = ProjectNote(
        title=title,
        description=description,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    if file:
        file_id, file_name, file_type = await upload_project_note_file(file, drive_ops)
        db_note.file_id = file_id
        db_note.file_name = file_name
        db_note.file_type = file_type
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/", response_model=List[ProjectNoteSchema])
async def get_project_notes(
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user = get_db_user(current_user_email, db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can access project notes")
    
    notes = db.query(ProjectNote).all()
    return notes

@router.get("/{note_id}", response_model=ProjectNoteSchema)
def get_project_note(
    note_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user = get_db_user(current_user_email, db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can view project notes")
    
    note = db.get(ProjectNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Project note not found")
    return note

@router.put("/{note_id}", response_model=ProjectNoteSchema)
async def update_project_note(
    note_id: int,
    note: ProjectNoteUpdate,
    file: UploadFile = File(None),
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user = get_db_user(current_user_email, db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can update project notes")
    
    db_note = db.get(ProjectNote, note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Project note not found")
    
    for key, value in note.model_dump(exclude_unset=True).items():
        setattr(db_note, key, value)
    
    if file:
        if db_note.file_id:
            await delete_file_from_drive(db_note.file_id)
        file_id, file_name, file_type = await upload_project_note_file(file, drive_ops)
        db_note.file_id = file_id
        db_note.file_name = file_name
        db_note.file_type = file_type
    
    db_note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/{note_id}")
async def delete_project_note(
    note_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    drive_ops: DriveFileOperations = Depends(get_drive_file_ops)
):
    try:
        current_user = get_db_user(current_user_email, db)
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only admins can delete project notes")
        
        note = db.get(ProjectNote, note_id)
        if not note:
            raise HTTPException(status_code=404, detail="Project note not found")
        
        if note.file_id:
            # Delete from Google Drive using the same pattern as document management
            drive_delete_count = drive_ops.find_and_delete_files(
                file_name=note.file_name,
                folder_name="project_notes"
            )
        
        db.delete(note)
        db.commit()
        
        return {
            "message": "Project note deleted successfully",
            "drive_files_deleted": drive_delete_count if note.file_id else 0,
            "note_id": note_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting project note: {str(e)}")

@router.get("/{note_id}/download")
async def download_project_note_file(
    note_id: int,
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    drive_ops: DriveFileOperations = Depends(get_drive_file_ops)
):
    try:
        current_user = get_db_user(current_user_email, db)
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only admins can download project note files")
        
        note = db.get(ProjectNote, note_id)
        if not note:
            raise HTTPException(status_code=404, detail="Project note not found")
        
        if not note.file_id:
            raise HTTPException(status_code=404, detail="No file attached to this note")
        
        try:
            # Download file from Google Drive
            file_content = drive_ops.download_file(note.file_name, "project_notes")
            
            # Determine content type based on file extension
            content_type = 'application/octet-stream'  # default
            if note.file_name.lower().endswith('.pdf'):
                content_type = 'application/pdf'
            elif note.file_name.lower().endswith('.docx'):
                content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            elif note.file_name.lower().endswith('.txt'):
                content_type = 'text/plain'
            
            return StreamingResponse(
                BytesIO(file_content),
                media_type=content_type,
                headers={
                    'Content-Disposition': f'attachment; filename="{note.file_name}"',
                    'Content-Length': str(len(file_content))
                }
            )
        except Exception as e:
            print(f"Error downloading file from Google Drive: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error downloading file from storage: {str(e)}"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing download request: {str(e)}") 