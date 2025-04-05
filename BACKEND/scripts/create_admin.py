from app.database import SessionLocal
from app.models import Users, UserRole
from app.core.security import hash_password_bcrypt

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(Users).filter(Users.role == UserRole.ADMIN).first()
        if admin:
            print("Admin user already exists")
            return

        # Create admin user
        admin_user = Users(
            email="admin@example.com",  # Change this to your desired admin email
            fullname="Admin User",
            password=hash_password_bcrypt("admin123"),  # Change this to your desired password
            role=UserRole.ADMIN
        )

        db.add(admin_user)
        db.commit()
        print("Admin user created successfully")
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin() 