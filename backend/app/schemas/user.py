# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from datetime import datetime

# 1. What the user sends us when they sign up
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# 2. What we send back to the user (Notice: NO password field)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str           # <-- RoleEnum is completely gone!
    is_active: bool
    created_at: datetime # <-- Added so your Admin Panel can see registration dates
    total_spent: float   # <-- Added so your Admin Panel can see VIP spending

    class Config:
        from_attributes = True  # Tells Pydantic to read data even if it's an ORM model

# 3. What we send when they successfully log in
class Token(BaseModel):
    access_token: str
    token_type: str

# 4. Password Reset Schemas
class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str