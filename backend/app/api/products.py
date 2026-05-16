from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.product import Product, Category
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, CategoryResponse, ProductUpdate
from app.api.auth import get_current_user
from typing import Optional, List
from app.utils.cloudinary import upload_image # ✨ Using your Cloudinary tool

router = APIRouter(prefix="/api/products", tags=["Products"])

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
    image_2: Optional[UploadFile] = File(None),
    image_3: Optional[UploadFile] = File(None),
    image_4: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
    
    # --- STEP 1: UPLOAD MAIN IMAGE ---
    # We pass 'main_image.file' directly to Cloudinary
    main_img_url = upload_image(main_image.file)
    if not main_img_url:
        raise HTTPException(status_code=500, detail="Failed to upload primary image to Cloudinary.")

    # --- STEP 2: UPLOAD ADDITIONAL IMAGES ---
    additional_urls = []
    for extra_file in [image_2, image_3, image_4]:
        # Check if a file was actually uploaded and it has a name
        if extra_file and extra_file.filename != '':
            saved_url = upload_image(extra_file.file)
            if saved_url:
                additional_urls.append(saved_url)

    # --- STEP 3: SAVE TO DATABASE ---
    new_product = Product(
        name=name,
        description=description,
        price=price,
        stock_quantity=stock_quantity,
        category_id=category_id,
        color=color,
        main_image_url=main_img_url,  # Now a Cloudinary URL
        additional_images=additional_urls, # List of Cloudinary URLs
        added_by_id=current_user.id
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return {
        **new_product.__dict__,
        "added_by_name": f"{current_user.first_name} {current_user.last_name}"
    }

# --- REMAINING GET/PATCH ROUTES STAY THE SAME ---

@router.get("/", response_model=list[ProductResponse])
def get_public_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_active == True).order_by(Product.created_at.desc()).all()
    results = []
    for p in products:
        user = db.query(User).filter(User.id == p.added_by_id).first()
        creator_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
        prod_dict = p.__dict__.copy()
        prod_dict["added_by_name"] = creator_name
        results.append(prod_dict)
    return results

@router.get("/admin", response_model=list[ProductResponse])
def get_admin_products(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    results = []
    for p in products:
        user = db.query(User).filter(User.id == p.added_by_id).first()
        creator_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
        prod_dict = p.__dict__.copy()
        prod_dict["added_by_name"] = creator_name
        results.append(prod_dict)
    return results

@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized.")
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product_update.stock_quantity is not None:
        product.stock_quantity = product_update.stock_quantity
    if product_update.price is not None:
        product.price = product_update.price
    if product_update.is_active is not None:
        product.is_active = product_update.is_active
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