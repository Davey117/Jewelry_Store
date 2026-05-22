# backend/app/api/orders.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.order import Order, OrderItem, OrderGiftCard  
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate, CryptoPaymentSubmit
from app.api.auth import get_current_user
from app.utils.email import send_order_email
from app.utils.cloudinary import upload_image  

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
    Handles secure backend pricing validation, campaign slashes, inventory reduction, and database assignment.
    """
    calculated_total = 0.0
    order_items_to_create = []

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product piece with ID {item.product_id} not found.")
        
        product.stock_quantity = max(0, product.stock_quantity - item.quantity)
        
        final_unit_price = product.price
        if 6 <= product.category_id <= 12 and order.payment_method in ["gift_card", "crypto"]:
            final_unit_price = product.price * 0.5
            
        calculated_total += final_unit_price * item.quantity
        
        order_items_to_create.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_purchase": final_unit_price
        })

    new_order = Order(
        user_id=current_user.id,
        total_amount=calculated_total,
        payment_method=order.payment_method,      
        shipping_address=order.shipping_address,  
        status="pending_payment"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for oi in order_items_to_create:
        db_item = OrderItem(
            order_id=new_order.id,
            product_id=oi["product_id"],
            quantity=oi["quantity"],
            price_at_purchase=oi["price_at_purchase"]
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(new_order)

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
    order.status = "pending_confirmation"  
    
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
    background_tasks: BackgroundTasks,  
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

    order.status = "pending_confirmation"  
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

@router.delete("/{order_id}/cancel", status_code=status.HTTP_200_OK)
def cancel_pending_order(
    order_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Cancels an unfulfilled pending payment order record, restores product inventory counts, 
    and clears the pipeline so the customer can alter payment methods without duplicating orders.
    """
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tracking context not found.")
        
    if order.status != "pending_payment":
        raise HTTPException(status_code=400, detail="Only unfulfilled pending payment orders can be rolled back.")

    # Loop through order lines to return items back to product inventory stock
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock_quantity += item.quantity

    db.delete(order)
    db.commit()
    return {"detail": "Pending sequence revoked. Stock levels returned to catalog successfully."}