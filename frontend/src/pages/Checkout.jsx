import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const token = localStorage.getItem('token'); 

  useEffect(() => {
    if (!token) {
      alert("Please sign in to complete your purchase.");
      navigate('/login');
    }
  }, [token, navigate]);

  // ✨ UX UPGRADE: Pull stored details so the user doesn't have to re-type them!
  const storedFirstName = localStorage.getItem('firstName') || '';
  const storedLastName = localStorage.getItem('lastName') || ''; 
  const storedEmail = localStorage.getItem('email') || '';

  // ✨ Set the initial state using the stored variables
  const [formData, setFormData] = useState({
    email: storedEmail, 
    firstName: storedFirstName, 
    lastName: storedLastName, 
    address: '', 
    city: '', 
    zip: ''
  });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const orderData = {
        total_amount: cartTotal,
        items: cart.map(item => ({ 
          product_id: item.id, 
          quantity: item.quantity, 
          price_at_purchase: item.price 
        }))
      };

      await createOrder(orderData);
      
      const adminWhatsAppNumber = "2348000000000"; 
      const message = `Hello Aurum & Co., I just placed an order!%0A%0A*Name:* ${formData.firstName} ${formData.lastName}%0A*Total:* $${cartTotal.toFixed(2)}%0A*Email:* ${formData.email}%0A%0A_Please let me know how to proceed with payment._`;
      const whatsappUrl = `https://wa.me/${adminWhatsAppNumber}?text=${message}`;

      clearCart();
      window.open(whatsappUrl, '_blank');
      navigate('/order-success');
      
    } catch (error) {
      console.error("Order processing failed:", error);
      alert("Failed to process order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0 && !isProcessing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-serif uppercase tracking-widest mb-4">Your Bag is Empty</h2>
        <Link to="/catalog" className="text-xs font-bold border-b border-black pb-1 uppercase tracking-widest hover:text-amber-600 transition">
          Return to Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-16">
        
        <div className="w-full lg:w-3/5">
          <h1 className="text-3xl font-serif text-gray-900 tracking-widest uppercase mb-10">Checkout</h1>
          
          <form onSubmit={handlePlaceOrder} className="space-y-10">
            
            {/* Contact Info */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-4">Contact Information</h2>
              {/* ✨ Notice we added value={formData.email} to map it to our pre-filled state */}
              <input type="email" required value={formData.email} placeholder="Email Address" className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            {/* Shipping Info */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-4">Shipping Address</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* ✨ Pre-filled First and Last Name */}
                <input type="text" required value={formData.firstName} placeholder="First Name" className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm" onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input type="text" required value={formData.lastName} placeholder="Last Name" className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm" onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              
              {/* ✨ Notice we added value={formData...} to these as well to ensure they function perfectly as controlled inputs */}
              <input type="text" required value={formData.address} placeholder="Street Address" className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm mb-4" onChange={e => setFormData({...formData, address: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="text" required value={formData.city} placeholder="City" className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm" onChange={e => setFormData({...formData, city: e.target.value})} />
                
                {/* ✨ ZIP CODE UPGRADE: replace(/\D/g, '') instantly destroys any letters typed into the box! */}
                <input 
                  type="text" 
                  required 
                  value={formData.zip} 
                  inputMode="numeric" 
                  pattern="[0-9]*"
                  placeholder="Postal / Zip Code" 
                  className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm" 
                  onChange={e => setFormData({...formData, zip: e.target.value.replace(/\D/g, '')})} 
                />
              </div>
            </div>

            {/* WhatsApp Payment Box */}
            <div className="bg-amber-50 p-6 border border-amber-200 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
              <svg className="w-8 h-8 text-amber-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-900 mb-2">Card Payment Coming Soon</h2>
              <p className="text-xs text-amber-700 max-w-md">
                We are currently upgrading our secure payment gateway. For now, please complete your order via WhatsApp. Our team will assist you immediately with payment and shipping.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition shadow-lg mt-8 flex items-center justify-center space-x-2 ${isProcessing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-[#25D366] text-white hover:bg-[#1ebe5d]'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>{isProcessing ? 'Processing Order...' : 'Complete Order on WhatsApp'}</span>
            </button>
          </form>
        </div>

        <div className="w-full lg:w-2/5 bg-gray-50 p-8 border border-gray-100 h-fit sticky top-32">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6 border-b border-gray-200 pb-4">Order Summary</h2>
          
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={item.main_image_url} alt={item.name} className="w-16 h-20 object-cover border border-gray-200 bg-white" />
                    <span className="absolute -top-2 -right-2 bg-gray-900 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div>
                    <p className="font-serif text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{item.color !== 'None' ? item.color : ''}</p>
                  </div>
                </div>
                <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Complimentary Shipping</span><span>$0.00</span></div>
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-4 border-t border-gray-200 mt-4">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}