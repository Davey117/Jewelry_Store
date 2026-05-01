# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from app.models.user import RoleEnum

# 1. What the user sends us when they sign up
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# 2. What we send back to the user (Notice: NO password field)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: RoleEnum
    is_active: bool

    class Config:
        from_attributes = True  # Tells Pydantic to read data even if it's an ORM model

# 3. What we send when they successfully log in
class Token(BaseModel):
    access_token: str
    token_type: str

# app/schemas/user.py (Append these to your existing file)
class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str

# app/schemas/user.py (Append this to your existing file)
class StaffCreate(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum