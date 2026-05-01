import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  
  // Check if a user is logged in
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    navigate('/login'); // Send them back to login
  };

  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* Brand Logo */}
        <Link to="/" className="text-2xl font-extrabold text-indigo-600 tracking-tight">
          Aurum<span className="text-gray-800">andCo</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6 font-medium text-gray-600">
          <Link to="/" className="hover:text-indigo-600 transition">Home</Link>
          <Link to="/catalog" className="hover:text-indigo-600 transition">Catalog</Link>
          
          {/* 🛡️ ADMIN ONLY LINK (Visible if logged in) */}
          {isAuthenticated && (
            <Link 
              to="/admin" 
              className="text-rose-600 hover:text-rose-700 font-bold transition border-b-2 border-transparent hover:border-rose-600"
            >
              Admin Panel
            </Link>
          )}

          {/* 🔐 AUTH LOGIC: Show Login if out, Logout if in */}
          {!isAuthenticated ? (
            <Link 
              to="/login" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              Login
            </Link>
          ) : (
            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-indigo-600 transition cursor-pointer"
            >
              Logout
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}