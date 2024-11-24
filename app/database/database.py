import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from dotenv import load_dotenv


load_dotenv()



DATABASE_URL = os.getenv('DATABASE_URL')

# creates database engine
engine = create_engine(DATABASE_URL)

# configures session to be used for database operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# serves as a base class which will be used as declarative models that will be created later
Base = declarative_base()

#creates a database session 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
