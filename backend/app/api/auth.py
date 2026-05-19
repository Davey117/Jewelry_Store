import os
import resend
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, Response
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from itsdangerous import URLSafeTimedSerializer
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel
from jose import jwt, JWTError, ExpiredSignatureError

from app.core.database import get_db
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    create_refresh_token,
    SECRET_KEY, 
    RESEND_API_KEY, 
    GOOGLE_CLIENT_ID,
    create_password_reset_token,
    verify_password_reset_token
)
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, ForgotPassword, ResetPassword

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

serializer = URLSafeTimedSerializer(SECRET_KEY)
resend.api_key = RESEND_API_KEY

# Use environment variable for frontend URL, fallback to localhost for development
FRONTEND_URL = os.getenv("VITE_API_BASE_URL", "http://localhost:5173")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except ExpiredSignatureError:
        # ✨ This tells the frontend axios interceptor to boot them out to /login
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Session expired. Please log in again."
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

class RoleUpdate(BaseModel):
    role: str

def send_branded_email(to_email: str, subject: str, title: str, body_text: str, button_text: str, button_url: str):
    # 🌟 FIX: Pull sender configurations dynamically from your Render environment variables
    mail_from_address = os.getenv("MAIL_FROM_ADDRESS", "onboarding@resend.dev")
    mail_from_name = os.getenv("MAIL_FROM_NAME", "Aurum & Co.")
    sender_identity = f"{mail_from_name} <{mail_from_address}>"

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
        resend.Emails.send({
            "from": sender_identity, # 🌟 Fixed to use dynamic identity
            "to": [to_email],
            "subject": f"Aurum & Co. | {subject}",
            "html": html_content
        })
    except Exception as e:
        print(f"Failed to send branded email: {str(e)}")

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Look for an existing user account with this email address
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    
    if existing_user:
        # If the account is already fully active, reject the request
        if existing_user.is_active:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # 🌟 FIX: If the account is inactive, overwrite it with the fresh signup credentials
        existing_user.hashed_password = get_password_hash(user_data.password)
        existing_user.first_name = user_data.first_name
        existing_user.last_name = user_data.last_name
        existing_user.phone = user_data.phone
        existing_user.address = user_data.address
        
        db.commit()
        db.refresh(existing_user)
        user_to_verify = existing_user
    else:
        # Create a completely new user entry if the email doesn't exist yet
        new_user = User(
            email=user_data.email, 
            hashed_password=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            address=user_data.address,
            is_active=False,
            role="user"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user_to_verify = new_user

    # Generate a brand new, unexpired email confirmation token sequence
    token = serializer.dumps(user_data.email, salt="email-confirm")
    verify_url = f"{FRONTEND_URL}/verify-email?token={token}"

    background_tasks.add_task(
        send_branded_email,
        user_data.email,
        "Verify Your Account",
        f"Welcome, {user_data.first_name}",
        "Your journey with Aurum & Co. begins here. Please verify your email to access our exclusive collections and personalized services.",
        "Activate Account",
        verify_url
    )
    
    return user_to_verify

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
    return {"message": "Welcome back! Your account is now active."}

@router.post("/login", response_model=Token)
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Please activate your account via email first.")
    
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,            
        secure=True,              
        samesite="lax",           
        max_age=7 * 24 * 60 * 60  
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "first_name": user.first_name
    }

@router.post("/refresh")
def refresh_session(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Session signature absent.")
        
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Malformed token classification.")
            
        email: str = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Owner reference no longer available.")
            
        new_access_token = create_access_token(data={"sub": user.email})
        return {"access_token": new_access_token, "token_type": "bearer"}
        
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please re-authenticate.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Compromised validation signature.")

class GoogleToken(BaseModel):
    token: str

@router.post("/google", response_model=Token)
def google_login(data: GoogleToken, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(data.token, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']

        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email, 
                hashed_password="oauth_managed", 
                first_name=idinfo.get('given_name', ''),
                last_name=idinfo.get('family_name', ''),
                is_active=True, 
                role="user"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            shop_url = f"{FRONTEND_URL}/catalog"
            background_tasks.add_task(
                send_branded_email,
                user.email,
                "Welcome to the Inner Circle",
                f"Welcome, {user.first_name}",
                "Your journey with Aurum & Co. begins here. Thank you for joining us via Google.",
                "Explore The Collection",
                shop_url
            )

        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer", "role": user.role, "first_name": user.first_name}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google authentication")

@router.post("/forgot-password")
async def forgot_password(request: ForgotPassword, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        token = create_password_reset_token(email=user.email)
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        
        background_tasks.add_task(
            send_branded_email,
            user.email,
            "Reset Your Password",
            "Secure Your Account",
            "We received a request to reset your password. If this was you, please click the link below to choose a new one.",
            "Reset Password",
            reset_url
        )
    return {"message": "If the account exists, a secure reset link has been sent."}

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
    return {"message": "Your password has been successfully updated."}

@router.get("/users", response_model=list[UserResponse])
def get_all_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized. Super Admins only.")
    return db.query(User).all()

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, request: RoleUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized. Super Admins only.")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role.")

    target_user.role = request.role
    db.commit()
    return {"message": f"User updated to {request.role}"}