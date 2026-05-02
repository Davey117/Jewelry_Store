import resend
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from itsdangerous import URLSafeTimedSerializer
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    SECRET_KEY, 
    RESEND_API_KEY, 
    GOOGLE_CLIENT_ID,
    create_password_reset_token,
    verify_password_reset_token
)
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, ForgotPassword, ResetPassword

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Initialize Email Serializer and Resend
serializer = URLSafeTimedSerializer(SECRET_KEY)
resend.api_key = RESEND_API_KEY

# --- Branded Email Helper ---

def send_branded_email(to_email: str, subject: str, title: str, body_text: str, button_text: str, button_url: str):
    """Sends a luxury-themed HTML email via Resend"""
    html_content = f"""
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
                <h1 style="color: #d4af37; margin: 0; letter-spacing: 4px; text-transform: uppercase; font-size: 24px;">Aurum & Co.</h1>
                <p style="color: #ffffff; font-size: 12px; margin-top: 5px; opacity: 0.8; letter-spacing: 2px;">FINE JEWELRY & LUXURY</p>
            </div>
            <div style="padding: 40px; text-align: center;">
                <h2 style="color: #1a1a1a; margin-bottom: 20px;">{title}</h2>
                <p style="line-height: 1.6; color: #666; margin-bottom: 30px;">{body_text}</p>
                <a href="{button_url}" style="display: inline-block; padding: 16px 32px; background-color: #d4af37; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 4px; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">{button_text}</a>
            </div>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #999;">
                <p>If you did not request this email, please ignore it.</p>
                <p>&copy; 2026 Aurum & Co. | Lagos, Nigeria</p>
            </div>
        </div>
    </div>
    """
    try:
        resend.Emails.send({{
            "from": "Aurum & Co. <onboarding@resend.dev>",
            "to": to_email,
            "subject": f"Aurum & Co. | {subject}",
            "html": html_content
        }})
    except Exception as e:
        print(f"Failed to send branded email: {{e}}")

# --- Endpoints ---

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user_data.email, 
        hashed_password=get_password_hash(user_data.password),
        is_active=False,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = serializer.dumps(user_data.email, salt="email-confirm")
    # Change this to your live Render URL when ready
    verify_url = f"http://localhost:5173/verify-email?token={{token}}"

    background_tasks.add_task(
        send_branded_email,
        user_data.email,
        "Verify Your Account",
        "Welcome to the Inner Circle",
        "Your journey with Aurum & Co. begins here. Please verify your email to access our exclusive collections and personalized services.",
        "Activate Account",
        verify_url
    )
    return new_user

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        email = serializer.loads(token, salt="email-confirm", max_age=3600)
    except Exception:
        raise HTTPException(status_code=400, detail="Link invalid or expired")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = True
    db.commit()
    return {{"message": "Welcome back! Your account is now active."}}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Please activate your account via email before logging in.")
    
    access_token = create_access_token(data={{"sub": user.email}})
    return {{"access_token": access_token, "token_type": "bearer"}}

# --- Google OAuth ---

class GoogleToken(BaseModel):
    token: str

@router.post("/google", response_model=Token)
def google_login(data: GoogleToken, db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(data.token, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']

        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, hashed_password="oauth_managed", is_active=True, role="user")
            db.add(user)
            db.commit()
            db.refresh(user)

        access_token = create_access_token(data={{"sub": user.email}})
        return {{"access_token": access_token, "token_type": "bearer"}}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google authentication")

# --- Password Reset ---

@router.post("/forgot-password")
async def forgot_password(request: ForgotPassword, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        token = create_password_reset_token(email=user.email)
        reset_url = f"http://localhost:5173/reset-password?token={{token}}"
        
        background_tasks.add_task(
            send_branded_email,
            user.email,
            "Reset Your Password",
            "Secure Your Account",
            "We received a request to reset your password. If this was you, please click the link below to choose a new one.",
            "Reset Password",
            reset_url
        )
    return {{"message": "If the account exists, a secure reset link has been sent."}}

@router.post("/reset-password")
def reset_password(request: ResetPassword, db: Session = Depends(get_db)):
    email = verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="The reset link is invalid or has expired.")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {{"message": "Your password has been successfully updated."}}