import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // ✨ Import the Cart Global Brain

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const firstName = localStorage.getItem('firstName');
  
  // ✨ Pull the cart count and the drawer toggle function
  const { cartCount, setIsCartOpen } = useCart();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('firstName');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-100 py-4 px-8 flex justify-between items-center shadow-sm sticky top-0 z-30">
      <div className="text-2xl font-serif tracking-widest text-gray-900 uppercase">
        <Link to="/">Aurum & Co.</Link>
      </div>

      <div className="flex items-center space-x-6 text-sm uppercase tracking-widest text-gray-600 font-bold">
        {firstName && (
          <span className="text-amber-600 mr-4 hidden md:inline-block">Welcome, {firstName}</span>
        )}
        
        {/* Navigation Links */}
        <Link to="/" className="hover:text-amber-600 transition">Home</Link>
        <Link to="/catalog" className="hover:text-amber-600 transition">Catalog</Link>
        
        {/* Auth Links */}
        {token ? (
          <button onClick={handleLogout} className="hover:text-amber-600 transition uppercase tracking-widest font-bold text-sm">Sign Out</button>
        ) : (
          <Link to="/login" className="hover:text-amber-600 transition">Sign In</Link>
        )}

        {/* ✨ THE CART BUTTON (Using your original SVG!) */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative text-gray-600 hover:text-amber-600 transition-colors p-2 focus:outline-none"
          title="Your Bag"
        >
          <svg 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            viewBox="0 0 24 24" 
            className="w-6 h-6"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" 
            />
          </svg>

          {/* ✨ Dynamic Cart Badge */}
          {cartCount > 0 && (
            <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-amber-600 rounded-full transform translate-x-1 translate-y-1 shadow-sm">
              {cartCount}
            </span>
          )}
        </button>

      </div>
    </nav>
  );
}