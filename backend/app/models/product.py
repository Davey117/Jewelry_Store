from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    # Relationship to link category to its products
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False) # ✨ Now Required!
    is_active = Column(Boolean, default=True)
    
    # ✨ NEW FIELDS
    color = Column(String, default="None") # Gold, Silver, None
    main_image_url = Column(String, nullable=True)
    additional_images = Column(JSON, default=list) # Stores a list of extra image links
    
    created_at = Column(DateTime, default=datetime.utcnow)
    added_by_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    category = relationship("Category", back_populates="products")
    added_by = relationship("User")