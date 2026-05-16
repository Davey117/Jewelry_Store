import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Dark Overlay background */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* The Slide-out Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-serif text-2xl tracking-widest uppercase">Your Bag</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-black">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-gray-500 uppercase tracking-widest text-xs mb-4">Your bag is empty</p>
              <button onClick={() => setIsCartOpen(false)} className="border-b border-black text-xs font-bold uppercase tracking-widest pb-1">Continue Shopping</button>
            </div>
          ) : (
            <div className="space-y-8">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  
                  {/* Thumbnail */}
                  <div className="w-20 h-24 bg-gray-50 flex-shrink-0">
                    {item.main_image_url ? (
                      <img src={item.main_image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] uppercase tracking-widest text-gray-400">No Img</div>
                    )}
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-serif text-gray-900 leading-tight">{item.name}</h3>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">{item.color !== 'None' ? item.color : ''}</p>
                    <p className="font-bold text-sm tracking-wide mb-auto">${item.price.toFixed(2)}</p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center border border-gray-200">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 text-gray-500 hover:bg-gray-50 transition">-</button>
                        <span className="px-2 text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 text-gray-500 hover:bg-gray-50 transition">+</button>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Checkout) */}
        {cart.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <span className="uppercase tracking-widest text-xs font-bold text-gray-500">Subtotal</span>
              <span className="font-serif text-2xl tracking-wider">${cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => {
                setIsCartOpen(false); // Close the drawer
                navigate('/checkout'); // Send them to the checkout page
              }}
              className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-amber-600 transition shadow-lg"
            >
              Proceed to Checkout
            </button>
          </div>
        )}

      </div>
    </>
  );
}