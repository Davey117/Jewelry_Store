# backend/app/api/products.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.product import Product, Category, Review  
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, CategoryResponse, ProductUpdate
from app.api.auth import get_current_user
from typing import List, Optional  # 🌟 Added Optional for search strings
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.utils.cloudinary import upload_image  # 🌟 Added Cloudinary tool import

router = APIRouter(prefix="/api/products", tags=["Products"])

# --- INLINE SCHEMAS FOR REVIEWS ---
class ReviewCreate(BaseModel):
    rating: int
    comment: str

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_name: str
    rating: int
    comment: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get("/categories", response_model=list[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.post("/", response_model=ProductResponse)
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock_quantity: int = Form(...),
    category_id: int = Form(...),
    color: str = Form(...),
    main_image: UploadFile = File(...),
    images: List[UploadFile] = File(default=[]), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
    
    main_img_url = upload_image(main_image.file)
    if not main_img_url:
        raise HTTPException(status_code=500, detail="Failed to upload primary image to Cloudinary.")

    additional_urls = []
    for extra_file in images[1:]:
        if extra_file and extra_file.filename != '':
            saved_url = upload_image(extra_file.file)
            if saved_url:
                additional_urls.append(saved_url)

    new_product = Product(
        name=name,
        description=description,
        price=price,
        stock_quantity=stock_quantity,
        category_id=category_id,
        color=color,
        main_image_url=main_img_url,  
        additional_images=additional_urls, 
        added_by_id=current_user.id
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return {
        **new_product.__dict__,
        "added_by_name": f"{current_user.first_name} {current_user.last_name}"
    }

@router.delete("/{product_id}")
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user) 
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Administrative clearance level insufficient."
        )
        
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in archive.")
        
    product.is_active = False  
    db.commit()
    return {"detail": "Product successfully soft deleted from collection."}

@router.get("/", response_model=list[ProductResponse])
def get_public_products(
    search: Optional[str] = None,  # 🌟 Intercepts public search queries
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)
    
    # 🌟 SQL compilation injection via conditional string criteria
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            Product.name.ilike(search_filter) | 
            Product.description.ilike(search_filter)
        )
        
    products = query.order_by(Product.created_at.desc()).all()
    results = []
    for p in products:
        user = db.query(User).filter(User.id == p.added_by_id).first()
        creator_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
        prod_dict = p.__dict__.copy()
        prod_dict["added_by_name"] = creator_name
        results.append(prod_dict)
    return results

@router.get("/admin", response_model=list[ProductResponse])
def get_admin_products(
    search: Optional[str] = None,  # 🌟 Intercepts administrative table searches
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    query = db.query(Product)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            Product.name.ilike(search_filter) | 
            Product.description.ilike(search_filter)
        )

    products = query.order_by(Product.created_at.desc()).all()
    results = []
    for p in products:
        user = db.query(User).filter(User.id == p.added_by_id).first()
        creator_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
        prod_dict = p.__dict__.copy()
        prod_dict["added_by_name"] = creator_name
        results.append(prod_dict)
    return results

@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int, 
    product_update: ProductUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = product_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    
    user = db.query(User).filter(User.id == product.added_by_id).first()
    creator_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
    
    prod_dict = product.__dict__.copy()
    prod_dict["added_by_name"] = creator_name
    return prod_dict

@router.get("/{product_id}", response_model=ProductResponse)
def get_single_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    user = db.query(User).filter(User.id == product.added_by_id).first()
    creator_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
    prod_dict = product.__dict__.copy()
    prod_dict["added_by_name"] = creator_name
    return prod_dict

# --- 💬 PRODUCT REVIEW ENDPOINTS ---

@router.get("/{product_id}/reviews", response_model=List[ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product piece not found.")
        
    reviews = db.query(Review).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()
    
    response_data = []
    for r in reviews:
        user = db.query(User).filter(User.id == r.user_id).first()
        user_name = f"{user.first_name} {user.last_name}" if user else "Anonymous Client"
        
        response_data.append(
            ReviewResponse(
                id=r.id,
                product_id=r.product_id,
                user_name=user_name,
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at
            )
        )
    return response_data

@router.post("/{product_id}/reviews", status_code=status.HTTP_201_CREATED)
def create_product_review(
    product_id: int,
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product piece not found.")

    if review_in.rating < 1 or review_in.rating > 5:
        raise HTTPException(status_code=400, detail="Rating metrics must fall between 1 and 5 stars.")

    new_review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_in.rating,
        comment=review_in.comment,
        created_at=datetime.utcnow()
    )
    
    db.add(new_review)
    db.commit()
    return {"message": "Review profile validation logged successfully."}