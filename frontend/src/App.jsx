import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import StoreRoute from './components/StoreRoute'; 
import ProductPage from './pages/ProductPage';
import CartDrawer from './components/CartDrawer';
import Checkout from './pages/Checkout'; 
import OrderSuccess from './pages/OrderSuccess';
import ProfilePage from './pages/ProfilePage';
import CryptoPayment from './pages/CryptoPayment';
import useInactivityTimeout from './hooks/useInactivityTimeout';
import GiftCardPayment from './pages/GiftCardPayment';
import ChildrenCatalog from './pages/ChildrenCatalog';

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  // ✨ Initialize the hook: Warns at 25 minutes, completely logs out at 30 minutes
  const { showWarning, extendSession, forceLogout } = useInactivityTimeout(30, 25);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      
      {/* --- INACTIVITY WARNING MODAL --- */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white p-10 max-w-md w-full border border-gray-100 shadow-2xl text-center">
            <svg className="w-10 h-10 mx-auto text-amber-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 className="text-xl font-serif uppercase tracking-widest mb-4 text-gray-900">Session Expiring</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-8 leading-relaxed">
              For your security, we are logging you out due to inactivity. Would you like to continue browsing the collection?
            </p>
            <div className="flex space-x-4 justify-center">
              <button 
                onClick={forceLogout}
                className="px-6 py-3 border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition"
              >
                Log Out
              </button>
              <button 
                onClick={extendSession}
                className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-amber-600 transition shadow-lg"
              >
                I'm Still Here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hide the public Navbar if they are locked in the Admin Suite */}
      {!isAdminPage && <Navbar />}
      
      {/* The Cart Drawer is always rendered but manages its own visibility state */}
      <CartDrawer /> 
      
      <main className={isAdminPage ? "" : "max-w-6xl mx-auto py-8"}>
        <Routes>
          {/* Wrap the storefront pages in the StoreRoute guard */}
          <Route path="/" element={<StoreRoute><Home /></StoreRoute>} />
          <Route path="/catalog" element={<StoreRoute><Catalog /></StoreRoute>} />
          <Route path="/product/:id" element={<StoreRoute><ProductPage /></StoreRoute>} />
          <Route path="/checkout" element={<StoreRoute><Checkout /></StoreRoute>} />
          <Route path="/giftcard-checkout" element={<StoreRoute><GiftCardPayment /></StoreRoute>} />
          <Route path="/order-success" element={<StoreRoute><OrderSuccess /></StoreRoute>} />
          <Route path="/profile" element={<StoreRoute><ProfilePage /></StoreRoute>} />
          <Route path="/crypto-checkout" element={<StoreRoute><CryptoPayment /></StoreRoute>} />
          <Route path="/children-day" element={<StoreRoute><ChildrenCatalog /></StoreRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;