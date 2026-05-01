# app/api/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User 
from app.schemas.user import UserResponse
from app.api.deps import get_super_admin_user 

router = APIRouter(prefix="/api/users", tags=["Admin User Management"])

# 1. A small schema just for receiving the new role from the frontend
class RoleUpdateRequest(BaseModel):
    new_role: str

# 2. Get all users (Super Admin Only)
@router.get("/", response_model=List[UserResponse], dependencies=[Depends(get_super_admin_user)])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# 3. Promote or Demote a user (Replaces the old "create staff" method)
@router.patch("/{user_id}/role")
def update_user_role(
    user_id: int,
    role_req: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_super_admin_user)
):
    if role_req.new_role not in ["user", "admin", "super_admin"]:
        raise HTTPException(status_code=400, detail="Invalid role provided.")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 🏴‍☠️ MUTINY PROTECTION 
    if target_user.role == "super_admin" and target_user.id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot modify another Super Admin's role.")
    
    target_user.role = role_req.new_role
    db.commit()
    return {"message": f"User {target_user.email} successfully updated to {role_req.new_role}."}

# 4. Deactivate a user
@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_super_admin_user)
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