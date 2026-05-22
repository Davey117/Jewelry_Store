# app/models/order.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class OrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "pending_payment"
    PENDING_CONFIRMATION = "pending_confirmation"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING_PAYMENT, nullable=False)
    tracking_number = Column(String, nullable=True)
    payment_method = Column(String, nullable=False)
    shipping_address = Column(String, nullable=False)
    crypto_currency = Column(String, nullable=True)  # e.g., "USDT", "BTC"
    crypto_network = Column(String, nullable=True)   # e.g., "TRC-20", "ERC-20"
    crypto_tx_hash = Column(String, nullable=True)
    gift_cards = relationship("OrderGiftCard", back_populates="order", cascade="all, delete-orphan")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    
    # Crucial: Save the price at the exact moment of checkout
    price_at_purchase = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class OrderGiftCard(Base):
    __tablename__ = "order_gift_cards"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    card_type = Column(String, nullable=False)      # e.g., "Apple", "Razer Gold", "Steam"
    code = Column(String, nullable=False)           # The alphanumeric PIN string
    claimed_amount = Column(Float, nullable=False)  # The value the user claims the card holds
    image_url = Column(String, nullable=True)       # Cloudinary screenshot URL of the receipt/card

    # Relationship linking back to the parent order
    order = relationship("Order", back_populates="gift_cards" if hasattr(Order, "gift_cards") else None)