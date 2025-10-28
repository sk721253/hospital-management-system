from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, cast
from ..database import get_db
from ..models.user import User, UserRole
from ..models.doctor import Doctor
from ..schemas import DoctorCreate, DoctorResponse, DoctorUpdate
from ..utils.security import get_password_hash, get_current_active_user

router = APIRouter(prefix="/doctors", tags=["Doctors"])

def generate_doctor_id(db: Session) -> str:
    last_doctor = db.query(Doctor).order_by(Doctor.id.desc()).first()
    if last_doctor is not None:
        last_id = cast(Optional[str], getattr(last_doctor, "doctor_id", None))
        if last_id:
            last_num = int(last_id.split("-")[1])
            return f"DOC-{last_num + 1:05d}"
    return "DOC-00001"

@router.post("/register", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def register_doctor(
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Only admins can register doctors
    user_role = cast(UserRole, current_user.role)
    if user_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can register doctors"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == doctor_data.user.email) | (User.username == doctor_data.user.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Create user
    user = User(
        email=doctor_data.user.email,
        username=doctor_data.user.username,
        full_name=doctor_data.user.full_name,
        hashed_password=get_password_hash(doctor_data.user.password),
        role=UserRole.DOCTOR
    )
    db.add(user)
    db.flush()
    
    # Create doctor profile
    doctor = Doctor(
        user_id=user.id,
        doctor_id=generate_doctor_id(db),
        specialization=doctor_data.specialization,
        qualification=doctor_data.qualification,
        phone=doctor_data.phone,
        experience_years=doctor_data.experience_years,
        license_number=doctor_data.license_number,
        consultation_fee=doctor_data.consultation_fee,
        about=doctor_data.about,
        available_days=doctor_data.available_days,
        available_time_start=doctor_data.available_time_start,
        available_time_end=doctor_data.available_time_end
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    
    return doctor

@router.get("/", response_model=List[DoctorResponse])
def get_all_doctors(
    skip: int = 0,
    limit: int = 100,
    specialization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Doctor)
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))
    
    doctors = query.offset(skip).limit(limit).all()
    return doctors

@router.get("/me", response_model=DoctorResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user_role = cast(UserRole, current_user.role)
    if user_role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a doctor account"
        )
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    return doctor

@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check permissions
    user_role = cast(UserRole, current_user.role)
    if user_role == UserRole.DOCTOR and cast(int, getattr(doctor, "user_id", None)) != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    elif user_role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Update fields
    update_data = doctor_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doctor, field, value)
    
    db.commit()
    db.refresh(doctor)
    return doctor