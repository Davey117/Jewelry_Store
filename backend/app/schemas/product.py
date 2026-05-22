# backend/app/schemas/product.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- CATEGORY SCHEMAS ---
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True


# --- PRODUCT SCHEMAS ---
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    stock_quantity: int
    category_id: int
    color: str
    size: Optional[str] = None  # 🌟 Added

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category_id: Optional[int] = None
    color: Optional[str] = None
    size: Optional[str] = None  # 🌟 Added
    is_active: Optional[bool] = None
    main_image_url: Optional[str] = None
    additional_images: Optional[List[str]] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    stock_quantity: int
    category_id: int
    color: str
    size: Optional[str] = None  # 🌟 Added
    main_image_url: Optional[str] = None
    additional_images: List[str] = []
    is_active: bool
    category: Optional[CategoryResponse] = None
    created_at: Optional[datetime] = None
    added_by_id: Optional[int] = None
    added_by_name: Optional[str] = "Unknown"

    class Config:
        from_attributes = True