from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .api import auth, patients, doctors, appointments
from .models import user, patient, doctor, appointment as appointment_model
from .utils.security import get_password_hash
from .models.user import User, UserRole
from sqlalchemy.orm import Session

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hospital Management System API",
    description="Cloud-based Hospital Management System",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(doctors.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")

@app.on_event("startup")
def startup_event():
    """Create default admin user if not exists"""
    db = Session(bind=engine)
    try:
        admin = db.query(User).filter(User.email == "admin@hospital.com").first()
        if not admin:
            admin_user = User(
                email="admin@hospital.com",
                username="admin",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Default admin user created: admin@hospital.com / admin123")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "message": "Hospital Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}