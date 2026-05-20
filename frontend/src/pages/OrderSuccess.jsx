import { Link, useLocation } from 'react-router-dom';

export default function OrderSuccess() {
  const location = useLocation();
  
  // 🌟 Extract the crypto state and order tracking info passed from the router
  const { orderId, isCrypto } = location.state || { orderId: null, isCrypto: false };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6 shadow-xl">
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24 " className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      
      {/* 🌟 Dynamic Tag: Switches based on payment method */}
      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.3em] mb-4">
        {isCrypto ? 'Payment Under Review' : 'Order Confirmed'}
      </span>
      
      <h1 className="text-4xl font-serif text-gray-900 mb-4">Thank You.</h1>
      
      {/* 🌟 Dynamic Body Text: Explains the blockchain verification status to crypto users */}
      <p className="text-gray-500 text-xs tracking-widest uppercase mb-10 max-w-md leading-relaxed">
        {isCrypto ? (
          `Your transaction hash for Order #${orderId || 'N/A'} has been logged. Our administrators are currently verifying the blockchain transfer, and you will receive a confirmation email shortly.`
        ) : (
          'Your order has been received and is being prepared for secure shipment. You will receive an email confirmation shortly.'
        )}
      </p>
      
      <Link to="/catalog" className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-amber-600 transition shadow-lg">
        Return to Collection
      </Link>
    </div>
  );
}