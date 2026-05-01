from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base # Adjust import if needed based on your setup

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    role = Column(String, default="user", nullable=False) 
    is_active = Column(Boolean, default=True)
    
    # 👑 Hierarchical Role System
    # Valid options: "user", "admin", "super_admin"
    role = Column(String, default="user", nullable=False) 
    
    # ⏱️ Loyalty Tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 💰 VIP Spending Tracker
    total_spent = Column(Float, default=0.0)