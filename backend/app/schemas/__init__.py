from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date
from ..models.user import UserRole
from ..models.patient import BloodGroup, Gender
from ..models.appointment import AppointmentStatus

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Patient Schemas
class PatientBase(BaseModel):
    date_of_birth: date
    gender: Gender
    phone: str
    blood_group: Optional[BloodGroup] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None

class PatientCreate(PatientBase):
    user: UserCreate

class PatientUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    patient_id: str
    user: UserResponse
    
    class Config:
        from_attributes = True

# Doctor Schemas
class DoctorBase(BaseModel):
    specialization: str
    qualification: str
    phone: str
    experience_years: Optional[int] = None
    license_number: Optional[str] = None
    consultation_fee: Optional[float] = 0.0
    about: Optional[str] = None
    available_days: Optional[str] = None
    available_time_start: Optional[str] = None
    available_time_end: Optional[str] = None

class DoctorCreate(DoctorBase):
    user: UserCreate

class DoctorUpdate(BaseModel):
    phone: Optional[str] = None
    consultation_fee: Optional[float] = None
    about: Optional[str] = None
    available_days: Optional[str] = None
    available_time_start: Optional[str] = None
    available_time_end: Optional[str] = None

class DoctorResponse(DoctorBase):
    id: int
    doctor_id: str
    user: UserResponse
    
    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentBase(BaseModel):
    appointment_date: datetime
    reason: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    doctor_id: int

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    prescription: Optional[str] = None
    diagnosis: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: int
    appointment_number: str
    status: AppointmentStatus
    notes: Optional[str] = None
    prescription: Optional[str] = None
    diagnosis: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Login Schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str