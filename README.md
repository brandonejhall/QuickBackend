# Document Management System

A full-stack document management system built with FastAPI (backend) and Next.js (frontend), featuring Google Drive integration, user authentication, and role-based access control.

## Features

- **User Authentication**: JWT-based authentication with role-based access (Admin/User)
- **Document Management**: Upload, download, and delete documents
- **Google Drive Integration**: Automatic file storage and retrieval
- **Admin Dashboard**: User management and document oversight
- **Project Notes**: Create and manage project notes with file attachments
- **Responsive Design**: Modern UI built with Tailwind CSS and Radix UI
- **Real-time Updates**: Live document list updates
- **Pagination**: Efficient document loading with pagination support

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Primary database
- **Alembic**: Database migrations
- **Google Drive API**: File storage integration
- **JWT**: Authentication tokens
- **Uvicorn**: ASGI server

### Frontend
- **Next.js 15**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible components
- **Axios**: HTTP client
- **React Hook Form**: Form handling
- **Zod**: Schema validation

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Google Cloud Platform account (for Google Drive API)

## Project Structure

```
QuickBackend/
├── BACKEND/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── database/
│   │   └── dependencies/
│   ├── alembic/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
└── FRONTEND/
    └── document-management-system/
        ├── components/
        ├── context/
        ├── lib/
        ├── pages/
        └── package.json
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd QuickBackend
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd BACKEND
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Environment Configuration

Create a `.env` file in the `BACKEND` directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/document_management

# JWT Secret
SECRET_KEY=your-secret-key-here

# Google Drive API
GOOGLE_CREDENTIALS_FILE=path/to/your/credentials.json

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# Server Configuration
PORT=8000
```

#### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE document_management;
```

2. Run database migrations:
```bash
alembic upgrade head
```

#### Google Drive API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Create service account credentials
5. Download the JSON credentials file
6. Update the `GOOGLE_CREDENTIALS_FILE` path in your `.env`

#### Start the Backend Server

```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
python main.py
```

The API will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Node.js Dependencies

```bash
cd FRONTEND/document-management-system
npm install
```

#### Environment Configuration

Create a `.env.local` file in the `FRONTEND/document-management-system` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production, use your deployed backend URL
# NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

#### Start the Frontend Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Development

### Backend Development

#### Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

#### API Documentation

Access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Development

#### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

### Backend Deployment (Render/Heroku)

1. **Render**:
   - Connect your GitHub repository
   - Set environment variables in Render dashboard
   - Deploy automatically on push

2. **Heroku**:
   ```bash
   heroku create your-app-name
   heroku config:set DATABASE_URL=your-postgres-url
   git push heroku main
   ```

### Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL
3. Deploy automatically on push

## Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `SECRET_KEY` | JWT secret key | `your-secret-key-here` |
| `GOOGLE_CREDENTIALS_FILE` | Path to Google service account JSON | `./credentials.json` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000,https://app.com` |
| `PORT` | Server port | `8000` |

### Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Documents
- `GET /api/documents/documents/{email}` - Get user documents
- `POST /api/documents/upload` - Upload document
- `DELETE /api/documents/delete/{id}` - Delete document
- `GET /api/documents/download/{email}/{filename}` - Download document

### Project Notes
- `GET /api/project-notes` - Get all project notes
- `POST /api/project-notes` - Create project note
- `PUT /api/project-notes/{id}` - Update project note
- `DELETE /api/project-notes/{id}` - Delete project note

## Testing

### Backend Testing

```bash
# Run tests (if implemented)
pytest

# Test API endpoints
curl -X GET http://localhost:8000/api/documents/
```

### Frontend Testing

```bash
# Run tests (if implemented)
npm test

# Run linting
npm run lint
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify PostgreSQL is running
   - Check `DATABASE_URL` in `.env`
   - Ensure database exists

2. **Google Drive API Error**:
   - Verify credentials file path
   - Check service account permissions
   - Ensure Google Drive API is enabled

3. **CORS Error**:
   - Update `ALLOWED_ORIGINS` in backend `.env`
   - Check frontend `NEXT_PUBLIC_API_URL`

4. **Authentication Issues**:
   - Verify `SECRET_KEY` is set
   - Check JWT token expiration
   - Clear browser localStorage

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reloading
2. **Database Reset**: Use `alembic downgrade base` then `alembic upgrade head`
3. **Environment Variables**: Always restart servers after changing `.env` files
4. **Google Drive**: Test with small files first

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation at `/docs`
3. Create an issue in the repository 