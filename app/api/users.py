# app/api/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User # <-- RoleEnum is gone!
from app.schemas.user import UserResponse, StaffCreate
from app.core.security import get_password_hash
from app.api.deps import get_super_admin_user # <-- Upgraded to Super Admin

router = APIRouter(prefix="/api/users", tags=["Admin User Management"])

@router.post("/staff", response_model=UserResponse, dependencies=[Depends(get_super_admin_user)])
def create_staff_account(staff_data: StaffCreate, db: Session = Depends(get_db)):
    # Check against standard string roles now
    if staff_data.role == "user":
        raise HTTPException(status_code=400, detail="Use the public register endpoint for customers")
    
    if staff_data.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=400, detail="Invalid role specified. Must be 'admin' or 'super_admin'")
        
    db_user = db.query(User).filter(User.email == staff_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(staff_data.password)
    new_staff = User(
        email=staff_data.email, 
        hashed_password=hashed_pw,
        role=staff_data.role
    )
    
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@router.get("/", response_model=List[UserResponse], dependencies=[Depends(get_super_admin_user)])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_super_admin_user) # Secure the endpoint
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 🏴‍☠️ MUTINY PROTECTION
    if user.role == "super_admin" and user.id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot deactivate another Super Admin.")
    
    user.is_active = False
    db.commit()
    return {"message": f"User {user.email} has been deactivated"}