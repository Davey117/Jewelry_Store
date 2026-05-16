import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchPublicProducts, fetchCategories } from '../services/api';

export default function Catalog() {
  const location = useLocation();
  const navigate = useNavigate(); // ✨ Added this for better URL handling
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const loadAndFilter = async () => {
      setLoading(true);
      setProducts([]); // Prevent ghosting

      try {
        const params = new URLSearchParams(location.search);
        const urlCatId = params.get('category');
        const activeCatId = urlCatId ? parseInt(urlCatId) : null;
        
        setSelectedCategory(activeCatId);

        const [prodData, catData] = await Promise.all([
          fetchPublicProducts(),
          fetchCategories()
        ]);
        
        setCategories(catData);

        if (activeCatId) {
          const filtered = prodData.filter(p => Number(p.category_id) === Number(activeCatId));
          setProducts(filtered);
        } else {
          setProducts(prodData);
        }
      } catch (err) {
        console.error("Catalog Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAndFilter();
  }, [location.search]);

  // ✨ Handles category clicks and updates the URL automatically
  const handleCategoryClick = (id) => {
    if (id === null) {
      navigate('/catalog');
    } else {
      navigate(`/catalog?category=${id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-12">
        
        {/* --- SIDEBAR --- */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-900 mb-8 border-b border-gray-100 pb-4">
            Collections
          </h2>
          
          <nav className="space-y-4">
            <button 
              onClick={() => handleCategoryClick(null)}
              className={`block text-xs uppercase tracking-widest transition-colors ${!selectedCategory ? 'text-amber-600 font-bold' : 'text-gray-500 hover:text-black'}`}
            >
              All Collections
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`block text-xs uppercase tracking-widest text-left transition-colors ${selectedCategory === cat.id ? 'text-amber-600 font-bold' : 'text-gray-500 hover:text-black'}`}
              >
                {cat.name}
              </button>
            ))}
          </nav>

          <div className="mt-12 pt-8 border-t border-gray-100">
             <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-6">Material Quality</h2>
             <div className="space-y-3 text-[10px] uppercase tracking-widest text-gray-500">
                <p className="hover:text-amber-600 cursor-pointer transition italic">18K Solid Gold</p>
                <p className="hover:text-amber-600 cursor-pointer transition italic">Sterling Silver</p>
                <p className="hover:text-amber-600 cursor-pointer transition italic">Ethical Diamonds</p>
             </div>
          </div>
        </aside>

        {/* --- PRODUCT GRID --- */}
        <main className="flex-1">
          <div className="flex justify-between items-baseline mb-10">
            <h1 className="text-2xl font-serif uppercase tracking-widest text-gray-900">
              {selectedCategory 
                ? categories.find(c => c.id === selectedCategory)?.name || 'Collection' 
                : 'The Full Collection'}
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{products.length} Pieces Found</p>
          </div>

          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {products.map((product) => (
                <Link to={`/product/${product.id}`} key={product.id} className="group">
                  <div className="aspect-[4/5] overflow-hidden bg-gray-50 mb-6 relative border border-gray-100 shadow-sm">
                    <img 
                      src={product.main_image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-700 shadow-sm border border-red-100">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-2 group-hover:text-amber-600 transition">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-serif italic">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ✨ RESTORED EMPTY STATE UI */}
          {!loading && products.length === 0 && (
            <div className="text-center py-32 bg-gray-50 border border-dashed border-gray-200 rounded">
              <p className="text-gray-400 uppercase text-[10px] tracking-[0.2em]">
                No pieces are currently available in this curated collection.
              </p>
              <button 
                onClick={() => handleCategoryClick(null)}
                className="mt-4 text-[10px] text-amber-600 font-bold uppercase tracking-widest border-b border-amber-600 pb-1 hover:text-amber-700 hover:border-amber-700 transition"
              >
                View Full Catalog
              </button>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}