# app/api/payments.py
from fastapi import APIRouter, Request, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.order import Order, OrderStatus
import hmac
import hashlib
import os

router = APIRouter(prefix="/api/payments", tags=["Payments & Webhooks"])

PAYMENT_SECRET_KEY = os.getenv("PAYMENT_SECRET_KEY", "your_payment_provider_secret")

@router.post("/webhook")
async def payment_webhook(request: Request, x_signature: str = Header(None, alias="x-provider-signature"), db: Session = Depends(get_db)):
    payload = await request.body()
    
    computed_signature = hmac.new(
        PAYMENT_SECRET_KEY.encode('utf-8'), 
        payload, 
        hashlib.sha512
    ).hexdigest()
    
    if computed_signature != x_signature:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    data = await request.json()
    
    if data.get("event") == "payment.success":
        order_id = data["data"]["metadata"]["order_id"]
        
        order = db.query(Order).filter(Order.id == order_id).first()
        if order and order.status == OrderStatus.PENDING_PAYMENT:
            order.status = OrderStatus.CONFIRMED
            db.commit()
            
    return {"status": "webhook received successfully"}