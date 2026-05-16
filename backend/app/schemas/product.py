from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int
    category_id: int # ✨ Required
    color: str # ✨ Required
    main_image_url: Optional[str] = None
    additional_images: Optional[List[str]] = [] # ✨ List of strings

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category_id: Optional[int] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    main_image_url: Optional[str] = None
    additional_images: Optional[List[str]] = None

class ProductResponse(ProductBase):
    id: int
    is_active: bool
    category: Optional[CategoryResponse] = None
    added_by_name: str 
    created_at: datetime
    added_by_name: Optional[str] = "Unknown"

    class Config:
        from_attributes = True