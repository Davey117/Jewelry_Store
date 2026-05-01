# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user import User # <-- RoleEnum is gone!

# This tells FastAPI where the login endpoint is, so it can build the Swagger UI docs properly
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT to get the user's email (stored in 'sub')
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Look up the user in the database
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Gatekeeper for standard Admins (Both Admins and Super Admins can pass)
def get_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not enough privileges. Admin access required.")
    return current_user

# Gatekeeper exclusively for Super Admins (Only Super Admins can pass)
def get_super_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not enough privileges. Super Admin access required.")
    return current_user