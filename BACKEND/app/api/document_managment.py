from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Files, Users

router = APIRouter()

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
            formatted_uploads.append({
                'id': file.id,
                'filename': file.filename,
                'document_type': file.document_type,
                'created_at': file.created_at,
                'user': {
                    'email': user.email,
                    'fullname': user.fullname
                }
            })

        print("Formatted uploads:", formatted_uploads)
        return formatted_uploads

    except Exception as e:
        print(f"Error in get_recent_uploads: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching recent uploads: {str(e)}"
        ) 