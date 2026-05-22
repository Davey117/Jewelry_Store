# backend/app/api/orders.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.order import Order, OrderItem, OrderStatus, OrderGiftCard  # 🌟 Added OrderGiftCard
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate, CryptoPaymentSubmit
from app.api.auth import get_current_user
from app.utils.email import send_order_email
from app.utils.cloudinary import upload_image  # 🌟 Added Cloudinary tool import

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order: OrderCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Creates an order instantly in 'pending_payment' state.
    Handles product line verification, inventory reduction, and database assignment.
    """
    new_order = Order(
        user_id=current_user.id,
        total_amount=order.total_amount,
        payment_method=order.payment_method,      
        shipping_address=order.shipping_address,  
        status="pending_payment"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Process inventory and save structural individual items
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock_quantity = max(0, product.stock_quantity - item.quantity)
        
        db_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_purchase=item.price_at_purchase
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(new_order)

    # Only fire immediate emails if it isn't a custom payment workflow
    if new_order.payment_method not in ["crypto", "gift_card"]:
        customer_name = f"{current_user.first_name} {current_user.last_name}"
        background_tasks.add_task(
            send_order_email, 
            current_user.email, 
            customer_name, 
            new_order.id, 
            new_order.status, 
            new_order.total_amount
        )

    return new_order


@router.post("/{order_id}/submit-crypto")
def submit_crypto_details(
    order_id: int, 
    background_tasks: BackgroundTasks, 
    payment_in: CryptoPaymentSubmit, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Saves selected crypto parameters and transaction identifier tokens.
    Moves the lifecycle state up to wait for manual system verification.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order context mapping not found")
        
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this order.")
        
    order.crypto_currency = payment_in.crypto_currency
    order.crypto_network = payment_in.crypto_network
    order.crypto_tx_hash = payment_in.crypto_tx_hash
    order.status = "pending_confirmation"  # 🌟 Updated to match manual review queues
    
    db.commit()
    db.refresh(order)

    customer_name = f"{current_user.first_name} {current_user.last_name}"
    background_tasks.add_task(
        send_order_email, 
        current_user.email, 
        customer_name, 
        order.id, 
        order.status, 
        order.total_amount
    )
    return {"message": "Crypto transaction registered successfully. Awaiting admin confirmation.", "status": order.status}


@router.post("/{order_id}/submit-giftcards")
async def submit_order_gift_cards(
    order_id: int,
    background_tasks: BackgroundTasks,  # 🌟 Fixed parameter injection location
    card_types: List[str] = Form(...),
    codes: List[str] = Form(...),
    claimed_amounts: List[float] = Form(...),
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts parallel arrays of gift card types, codes, amounts, and receipt images.
    Uploads proofs to Cloudinary and maps entries to the target order context.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order context mapping not found.")
        
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this order.")

    if not (len(card_types) == len(codes) == len(claimed_amounts) == len(images)):
        raise HTTPException(status_code=400, detail="Mismatch structural counts within payload sequences.")

    # Process each card entry
    for card_type, code, amount, image_file in zip(card_types, codes, claimed_amounts, images):
        img_url = None
        if image_file and image_file.filename != '':
            img_url = upload_image(image_file.file)
            
        new_card = OrderGiftCard(
            order_id=order.id,
            card_type=card_type,
            code=code.upper().strip(),
            claimed_amount=amount,
            image_url=img_url
        )
        db.add(new_card)

    order.status = OrderStatus.PENDING_CONFIRMATION  # 🌟 Updated to match manual review queues
    order.payment_method = "gift_card"
    
    db.commit()
    db.refresh(order)

    customer_name = f"{current_user.first_name} {current_user.last_name}"
    background_tasks.add_task(
        send_order_email, 
        current_user.email, 
        customer_name, 
        order.id, 
        order.status, 
        order.total_amount
    )

    return {
        "message": "Gift card batch logged successfully. Awaiting administrative liquidation verification.",
        "status": order.status
    }


@router.get("/admin", response_model=list[OrderResponse])
def get_admin_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
    
    if current_user.role == "superadmin":
        return db.query(Order).order_by(Order.created_at.desc()).all()
    
    orders = db.query(Order).join(OrderItem).join(Product).filter(
        Product.added_by_id == current_user.id
    ).distinct().order_by(Order.created_at.desc()).all()
    
    return orders


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int, 
    status_update: OrderStatusUpdate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role == "admin":
        has_permission = any(item.product.added_by_id == current_user.id for item in order.items)
        if not has_permission:
            raise HTTPException(status_code=403, detail="Not authorized to update this order.")
    
    order.status = status_update.status
    db.commit()
    db.refresh(order)

    user = db.query(User).filter(User.id == order.user_id).first()
    if user:
        customer_name = f"{user.first_name} {user.last_name}"
        background_tasks.add_task(
            send_order_email, 
            user.email, 
            customer_name, 
            order.id, 
            order.status, 
            order.total_amount
        )

    return order