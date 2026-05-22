# backend/app/schemas/order.py
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.models.order import OrderStatus
from app.schemas.product import ProductResponse

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    price_at_purchase: float

class OrderCreate(BaseModel):
    total_amount: float
    items: List[OrderItemCreate]
    payment_method: str 
    shipping_address: str

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)

class OrderUserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)

class CryptoPaymentSubmit(BaseModel):
    crypto_currency: str
    crypto_network: str
    crypto_tx_hash: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class GiftCardSubmitItem(BaseModel):
    card_type: str
    code: str
    claimed_amount: float

# 🌟 Schema for viewing gift card details from the admin panel
class GiftCardResponseItem(BaseModel):
    id: int
    order_id: int
    card_type: str
    code: str
    claimed_amount: float
    image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: OrderStatus
    tracking_number: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse]
    user: OrderUserResponse
    payment_method: str
    shipping_address: str
    crypto_currency: Optional[str] = None
    crypto_network: Optional[str] = None
    crypto_tx_hash: Optional[str] = None
    gift_cards: List[GiftCardResponseItem] = []

    model_config = ConfigDict(from_attributes=True)

