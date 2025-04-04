from sqlalchemy import String, Integer, Column
from sqlalchemy.orm import relationship
from .base import Base




class Users(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True,nullable=False)
    email = Column(String, nullable=False , index=True)
    password = Column(String,  nullable=False,  index=True)
    fullname = Column(String, nullable=False, index=True)
    files = relationship("Files", back_populates="users")



