import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_image(file_obj):
    """
    Uploads a file to Cloudinary and returns the secure HTTPS URL.
    """
    try:
        # We upload the file and tell Cloudinary to put it in an 'aurum_products' folder
        response = cloudinary.uploader.upload(file_obj, folder="aurum_products")
        return response.get("secure_url")
    except Exception as e:
        print(f"Cloudinary Upload Error: {e}")
        return None

def delete_image(image_url: str):
    """
    Extracts the public_id from a Cloudinary URL and deletes the image.
    Works for URLs like: https://res.cloudinary.com/cloud_name/image/upload/v1/folder/filename.jpg
    """
    if not image_url or "cloudinary.com" not in image_url:
        return None

    try:
        # 1. Split the URL to find the 'upload' section
        parts = image_url.split('/')
        
        # 2. The public_id is everything after the 'vXXXXX' (version number)
        # We find where 'upload' is and take everything 2 steps after it
        upload_index = parts.index('upload')
        
        # This joins the folder and the filename (e.g., 'aurum_products/asdfghj')
        public_id_with_ext = "/".join(parts[upload_index + 2:])
        
        # 3. Strip the file extension (e.g., .jpg, .png)
        public_id = public_id_with_ext.split('.')[0]

        # 4. Tell Cloudinary to destroy it
        response = cloudinary.uploader.destroy(public_id)
        print(f"Cloudinary cleanup: {public_id} - {response.get('result')}")
        return response
    except Exception as e:
        print(f"Cloudinary Deletion Error: {e}")
        return None