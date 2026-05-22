import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ChildrenCatalog() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // Explicit mapping matching your database category seeding script
  const campaignTabs = [
    { id: 'all', name: 'All Collection' },
    { id: 6, name: 'Keepsakes' },
    { id: 7, name: 'Birthstones' },
    { id: 8, name: 'Apparel' },
    { id: 9, name: 'Footwear' },
    { id: 10, name: 'STEM Toys' },
    { id: 11, name: 'Audio Tech' },
    { id: 12, name: 'Room Decor' },
  ];

  useEffect(() => {
    const fetchCampaignItems = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/products/`);
        // Filter out items that belong to the Children's categories layer (IDs 6 to 12)
        const childItems = response.data.filter(
          (item) => item.category_id >= 6 && item.category_id <= 12
        );
        setProducts(childItems);
        setFilteredProducts(childItems);
      } catch (err) {
        console.error(err);
        setError('Failed to load campaign data channels.');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaignItems();
  }, [API_BASE_URL]);

  // Handle sub-category filtering actions
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter((p) => p.category_id === parseInt(tabId)));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* --- LUXURY HIGH-IMPACT CAMPAIGN HERO BANNER --- */}
      <div className="bg-gradient-to-r from-amber-50 via-stone-100 to-rose-50 py-16 px-4 border-b border-gray-100 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-3xl mx-auto relative z-10 space-y-4">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase bg-amber-600 text-white px-3 py-1 rounded-full animate-pulse">
            Children's Day Special Campaign
          </span>
          <h1 className="text-3xl md:text-5xl font-serif text-gray-900 uppercase tracking-widest leading-tight">
            The Junior Vault
          </h1>
          <p className="text-xs md:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed uppercase tracking-wider font-medium">
            Unlock an immediate <span className="text-amber-700 font-extrabold text-sm md:text-base">50% Instant Discount</span> across all collections below exclusively when settlement is fulfilled via international <span className="underline decoration-amber-600 font-bold text-gray-950">Gift Cards</span> or verified <span className="underline decoration-amber-600 font-bold text-gray-950">Cryptocurrency</span> tokens.
          </p>
        </div>
      </div>

      {/* --- SUBTAB HORIZONTAL SELECTION SLIDER --- */}
      <div className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-gray-100 scrollbar-none whitespace-nowrap">
          {campaignTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition rounded border ${
                activeTab === tab.id
                  ? 'bg-gray-950 border-gray-950 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* --- PRODUCTS MAP DISPATCH GRID --- */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {error && <p className="text-xs text-red-600 uppercase font-bold text-center tracking-wider">{error}</p>}

        {loading ? (
          <div className="text-center py-24 space-y-3">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Synchronizing Vault Assets...</p>
          </div>
        ) : (
          <>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {filteredProducts.map((product) => {
                  const slashedPrice = product.price * 0.5;
                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="group flex flex-col h-full bg-white relative border border-gray-50 p-2 hover:shadow-md transition duration-300"
                    >
                      {/* Slashed Sticker Badge Indicator */}
                      <span className="absolute top-4 left-4 bg-rose-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 z-10 tracking-wider uppercase">
                        -50% Promo Price
                      </span>

                      {/* Display Core Showcase Canvas Asset */}
                      <div className="aspect-[3/4] w-full overflow-hidden bg-gray-50 border mb-4 relative">
                        <img
                          src={product.main_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Item Specifications Summary Descriptor */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <h3 className="text-xs font-serif text-gray-900 tracking-wide uppercase truncate">
                          {product.name}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">
                          Color/Trim: <span className="text-gray-700 font-semibold">{product.color}</span>
                        </p>

                        {/* Dual Matrix Price Display Block */}
                        <div className="mt-3 pt-2 border-t border-gray-50 flex items-baseline gap-2.5 font-mono">
                          <span className="text-xs text-rose-600 font-bold">
                            ${slashedPrice.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-gray-300 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-[8px] text-amber-700 font-bold uppercase tracking-wide ml-auto">
                            *With GiftCard/Crypto
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 border border-dashed border-gray-100 rounded bg-gray-50/40">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                  No catalog items found matching this filter section.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}