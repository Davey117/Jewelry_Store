# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# 1. What the user sends us when they sign up
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None

# 🌟 For validating incoming profile updates
class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

# 2. What we send back to the user (Notice: NO password field)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str           # <-- RoleEnum is completely gone!
    is_active: bool
    created_at: datetime # <-- Added so your Admin Panel can see registration dates
    total_spent: float   # <-- Added so your Admin Panel can see VIP spending


    class Config:
        from_attributes = True  # Tells Pydantic to read data even if it's an ORM model

# 🌟 For returning profile data to the frontend
class UserProfileResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    loyalty_tier: str
    total_spent: float
    profile_image_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
# 🌟 For validation incoming reviews
class ReviewCreate(BaseModel):
    rating: int # 1-5
    comment: str

# 🌟 For returning reviews
class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: int
    comment: str
    created_at: datetime
    user_name: str # To display who wrote it

    class Config:
        from_attributes = True
# 3. What we send when they successfully log in
class Token(BaseModel):
    access_token: str
    token_type: str
    role : str
    first_name: Optional[str] = None

# 4. Password Reset Schemas
class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str