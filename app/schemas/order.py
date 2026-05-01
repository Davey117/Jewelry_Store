# app/schemas/order.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.order import OrderStatus

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: OrderStatus
    tracking_number: Optional[str]
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True