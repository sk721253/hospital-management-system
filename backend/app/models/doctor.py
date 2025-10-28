from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from ..database import Base

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    doctor_id = Column(String, unique=True, index=True)  # Hospital generated ID
    specialization = Column(String, nullable=False)
    qualification = Column(String, nullable=False)
    experience_years = Column(Integer)
    license_number = Column(String, unique=True)
    phone = Column(String, nullable=False)
    consultation_fee = Column(Float, default=0.0)
    about = Column(Text)
    
    # Availability (can be expanded to separate table)
    available_days = Column(String)  # JSON string: ["Monday", "Tuesday", ...]
    available_time_start = Column(String)  # e.g., "09:00"
    available_time_end = Column(String)  # e.g., "17:00"
    
    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor")