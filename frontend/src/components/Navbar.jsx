import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const firstName = localStorage.getItem('firstName') || 'Collector';
  const userRole = localStorage.getItem('userRole');
  const profileImage = localStorage.getItem('profileImage');
  const { cartCount, setIsCartOpen } = useCart();

  // 🌟 Live Search System States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  
  const searchRef = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // 🌟 Client-Side Debounced Fetch Lifecycle
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/products/?search=${searchQuery}`);
        setSearchResults(response.data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Failed to execute query mapping:", error);
      } finally {
        setIsSearchLoading(false);
      }
    }, 300); // 300ms window delay optimization

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, API_BASE_URL]);

  // Close dropdown if clicking outside search box bounds
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('firstName');
    localStorage.removeItem('profileImage');
    navigate('/login');
  };

  const handleItemSelect = (productId) => {
    setSearchQuery('');
    setShowDropdown(false);
    navigate(`/product/${productId}`);
  };

  return (
    <nav className="bg-white border-b border-gray-100 py-4 px-4 md:px-8 flex justify-between items-center shadow-sm sticky top-0 z-30">
      <div className="text-xl md:text-2xl font-serif tracking-widest text-gray-900 uppercase whitespace-nowrap">
        <Link to="/">Aurum & Co.</Link>
      </div>

      {/* 🌟 LUXURY DEBUNCED LIVE SEARCH INPUT COMPONENT */}
      <div ref={searchRef} className="hidden md:block relative w-64 lg:w-80 mx-4">
        <div className="relative flex items-center border border-gray-200 px-3 py-1.5 rounded bg-gray-50/50 focus-within:border-amber-600 transition">
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowDropdown(true)}
            className="w-full bg-transparent text-xs outline-none text-gray-900 font-medium uppercase tracking-wider placeholder-gray-400"
          />
          {isSearchLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          )}
        </div>

        {/* Floating Results Popup Panel */}
        {showDropdown && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 shadow-xl rounded max-h-80 overflow-y-auto z-40 divide-y divide-gray-50">
            {searchResults.length > 0 ? (
              searchResults.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleItemSelect(product.id)}
                  className="flex items-center gap-3 p-2.5 hover:bg-amber-50/30 cursor-pointer transition"
                >
                  <img
                    src={product.main_image_url}
                    alt={product.name}
                    className="w-10 h-12 object-cover border border-gray-100 bg-white"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-serif text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-amber-700 font-bold font-mono mt-0.5">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold text-center">No matching relics found</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3 md:space-x-6 text-xs md:text-sm uppercase tracking-widest text-gray-600 font-bold">
        <Link to="/" className="hover:text-amber-600 transition">Home</Link>
        <Link to="/catalog" className="hover:text-amber-600 transition">Catalog</Link>
        
        {token ? (
          <div className="flex items-center space-x-3 md:space-x-4">
            {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'superadmin') && (
              <Link 
                to="/admin" 
                className="text-[9px] md:text-[10px] bg-stone-900 text-amber-400 px-2.5 py-1.5 rounded-full font-bold uppercase tracking-widest border border-stone-800 hover:bg-black transition whitespace-nowrap"
              >
                Dashboard
              </Link>
            )}

            <Link to="/profile" className="relative group focus:outline-none flex items-center" title="View Profile">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-gray-200 shadow-sm group-hover:border-amber-600 transition-colors duration-300 flex items-center justify-center bg-gray-50 shrink-0">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={firstName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                
                <svg 
                  style={{ display: profileImage ? 'none' : 'block' }}
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  viewBox="0 0 24 24" 
                  className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 group-hover:text-amber-600 transition-colors"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
            </Link>

            <button onClick={handleLogout} className="hover:text-amber-600 transition uppercase tracking-widest font-bold text-xs md:text-sm whitespace-nowrap">
              Sign Out
            </button>
          </div>
        ) : (
          <Link to="/login" className="hover:text-amber-600 transition">Sign In</Link>
        )}

        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative text-gray-600 hover:text-amber-600 transition-colors p-1.5 md:p-2 focus:outline-none shrink-0"
          title="Your Bag"
        >
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute top-0 right-0 flex items-center justify-center w-3.5 h-3.5 md:w-4 md:h-4 text-[8px] md:text-[9px] font-bold text-white bg-amber-600 rounded-full transform translate-x-0.5 translate-y-0.5 shadow-sm">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}