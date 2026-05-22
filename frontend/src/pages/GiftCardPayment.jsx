import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { submitGiftCards } from '../services/api';

export default function GiftCardPayment() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract order constraints from router navigation state context
  const { orderId, totalAmount } = location.state || {};

  const [giftCards, setGiftCards] = useState([
    { card_type: 'Apple', code: '', claimed_amount: '', image: null }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cardOptions = ['Apple', 'Razer Gold', 'Steam', 'Amazon', 'Sephora', 'Nordstrom'];
  const ADMIN_WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || "234XXXXXXXXXX";

  // Prevent crashes if page is direct refreshed without active checkout context
  if (!orderId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-serif uppercase tracking-widest mb-4">No Active Order Found</h2>
        <Link to="/catalog" className="text-xs font-bold border-b border-black pb-1 uppercase tracking-widest hover:text-amber-600 transition">
          Return to Collection
        </Link>
      </div>
    );
  }

  const handleFieldChange = (index, field, value) => {
    const updated = [...giftCards];
    updated[index][field] = value;
    setGiftCards(updated);
  };

  const handleFileChange = (index, file) => {
    const updated = [...giftCards];
    updated[index].image = file;
    setGiftCards(updated);
  };

  const addCardRow = () => {
    setGiftCards([...giftCards, { card_type: 'Apple', code: '', claimed_amount: '', image: null }]);
  };

  const removeCardRow = (index) => {
    if (giftCards.length > 1) {
      setGiftCards(giftCards.filter((_, i) => i !== index));
    }
  };

  const calculateTotalClaimed = () => {
    return giftCards.reduce((sum, card) => sum + (parseFloat(card.claimed_amount) || 0), 0);
  };

  // 🌟 Generates pre-filled text summary containing details of all added cards
  const generateWhatsAppUrl = () => {
    let cardsSummary = '';
    giftCards.forEach((card, index) => {
      const cleanCode = card.code.toUpperCase().replace(/\s+/g, '');
      cardsSummary += `   ${index + 1}. *${card.card_type}* — Value: $${card.claimed_amount || '0'}, Code: ${cleanCode || 'Not provided'}\n`;
    });

    const messageTemplate = `Hello Aurum & Co., I am finalizing payment for my gift card order!\n\n` +
      `- *Order ID:* #${orderId}\n` +
      `- *Target Balance Due:* $${totalAmount.toFixed(2)}\n` +
      `- *Combined Card Value:* $${calculateTotalClaimed().toFixed(2)}\n\n` +
      `*Submitted Cards Breakdown:*\n${cardsSummary}\n` +
      `_I am uploading the receipt/card proofs now. Please confirm manually._`;
    
    return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(messageTemplate)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();

    giftCards.forEach((card) => {
      formData.append('card_types', card.card_type);
      formData.append('codes', card.code.toUpperCase().replace(/\s+/g, ''));
      formData.append('claimed_amounts', Number(card.claimed_amount));
      formData.append('images', card.image);
    });

    try {
      const data = await submitGiftCards(orderId, formData);
      alert(data.message);
      navigate('/order-success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit gift card validation structures.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif uppercase tracking-widest text-gray-950">Gift Card Settlement</h1>
        <p className="text-xs text-gray-400 uppercase tracking-widest mt-2">
          Secure Processing Matrix for Order <span className="font-mono text-gray-900 font-bold">#{orderId}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Input Form Panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {error && <p className="text-xs text-red-600 font-bold uppercase tracking-wider">{error}</p>}

          {giftCards.map((card, index) => (
            <div key={index} className="p-6 bg-gray-50/60 border border-gray-100 rounded relative space-y-5">
              {giftCards.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCardRow(index)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest transition"
                >
                  ✕ Remove Card
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Card Brand / Type</label>
                  <select
                    value={card.card_type}
                    onChange={(e) => handleFieldChange(index, 'card_type', e.target.value)}
                    className="w-full p-3 border bg-white border-gray-200 text-xs outline-none text-gray-900 tracking-wider font-medium"
                  >
                    {cardOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Face Value Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 100"
                    value={card.claimed_amount}
                    onChange={(e) => handleFieldChange(index, 'claimed_amount', e.target.value.replace(/\D/g, ''))}
                    className="w-full p-3 border border-gray-200 text-xs outline-none text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Gift Card PIN / Serial Code</label>
                <input
                  type="text"
                  required
                  placeholder="ENTER ALPHANUMERIC CODE"
                  value={card.code}
                  onChange={(e) => handleFieldChange(index, 'code', e.target.value)}
                  className="w-full p-3 border border-gray-200 text-xs outline-none uppercase font-mono tracking-widest text-gray-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Clear Picture of Card Back & Receipt</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => handleFileChange(index, e.target.files[0])}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-gray-950 file:text-white file:cursor-pointer hover:file:bg-neutral-800"
                />
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4 border-b border-gray-100 pb-6">
            <button
              type="button"
              onClick={addCardRow}
              className="px-5 py-3 border border-gray-950 text-gray-950 font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition"
            >
              ➕ Add Another Card
            </button>
          </div>

          {/* 🌟 Interactive WhatsApp Communication Box */}
          <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-lg text-center space-y-2">
            <a
              href={generateWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-sm transition"
            >
              💬 Send Card Breakdown via WhatsApp
            </a>
            <p className="text-[10px] text-gray-400">
              Highly recommended: Inform the desk admin of your card pins instantly to prioritize verification.
            </p>
          </div>

          {/* Master Server Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-950 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition disabled:bg-gray-300 shadow-md"
          >
            {loading ? 'Uploading Digital Proofs...' : 'Submit Payment for Verification'}
          </button>
        </form>

        {/* Balance Sidebar Summary */}
        <div className="bg-gray-50 border border-gray-100 p-6 h-fit rounded-lg space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b pb-3">Balance Reconciliation</h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-500"><span>Invoice Target Due:</span><span className="font-mono text-gray-900 font-bold">${totalAmount.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Combined Card Sum:</span><span className="font-mono text-gray-900 font-bold">${calculateTotalClaimed().toFixed(2)}</span></div>
          </div>

          <div className="pt-4 border-t border-dashed border-gray-200">
            <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mb-2">Transaction Status Indicator</p>
            {calculateTotalClaimed() >= totalAmount ? (
              <div className="p-3 bg-green-50 text-green-700 font-bold text-[10px] uppercase tracking-wider text-center rounded">
                ✓ Balance Target Satisfied
              </div>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-700 font-bold text-[10px] uppercase tracking-wider text-center rounded">
                ⚠ Shortage: Needs ${(totalAmount - calculateTotalClaimed()).toFixed(2)} More
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed italic">
            *Please ensure the serial characters match the uploaded images exactly. Cards are liquidated manually within 10-30 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}