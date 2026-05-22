import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('crypto'); 
  const token = localStorage.getItem('token'); 

  useEffect(() => {
    if (!token) {
      alert("Please sign in to complete your purchase.");
      navigate('/login');
    }
  }, [token, navigate]);

  const storedFirstName = localStorage.getItem('firstName') || '';
  const storedLastName = localStorage.getItem('lastName') || ''; 
  const storedEmail = localStorage.getItem('email') || '';

  const [formData, setFormData] = useState({
    email: storedEmail, 
    firstName: storedFirstName, 
    lastName: storedLastName, 
    address: '', 
    city: '', 
    zip: ''
  });

  // 🌟 DYNAMIC PRICING ENGINE FOR CHILDREN'S DAY CAMPAIGN (Categories 6-12)
  const getDynamicCartSummary = () => {
    let computedTotal = 0;
    // Check if current payment configuration unlocks the promotional discount
    const isPromoEligiblePayment = paymentMethod === 'gift_card' || paymentMethod === 'crypto';

    const processedItems = cart.map(item => {
      const isCampaignItem = item.category_id >= 6 && item.category_id <= 12;
      const finalUnitPrice = (isPromoEligiblePayment && isCampaignItem) ? item.price * 0.5 : item.price;
      const lineTotal = finalUnitPrice * item.quantity;
      
      computedTotal += lineTotal;

      return {
        ...item,
        isDiscounted: isPromoEligiblePayment && isCampaignItem,
        promoUnitPrice: finalUnitPrice,
        promoLineTotal: lineTotal
      };
    });

    const hasCampaignItemsInBag = cart.some(item => item.category_id >= 6 && item.category_id <= 12);

    return {
      finalTotal: computedTotal,
      processedItems,
      hasCampaignItemsInBag,
      isPromoActive: isPromoEligiblePayment && hasCampaignItemsInBag
    };
  };

  const { finalTotal, processedItems, hasCampaignItemsInBag, isPromoActive } = getDynamicCartSummary();

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const fullShippingAddress = `${formData.address}, ${formData.city}, ${formData.zip}`;

      const orderData = {
        total_amount: finalTotal, // 🌟 Sends matching promotional calculation to backend validation layer
        payment_method: paymentMethod, 
        shipping_address: fullShippingAddress,
        items: processedItems.map(item => ({ 
          product_id: item.id, 
          quantity: item.quantity, 
          price_at_purchase: item.promoUnitPrice 
        }))
      };

      const response = await createOrder(orderData);
      const orderId = response?.id || response?.data?.id || response?.data?.order_id;

      if (paymentMethod === 'crypto') {
        navigate('/crypto-checkout', { 
          state: { 
            orderId: orderId, 
            totalAmount: finalTotal 
          } 
        });
      } else if (paymentMethod === 'gift_card') {
        navigate('/giftcard-checkout', {
          state: {
            orderId: orderId,
            totalAmount: finalTotal
          }
        });
      } else {
        const adminWhatsAppNumber = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || "234XXXXXXXXXX"; 
        
        const clearTextMessage = `Hello Aurum & Co., I just placed a manual invoice order!\n\n` +
          `*Order ID:* #${orderId || "Pending"}\n` +
          `*Name:* ${formData.firstName} ${formData.lastName}\n` +
          `*Total:* $${finalTotal.toFixed(2)}\n` +
          `*Email:* ${formData.email}\n\n` +
          `_Please provide manual payment instructions._`;

        const whatsappUrl = `https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent(clearTextMessage)}`;
        window.open(whatsappUrl, '_blank');
        navigate('/order-success');
      }
      
    } catch (error) {
      console.error("Order processing failed:", error);
      alert("Failed to process order. Please check data structures or trace network connectivity.");
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
              <input type="email" required value={formData.email} placeholder="Email Address" className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            {/* Shipping Info */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-4">Shipping Address</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="text" required value={formData.firstName} placeholder="First Name" className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm" onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input type="text" required value={formData.lastName} placeholder="Last Name" className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm" onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              
              <input type="text" required value={formData.address} placeholder="Street Address" className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm mb-4" onChange={e => setFormData({...formData, address: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="text" required value={formData.city} placeholder="City" className="w-full px-4 py-3 border border-gray-200 focus:border-amber-600 focus:ring-0 outline-none transition text-sm" onChange={e => setFormData({...formData, city: e.target.value})} />
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

            {/* LUXURY PAYMENT METHOD SELECTOR SYSTEM COMPONENT */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-4">Select Payment Method</h2>
              <div className="space-y-3">
                
                {/* Option A: Crypto Payment Method */}
                <label className={`flex items-center justify-between p-4 border transition cursor-pointer select-none ${paymentMethod === 'crypto' ? 'border-amber-600 bg-amber-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center space-x-3">
                    <input type="radio" name="payment_method" value="crypto" checked={paymentMethod === 'crypto'} onChange={() => setPaymentMethod('crypto')} className="text-amber-600 focus:ring-0" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-900">Cryptocurrency Payment</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Pay via BTC, ETH, USDT, USDC or TRON immediately.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1.5 text-xs font-mono font-medium text-gray-400">
                      <span>BTC</span><span>•</span><span>USDT</span>
                    </div>
                    {hasCampaignItemsInBag && (
                      <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        -50% Active
                      </span>
                    )}
                  </div>
                </label>

                {/* Option B: Gift Card Payment Method */}
                <label className={`flex items-center justify-between p-4 border transition cursor-pointer select-none ${paymentMethod === 'gift_card' ? 'border-amber-600 bg-amber-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center space-x-3">
                    <input type="radio" name="payment_method" value="gift_card" checked={paymentMethod === 'gift_card'} onChange={() => setPaymentMethod('gift_card')} className="text-amber-600 focus:ring-0" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-900">International Gift Cards</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Settle balance with Apple, Razer Gold, Steam, or Amazon cards.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1.5 text-xs font-mono font-medium text-gray-400">
                      <span>APPLE</span><span>•</span><span>STEAM</span>
                    </div>
                    {hasCampaignItemsInBag && (
                      <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        -50% Active
                      </span>
                    )}
                  </div>
                </label>

                {/* Option C: WhatsApp Invoice Checkouts */}
                <label className={`flex items-center justify-between p-4 border transition cursor-pointer select-none ${paymentMethod === 'whatsapp' ? 'border-amber-600 bg-amber-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center space-x-3">
                    <input type="radio" name="payment_method" value="whatsapp" checked={paymentMethod === 'whatsapp'} onChange={() => setPaymentMethod('whatsapp')} className="text-amber-600 focus:ring-0" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-900">Direct WhatsApp Checkout</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Place order database tracking logs and finish details with an agent manually.</p>
                    </div>
                  </div>
                </label>

                {/* Option D: Credit/Debit Card (Coming Soon) */}
                <label className="flex items-center justify-between p-4 border border-gray-150 bg-gray-50/50 opacity-60 cursor-not-allowed select-none">
                  <div className="flex items-center space-x-3">
                    <input type="radio" name="payment_method" value="card" disabled className="text-gray-300 focus:ring-0 cursor-not-allowed" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 line-through">Credit / Debit Card</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Secure payment via Visa, Mastercard, or American Express gateways.</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Coming Soon</span>
                </label>

              </div>
            </div>

            {/* Execution Master Action Triggers */}
            <button 
              type="submit" 
              disabled={isProcessing}
              className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition shadow-lg mt-4 flex items-center justify-center space-x-2 ${
                isProcessing 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              <span>{isProcessing ? 'Processing Transaction Pipeline...' : 'Place Secure Order'}</span>
            </button>
          </form>
        </div>

        {/* Order Sidebar Summary */}
        <div className="w-full lg:w-2/5 bg-gray-50 p-8 border border-gray-100 h-fit sticky top-32">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6 border-b border-gray-200 pb-4">Order Summary</h2>
          
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
            {processedItems.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={item.main_image_url} alt={item.name} className="w-16 h-20 object-cover border border-gray-200 bg-white" />
                    <span className="absolute -top-2 -right-2 bg-gray-900 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 max-w-[180px]">
                    <p className="font-serif text-gray-900 truncate">{item.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {item.color !== 'None' && <span className="text-[9px] text-gray-500 uppercase tracking-widest">{item.color}</span>}
                      {item.chosenSize && <span className="text-[9px] bg-stone-200 text-stone-800 px-1 font-mono rounded">{item.chosenSize}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  {item.isDiscounted ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-rose-600 font-bold">${item.promoLineTotal.toFixed(2)}</span>
                      <span className="text-[10px] text-gray-300 line-through">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 🌟 CONDITIONAL CAMPAIGN REMINDER BANNER */}
          {isPromoActive && (
            <div className="mb-6 bg-amber-50 border border-amber-200 p-3 rounded text-center">
              <p className="text-[10px] text-amber-900 uppercase tracking-wider font-bold">
                ⚡ Campaign Slash Active: A 50% promotional markdown has been calculated for the child items in your cart.
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 space-y-3 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">${finalTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Complimentary Shipping</span><span className="font-mono">$0.00</span></div>
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-4 border-t border-gray-200 mt-4">
              <span>Total</span>
              <span className="font-mono text-gray-900">${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}