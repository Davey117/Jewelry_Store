import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicProducts } from '../services/api';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const data = await fetchPublicProducts();
        setFeaturedProducts(data.slice(0, 3)); 
      } catch (error) {
        console.error("Failed to load featured products", error);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  return (
    <div className="bg-white">
      
      {/* --- HERO SECTION --- */}
      <div className="relative h-[85vh] bg-black overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1573408302185-9146fe634ad0?q=80&w=2069&auto=format&fit=crop')" }}
        ></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="text-[10px] md:text-xs text-amber-500 font-bold uppercase tracking-[0.4em] mb-6">Established 2026</span>
          <h1 className="text-5xl md:text-8xl font-serif text-white tracking-widest uppercase mb-8 drop-shadow-lg">
            Aurum & Co.
          </h1>
          <p className="text-gray-300 tracking-widest uppercase text-[10px] md:text-xs mb-12 max-w-xl leading-loose">
            Redefining timeless elegance. Discover our exclusive collection of meticulously crafted fine jewelry.
          </p>
          <Link to="/catalog" className="bg-white text-black px-10 py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-gray-200 transition shadow-lg">
            Explore Catalog
          </Link>
        </div>
      </div>

      {/* --- SHOP BY CATEGORY --- */}
      <div className="py-12 md:py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif text-gray-900 tracking-widest uppercase mb-4">Shop By Category</h2>
          <div className="w-12 h-0.5 bg-amber-600 mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Category 1: Rings (ID: 4) */}
          <Link to="/catalog?category=4" className="group relative h-96 overflow-hidden bg-gray-100">
            <img src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop" alt="Rings" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
            <div className="absolute inset-0 flex items-end p-8">
              <span className="text-white text-xs uppercase tracking-[0.3em] font-bold border-b border-white/50 pb-1">Signature Rings</span>
            </div>
          </Link>

          {/* Category 2: Necklaces (ID: 2) */}
          <Link to="/catalog?category=2" className="group relative h-96 overflow-hidden bg-gray-100">
            <img src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1974&auto=format&fit=crop" alt="Necklaces" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
            <div className="absolute inset-0 flex items-end p-8">
              <span className="text-white text-xs uppercase tracking-[0.3em] font-bold border-b border-white/50 pb-1">Necklaces</span>
            </div>
          </Link>

          {/* Category 3: Timepieces (ID: 1) */}
          <Link to="/catalog?category=1" className="group relative h-96 overflow-hidden bg-gray-100">
            <img src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2080&auto=format&fit=crop" alt="Watches" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
            <div className="absolute inset-0 flex items-end p-8">
              <span className="text-white text-xs uppercase tracking-[0.3em] font-bold border-b border-white/50 pb-1">Timepieces</span>
            </div>
          </Link>

          {/* Category 4: Earrings (ID: 3) */}
          <Link to="/catalog?category=3" className="group relative h-96 overflow-hidden bg-gray-100">
            <img src={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/static/images/Earring.jpeg`} alt="Earrings" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
            <div className="absolute inset-0 flex items-end p-8">
              <span className="text-white text-xs uppercase tracking-[0.3em] font-bold border-b border-white/50 pb-1">Earrings</span>
            </div>
          </Link>
          {/* Category 5: Bracelets (ID: 5) */}
          <Link to="/catalog?category=5" className="group relative h-96 overflow-hidden bg-gray-100">
            <img src={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/static/images/Bracelet.jpeg`} alt="Bracelets" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
            <div className="absolute inset-0 flex items-end p-8">
              <span className="text-white text-xs uppercase tracking-[0.3em] font-bold border-b border-white/50 pb-1">Bracelets</span>
            </div>
          </Link>

        </div>
      </div>

      {/* --- NEW ARRIVALS --- */}
      <div className="bg-gray-50 py-12 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-3xl font-serif text-gray-900 tracking-widest uppercase mb-4">New Arrivals</h2>
              <div className="w-12 h-0.5 bg-amber-600"></div>
            </div>
            <Link to="/catalog" className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-black transition border-b border-transparent hover:border-black pb-1 hidden md:block">
              View All Pieces
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400 uppercase tracking-widest text-xs">Curating Collection...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {featuredProducts.map((product) => (
                <Link to={`/product/${product.id}`} key={product.id} className="group block">
                  <div className="relative aspect-[4/5] bg-white overflow-hidden mb-6 border border-gray-100 shadow-sm">
                    {product.main_image_url ? (
                      <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] uppercase bg-gray-100">Image Unavailable</div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-2 group-hover:text-amber-600 transition">{product.name}</h3>
                    <p className="text-sm font-serif italic text-gray-500">
                      ${product.price ? Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- FOOTER BANNER --- */}
      <div className="bg-black py-20 px-4 md:px-8 text-center">
        <h2 className="text-2xl font-serif text-white tracking-widest uppercase mb-6">Join The Inner Circle</h2>
        
        {subscribed ? (
          <p className="text-amber-500 font-serif italic text-sm tracking-widest uppercase py-4 animate-fadeIn">
            Thanks for subscribing to our exclusive newsletter.
          </p>
        ) : (
          <>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase mb-8 max-w-md mx-auto leading-relaxed">
              Subscribe to receive exclusive access to private sales and new collections.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 sm:gap-0">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOUR EMAIL ADDRESS" 
                className="flex-1 bg-transparent border border-gray-700 text-white px-4 py-3 text-[10px] tracking-widest outline-none focus:border-amber-500 transition w-full" 
              />
              <button type="submit" className="bg-amber-600 text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-amber-700 transition w-full sm:w-auto shrink-0">
                Subscribe
              </button>
            </form>
          </>
        )}
      </div>

    </div>
  );
}