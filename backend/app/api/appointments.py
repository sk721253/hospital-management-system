from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, cast
from datetime import datetime
from ..database import get_db
from ..models.user import User, UserRole
from ..models.appointment import Appointment, AppointmentStatus
from ..models.patient import Patient
from ..models.doctor import Doctor
from ..schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from ..utils.security import get_current_active_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def generate_appointment_number(db: Session) -> str:
    last_appointment = db.query(Appointment).order_by(Appointment.id.desc()).first()
    if last_appointment is not None:
        # static analyzers can treat ORM attributes as Column[...] types; cast to Optional[str]
        last_num_str = cast(Optional[str], getattr(last_appointment, "appointment_number", None))
        if last_num_str:
            last_num = int(last_num_str.split("-")[1])
            return f"APT-{last_num + 1:06d}"
    return "APT-000001"

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get patient
    user_role = cast(UserRole, current_user.role)
    if user_role == UserRole.PATIENT:
        patient = cast(Optional[Patient], db.query(Patient).filter(Patient.user_id == current_user.id).first())
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can book appointments"
        )
    
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == appointment_data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if appointment time is in the future
    if appointment_data.appointment_date <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment date must be in the future"
        )
    
    # Create appointment
    appointment = Appointment(
        appointment_number=generate_appointment_number(db),
        patient_id=patient.id,
        doctor_id=appointment_data.doctor_id,
        appointment_date=appointment_data.appointment_date,
        reason=appointment_data.reason,
        status=AppointmentStatus.PENDING
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    return appointment

@router.get("/", response_model=List[AppointmentResponse])
def get_appointments(
    skip: int = 0,
    limit: int = 100,
    status: Optional[AppointmentStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Appointment)

    # Filter based on user role
    user_role = cast(UserRole, current_user.role)
    if user_role == UserRole.PATIENT:
        patient = cast(Optional[Patient], db.query(Patient).filter(Patient.user_id == current_user.id).first())
        if patient is not None:
            query = query.filter(Appointment.patient_id == patient.id)
    elif user_role == UserRole.DOCTOR:
        doctor = cast(Optional[Doctor], db.query(Doctor).filter(Doctor.user_id == current_user.id).first())
        if doctor is not None:
            query = query.filter(Appointment.doctor_id == doctor.id)
    
    # Filter by status if provided
    if status:
        query = query.filter(Appointment.status == status)
    
    appointments = query.order_by(Appointment.appointment_date.desc()).offset(skip).limit(limit).all()
    return appointments

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check permissions
    user_role = cast(UserRole, current_user.role)
    if user_role == UserRole.PATIENT:
        patient = cast(Optional[Patient], db.query(Patient).filter(Patient.user_id == current_user.id).first())
        if patient is not None:
            if cast(int, getattr(appointment, "patient_id", None)) != patient.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
    elif user_role == UserRole.DOCTOR:
        doctor = cast(Optional[Doctor], db.query(Doctor).filter(Doctor.user_id == current_user.id).first())
        if doctor is not None:
            if cast(int, getattr(appointment, "doctor_id", None)) != doctor.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
    
    return appointment

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check permissions
    user_role = cast(UserRole, current_user.role)
    if user_role == UserRole.PATIENT:
        patient = cast(Optional[Patient], db.query(Patient).filter(Patient.user_id == current_user.id).first())
        if patient is not None and cast(int, getattr(appointment, "patient_id", None)) != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        # Patients can only update date and cancel
        if appointment_update.status and appointment_update.status not in [
            AppointmentStatus.CANCELLED, AppointmentStatus.PENDING
        ]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Patients can only cancel appointments"
            )
    elif user_role == UserRole.DOCTOR:
        doctor = cast(Optional[Doctor], db.query(Doctor).filter(Doctor.user_id == current_user.id).first())
        if doctor is not None and cast(int, getattr(appointment, "doctor_id", None)) != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # Update fields
    update_data = appointment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    db.commit()
    db.refresh(appointment)
    return appointment

@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Only admin or the patient who booked can delete
    user_role = cast(UserRole, current_user.role)
    if user_role == UserRole.PATIENT:
        patient = cast(Optional[Patient], db.query(Patient).filter(Patient.user_id == current_user.id).first())
        if patient is not None and cast(int, getattr(appointment, "patient_id", None)) != patient.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif user_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(appointment)
    db.commit()
    return {"message": "Appointment deleted successfully"}