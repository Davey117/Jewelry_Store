# app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password and save to DB
    hashed_pw = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_pw)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm strictly requires 'username' and 'password' fields. 
    # In our case, username represents the email.
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Verify both email existence and password match
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Generate JWT
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# app/api/auth.py (Append these endpoints to your existing file)
from app.schemas.user import ForgotPassword, ResetPassword
from app.core.security import create_password_reset_token, verify_password_reset_token

@router.post("/forgot-password")
def forgot_password(request: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        reset_token = create_password_reset_token(email=user.email)
        # TODO: Integrate an email service (like SendGrid or AWS SES) here.
        # For now, we will print the token to the terminal so you can test it.
        print(f"--- PASSWORD RESET TOKEN FOR {user.email} ---")
        print(reset_token)
        print("---------------------------------------------")
        
    # Always return the same message, even if the email doesn't exist
    return {"message": "If the email exists in our system, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(request: ResetPassword, db: Session = Depends(get_db)):
    email = verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password has been successfully updated"}