from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models.user import User, UserRole
from ..models.patient import Patient
from ..schemas import PatientCreate, PatientResponse, PatientUpdate
from ..utils.security import get_password_hash, get_current_active_user

router = APIRouter(prefix="/patients", tags=["Patients"])

def generate_patient_id(db: Session) -> str:
    last_patient = db.query(Patient).order_by(Patient.id.desc()).first()
    if last_patient and last_patient.patient_id:
        last_num = int(last_patient.patient_id.split("-")[1])
        return f"PAT-{last_num + 1:05d}"
    return "PAT-00001"

@router.post("/register", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(patient_data: PatientCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == patient_data.user.email) | (User.username == patient_data.user.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Create user
    user = User(
        email=patient_data.user.email,
        username=patient_data.user.username,
        full_name=patient_data.user.full_name,
        hashed_password=get_password_hash(patient_data.user.password),
        role=UserRole.PATIENT
    )
    db.add(user)
    db.flush()
    
    # Create patient profile
    patient = Patient(
        user_id=user.id,
        patient_id=generate_patient_id(db),
        date_of_birth=patient_data.date_of_birth,
        gender=patient_data.gender,
        blood_group=patient_data.blood_group,
        phone=patient_data.phone,
        address=patient_data.address,
        emergency_contact=patient_data.emergency_contact,
        emergency_contact_name=patient_data.emergency_contact_name,
        medical_history=patient_data.medical_history,
        allergies=patient_data.allergies,
        current_medications=patient_data.current_medications
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    return patient

@router.get("/", response_model=List[PatientResponse])
def get_all_patients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients

@router.get("/me", response_model=PatientResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a patient account"
        )
    
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    return patient

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if current_user.role == UserRole.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if current_user.role == UserRole.PATIENT and patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Update fields
    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    return patient