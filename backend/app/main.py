from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # ✨ Added for image uploads
import os # ✨ Added for folder creation

from app.api.auth import router as auth_router
from app.api.products import router as products_router
from app.api.orders import router as orders_router
from app.api.payments import router as payments_router
from app.api.users import router as users_router 

app = FastAPI(title="Jewelry Store API")

# ✨ NEW: Create the images directory if it doesn't exist
# This will create a 'static/images' folder right inside your 'backend' folder
os.makedirs("static/images", exist_ok=True)

# ✨ NEW: Mount the static directory so React can actually load the image URLs
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", # Your local Vite React app
        # "https://your-future-custom-domain.com" <-- You can add your live frontend URL here later!
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(payments_router)
app.include_router(users_router)  

@app.get("/")
def health_check():
    return {"status": "success", "message": "Jewelry Store API is running"}