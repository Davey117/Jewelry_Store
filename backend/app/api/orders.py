from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate, CryptoPaymentSubmit
from app.api.auth import get_current_user
from app.utils.email import send_order_email

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
    # 🌟 Combined tracking schemas safely here
    new_order = Order(
        user_id=current_user.id,
        total_amount=order.total_amount,
        payment_method=order.payment_method,      # Added from your crypto setup
        shipping_address=order.shipping_address,  # Added from your crypto setup
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

    if new_order.payment_method != "crypto":
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

    # Dispatch transactional notification confirmation
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
    current_user: User = Depends(get_current_user) # 🔒 Secured with user session validation
):
    """
    Saves selected crypto parameters and transaction identifier tokens.
    Moves the lifecycle state up to wait for manual system verification.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order context mapping not found")
        
    # 🔒 Ownership Verification: Prevent cross-user parameter tampering
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this order.")
        
    order.crypto_currency = payment_in.crypto_currency
    order.crypto_network = payment_in.crypto_network
    order.crypto_tx_hash = payment_in.crypto_tx_hash
    order.status = OrderStatus.PENDING_PAYMENT
    
    db.commit()
    db.refresh(order)

    customer_name = f"{current_user.first_name} {current_user.last_name}"
    background_tasks.add_task(
        send_order_email, 
        current_user.email, 
        customer_name, 
        order.id, 
        order.status, # This sends "pending_confirmation" down to your email utility template
        order.total_amount
    )
    return {"message": "Crypto transaction registered successfully. Awaiting admin confirmation.", "status": order.status}


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