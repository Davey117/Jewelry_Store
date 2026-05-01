# app/api/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User  # <-- RoleEnum is gone!
from app.schemas.order import OrderCreate, OrderResponse
from app.api.deps import get_current_active_user, get_admin_user # <-- Swapped get_staff_user for get_admin_user

router = APIRouter(prefix="/api/orders", tags=["Orders & Checkout"])

@router.post("/checkout", response_model=OrderResponse)
def checkout(order_data: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    total_amount = 0.0
    order_items = []

    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found or inactive")
        
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product '{product.name}'")
        
        product.stock_quantity -= item.quantity
        
        total_amount += product.price * item.quantity
        order_items.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "price_at_purchase": product.price
        })

    new_order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status=OrderStatus.PENDING_PAYMENT
    )
    db.add(new_order)
    db.flush() 

    for item_data in order_items:
        db_order_item = OrderItem(
            order_id=new_order.id,
            **item_data
        )
        db.add(db_order_item)

    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 🛡️ Both admin levels can view all store orders
    if current_user.role in ["admin", "super_admin"]:
        return db.query(Order).all()
    # Regular users only see their own orders
    return db.query(Order).filter(Order.user_id == current_user.id).all()

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: int, status: OrderStatus, tracking_number: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status
    if tracking_number and status == OrderStatus.SHIPPED:
        order.tracking_number = tracking_number
        
    db.commit()
    db.refresh(order)
    return order