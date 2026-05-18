import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduct } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
  const { id } = useParams(); 
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null); 

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProduct(id);
        setProduct(data);
        setActiveImage(data.main_image_url || data.image_url); 
      } catch (error) {
        console.error("Failed to load product details", error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center text-xs tracking-widest uppercase text-gray-400">Retrieving details...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-serif tracking-widest uppercase mb-4">Piece Not Found</h2>
        <p className="text-gray-500 text-xs tracking-widest uppercase mb-8">This item may have been removed from our catalog.</p>
        <Link to="/catalog" className="text-xs font-bold border-b border-black pb-1 uppercase tracking-widest hover:text-amber-600 hover:border-amber-600 transition">Return to Collection</Link>
      </div>
    );
  }

  // Safely extract all possible image variants from backend formats (arrays, explicit keys, or snake_case fallbacks)
  const galleryImages = [
    product.main_image_url || product.image_url,
    product.image_2_url || product.image_2,
    product.image_3_url || product.image_3,
    product.image_4_url || product.image_4,
    ...(product.additional_images || [])
  ].filter(Boolean);

  // Index Tracking for navigation toggles
  const currentImageIndex = galleryImages.indexOf(activeImage);

  const handleNextImage = () => {
    const nextIndex = (currentImageIndex + 1) % galleryImages.length;
    setActiveImage(galleryImages[nextIndex]);
  };

  const handlePrevImage = () => {
    const prevIndex = currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1;
    setActiveImage(galleryImages[prevIndex]);
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 md:py-24">
      
      {/* Breadcrumbs */}
      <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-12">
        <Link to="/" className="hover:text-black transition">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/catalog" className="hover:text-black transition">Catalog</Link>
        <span className="mx-2">/</span>
        <span className="text-black font-bold">{product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-16">
        
        {/* LEFT COLUMN: IMAGE GALLERY WITH INTERACTIVE TOGGLES */}
        <div className="w-full md:w-1/2 flex flex-col-reverse md:flex-row gap-4">
          
          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible">
              {galleryImages.map((img, index) => (
                <button 
                  key={index} 
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-24 flex-shrink-0 border transition-all ${activeImage === img ? 'border-amber-600 opacity-100 ring-1 ring-amber-600' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Active Image Window with Left/Right Navigation Toggles */}
          <div className="flex-1 bg-gray-50 border border-gray-100 aspect-[4/5] relative group overflow-hidden">
            {activeImage ? (
              <>
                <img src={activeImage} alt={product.name} className="w-full h-full object-cover transition-all duration-500" />
                
                {/* Visual Navigation Arrows (Rendered dynamically if multiple images exist) */}
                {galleryImages.length > 1 && (
                  <>
                    <button 
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 hover:bg-black hover:text-white transition shadow-md opacity-0 group-hover:opacity-100 z-10"
                    >
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </button>
                    <button 
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 hover:bg-black hover:text-white transition shadow-md opacity-0 group-hover:opacity-100 z-10"
                    >
                      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs tracking-widest uppercase font-bold">Image Unavailable</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PRODUCT DETAILS */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          
          <div className="flex items-center space-x-3 mb-4">
             {product.category && <span className="text-[10px] bg-gray-100 text-gray-600 px-3 py-1 uppercase tracking-widest font-bold">{product.category.name}</span>}
             {product.color !== "None" && <span className="text-[10px] border border-gray-200 text-gray-600 px-3 py-1 uppercase tracking-widest font-bold">{product.color}</span>}
          </div>

          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6 leading-tight uppercase tracking-wide">{product.name}</h1>
          <p className="text-2xl font-bold text-gray-900 tracking-wider mb-8">${product.price.toFixed(2)}</p>
          
          <div className="w-full h-px bg-gray-200 mb-8"></div>
          
          <p className="text-gray-600 text-sm leading-relaxed mb-10 whitespace-pre-line">
            {product.description || "An exquisite piece crafted with unparalleled precision."}
          </p>

          <div className="mb-10">
            <span className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2">Availability</span>
            {product.stock_quantity === 0 ? (
               <span className="text-red-600 text-xs font-bold uppercase tracking-widest">Out of Stock</span>
            ) : product.stock_quantity < 5 ? (
               <span className="text-amber-600 text-xs font-bold uppercase tracking-widest">Limited Availability - Only {product.stock_quantity} left</span>
            ) : (
               <span className="text-green-700 text-xs font-bold uppercase tracking-widest">In Stock & Ready to Ship</span>
            )}
          </div>

          <button 
            disabled={product.stock_quantity === 0}
            onClick={() => addToCart(product)}
            className={`w-full py-4 text-xs uppercase tracking-[0.2em] font-bold transition shadow-lg ${
              product.stock_quantity === 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-amber-600'
            }`}
          >
            {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {/* Luxury Reassurance Policies */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-gray-200 pt-8">
             <div className="text-center">
                <span className="block text-lg mb-2">✦</span>
                <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-900">Complimentary Shipping</span>
                <span className="block text-[9px] text-gray-500 mt-1">On all domestic orders</span>
             </div>
             <div className="text-center">
                <span className="block text-lg mb-2">↺</span>
                <span className="block text-[10px] uppercase tracking-widest font-bold text-gray-900">30-Day Returns</span>
                <span className="block text-[9px] text-gray-500 mt-1">Hassle-free guarantee</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}