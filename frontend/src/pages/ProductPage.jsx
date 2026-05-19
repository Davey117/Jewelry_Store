import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduct, fetchProductReviews, createProductReview } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
  const { id } = useParams(); 
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null); 
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const token = localStorage.getItem('token');

  const loadReviews = async () => {
    try {
      const data = await fetchProductReviews(id);
      setReviews(data);
    } catch (err) {
      console.error("Failed to load piece reviews:", err);
    }
  };

  useEffect(() => {
    const loadProductAndReviews = async () => {
      try {
        const data = await fetchProduct(id);
        setProduct(data);
        setActiveImage(data.main_image_url || data.image_url); 
        await loadReviews();
      } catch (error) {
        console.error("Failed to load product details", error);
      } finally {
        setLoading(false);
      }
    };
    loadProductAndReviews();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);
    try {
      await createProductReview(id, { rating: newRating, comment: newComment });
      setNewComment('');
      setNewRating(5);
      await loadReviews();
    } catch (err) {
      setReviewError(err.response?.data?.detail || "Could not submit review signature.");
    } finally {
      setSubmittingReview(false);
    }
  };

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

  const galleryImages = [
    product.main_image_url || product.image_url,
    product.image_2_url || product.image_2,
    product.image_3_url || product.image_3,
    product.image_4_url || product.image_4,
    ...(product.additional_images || [])
  ].filter(Boolean);

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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-24">
      
      {/* Breadcrumbs */}
      <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-12">
        <Link to="/" className="hover:text-black transition">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/catalog" className="hover:text-black transition">Catalog</Link>
        <span className="mx-2">/</span>
        <span className="text-black font-bold">{product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-16">
        
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

          <h1 className="text-2xl md:text-5xl font-serif text-gray-900 mb-4 md:mb-6 leading-tight uppercase tracking-wide">{product.name}</h1>
          <p className="text-2xl font-bold text-gray-900 tracking-wider mb-8">
            ${Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          
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

      {/* --- REVIEWS & RATINGS ACCORDION SYSTEM --- */}
      <div className="mt-24 border-t pt-16 max-w-4xl mx-auto">
        <h2 className="text-xl font-serif uppercase tracking-widest text-gray-900 mb-8 text-center">Client Feedback</h2>
        
        {token ? (
          <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-12">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-707 mb-4">Leave Feedback</h3>
            {reviewError && <div className="mb-4 text-xs font-bold text-red-600 uppercase tracking-wider">Error: {reviewError}</div>}
            
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Rating Classification</label>
              <select 
                value={newRating} 
                onChange={e => setNewRating(Number(e.target.value))} 
                className="px-3 py-2 border rounded text-xs bg-white text-gray-800 outline-none font-bold"
              >
                <option value="5">✦✦✦✦✦ (5 Stars)</option>
                <option value="4">✦✦✦✦ (4 Stars)</option>
                <option value="3">✦✦✦ (3 Stars)</option>
                <option value="2">✦✦ (2 Stars)</option>
                <option value="1">✦ (1 Star)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Commentary Context</label>
              <textarea 
                required 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                placeholder="Share your experience regarding this piece..."
                className="w-full px-3 py-2 border rounded text-sm h-20 outline-none resize-none bg-white text-gray-900"
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={submittingReview} 
                className="bg-black text-white px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition shadow disabled:bg-gray-400"
              >
                {submittingReview ? 'Transmitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center bg-gray-50 border border-dashed p-6 rounded-xl mb-12">
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              Please <Link to="/login" className="text-amber-600 font-bold hover:underline">Sign In</Link> to log validation reviews for this piece.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-center text-xs text-gray-400 italic py-8 uppercase tracking-wider">No reviews logged for this asset signature yet.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="border-b pb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{rev.user_name}</span>
                    <span className="text-[9px] text-amber-600 font-mono tracking-wider font-bold">
                      {'✦'.repeat(rev.rating)}{'✧'.repeat(5 - rev.rating)}
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-light italic">
                    {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed font-light whitespace-pre-wrap">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}