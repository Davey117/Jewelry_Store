import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // ✨ Import the Cart Global Brain

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const firstName = localStorage.getItem('firstName') || 'Collector';
  const userRole = localStorage.getItem('userRole');
  const profileImage = localStorage.getItem('profileImage'); // 🌟 Stores Google OAuth avatar URL or fallback token pointers

  // ✨ Pull the cart count and the drawer toggle function
  const { cartCount, setIsCartOpen } = useCart();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('firstName');
    localStorage.removeItem('profileImage'); // 🌟 Clean up profile context on signout
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-100 py-4 px-4 md:px-8 flex justify-between items-center shadow-sm sticky top-0 z-30">
      <div className="text-xl md:text-2xl font-serif tracking-widest text-gray-900 uppercase whitespace-nowrap">
        <Link to="/">Aurum & Co.</Link>
      </div>

      <div className="flex items-center space-x-3 md:space-x-6 text-xs md:text-sm uppercase tracking-widest text-gray-600 font-bold">
        
        {/* Navigation Links */}
        <Link to="/" className="hover:text-amber-600 transition">Home</Link>
        <Link to="/catalog" className="hover:text-amber-600 transition">Catalog</Link>
        
        {/* Dynamic Auth & Profile Grid Layout Elements */}
        {token ? (
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Dashboard shortcut link for administrative accounts */}
            {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'superadmin') && (
              <Link 
                to="/admin" 
                className="text-[9px] md:text-[10px] bg-stone-900 text-amber-400 px-2.5 py-1.5 rounded-full font-bold uppercase tracking-widest border border-stone-800 hover:bg-black transition whitespace-nowrap"
              >
                Dashboard
              </Link>
            )}

            {/* Luxury Identity Avatar Link Container */}
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
                
                {/* Clean Vector SVG Icon fallback for standard database accounts */}
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

        {/* ✨ THE CART BUTTON */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative text-gray-600 hover:text-amber-600 transition-colors p-1.5 md:p-2 focus:outline-none shrink-0"
          title="Your Bag"
        >
          <svg 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            viewBox="0 0 24 24" 
            className="w-5 h-5 md:w-6 md:h-6"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" 
            />
          </svg>

          {/* Dynamic Cart Badge */}
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