import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext"; // 🌟 Added to control persistent cart state lifecycle

// 1. Define your Crypto & Network Config Matrix
const CRYPTO_CONFIG = {
  Bitcoin: {
    networks: {
      "Bitcoin Main Network": "bc1qc6nvan8t0c02dge4qfaf3s7a6mhzjz84wspn8h", 
      "Lightning Network": "", // Empty string defaults to "Available Soon"
    },
  },
  Ethereum: {
    networks: {
      "Ethereum Mainnet (ERC-20)": "0x8c0bF67d8189E4c01338bec05A9DFfC8FE7b74a1", 
      "Arbitrum": "0x8c0bF67d8189E4c01338bec05A9DFfC8FE7b74a1",
      "Optimism": "0x8c0bF67d8189E4c01338bec05A9DFfC8FE7b74a1",
      "Base": "0x8c0bF67d8189E4c01338bec05A9DFfC8FE7b74a1",
    },
  },
  USDT: {
    networks: {
      "TRON (TRC-20)": "TLDeGoepazgsDxxfYUmbhJLKtRpi9K2xeZ",
      "Ethereum (ERC-20)": "0x8c0bF67d8189E4c01338bec05A9DFfC8FE7b74a1",
      "BNB Smart Chain (BEP-20)": "0x8c0bF67d8189E4c01338bec05A9DFfC8FE7b74a1",
    },
  },
  USDC: {
    networks: {
      "Ethereum (ERC-20)": "0x8c0bF67d8189E4c01338bec05A9DFfC8FE7b74a1",
      "Solana": "9znFrY1oU2J2hmcSFdpeanzqqfXKAdDL4iTYpkmu8NJh",
      "Polygon": "0x8c0bF67d8189E4c01338bec05A9DFfC8FE7b74a1",
    },
  },
  TRON: {
    networks: {
      "TRON Network (TRC-20)": "TLDeGoepazgsDxxfYUmbhJLKtRpi9K2xeZ",
    },
  },
};

export default function CryptoPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart(); // 🌟 Pull clearCart into execution workspace context

  // Extract order constraints passed from your main checkout page routing context
  const { orderId, totalAmount } = location.state || { orderId: null, totalAmount: 0 };

  // Component States
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAborting, setIsAborting] = useState(false); // 🌟 State tracker for transaction reversal pipeline
  const [error, setError] = useState("");

  // Configuration Constants
  const ADMIN_WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER; 
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  
  // Dynamic Resolution Handlers
  const availableNetworks = selectedCrypto ? Object.keys(CRYPTO_CONFIG[selectedCrypto].networks) : [];
  const walletAddress = (selectedCrypto && selectedNetwork) 
    ? CRYPTO_CONFIG[selectedCrypto].networks[selectedNetwork] 
    : "";

  const handleCryptoChange = (e) => {
    setSelectedCrypto(e.target.value);
    setSelectedNetwork(""); // Reset network when crypto assets swap
    setCopied(false);
  };

  const handleCopyAddress = () => {
    if (walletAddress && walletAddress !== "") {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000); // Reset copy tooltip status after 3s
    }
  };

  // Pre-filled WhatsApp URI String Generator
  const generateWhatsAppUrl = () => {
    const messageTemplate = `Hello Aurum & Co., I have just sent a crypto payment for my order!\n\n` +
      `- *Order ID:* #${orderId || "N/A"}\n` +
      `- *Total Amount:* $${totalAmount.toLocaleString()}\n` +
      `- *Cryptocurrency:* ${selectedCrypto}\n` +
      `- *Network:* ${selectedNetwork}\n` +
      `- *Transaction Hash/Sender Wallet:* ${txHash || "Not attached (Admin please verify)"}`;
    
    return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(messageTemplate)}`;
  };

  // 🌟 Rollback unfulfilled order context and seamlessly return to checkout workspace
  const handleCancelAndReturn = async () => {
    setIsAborting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/checkout');
    } catch (err) {
      console.error("Failed to cancel unfulfilled transaction:", err);
      setError("Error returning to checkout. Please check structural network links.");
    } finally {
      setIsAborting(false);
    }
  };

  // Submit Data and Route Lifecycle to success screen
  const handleFinalizeCheckout = async (e) => {
    e.preventDefault();
    if (!selectedCrypto || !selectedNetwork) {
      setError("Please choose a cryptocurrency and network channel.");
      return;
    }
    if (!walletAddress) {
      setError("This payment channel is currently unavailable.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token"); 
      
      // Hit the explicit route we updated in your backend
      await axios.post(
        `${API_BASE_URL}/orders/${orderId}/submit-crypto`,
        {
          crypto_currency: selectedCrypto,
          crypto_network: selectedNetwork,
          crypto_tx_hash: txHash || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      clearCart(); // 🌟 Clear cart ONLY when valid blockchain transaction payload verification logs are submitted
      navigate("/order-success", { state: { orderId, totalAmount, isCrypto: true } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to log crypto transaction records.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gracefully fallback if the page is direct refreshed without active checkout constraints
  if (!orderId) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-6 border rounded-lg bg-white shadow-md">
        <p className="text-red-600 font-semibold mb-4">No active order context found.</p>
        <button onClick={() => navigate("/cart")} className="px-4 py-2 bg-black text-white rounded">
          Return to Cart
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-12 p-8 border border-neutral-200 rounded-xl bg-white shadow-sm font-sans text-neutral-800">
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 border-b pb-4 mb-6">
        Aurum & Co. Crypto Checkout
      </h2>
      
      <div className="bg-neutral-50 p-4 rounded-lg mb-6 border border-neutral-100 flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Order Number</p>
          <p className="font-semibold text-neutral-900">#{orderId}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Amount Due</p>
          <p className="font-bold text-lg text-amber-700">${totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleFinalizeCheckout} className="space-y-5">
        {/* Dropdown 1: Choose Crypto Token Asset */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Select Cryptocurrency</label>
          <select
            value={selectedCrypto}
            onChange={handleCryptoChange}
            className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            required
          >
            <option value="">-- Choose Currency --</option>
            {Object.keys(CRYPTO_CONFIG).map((coin) => (
              <option key={coin} value={coin}>{coin}</option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: Choose Cryptographic Network Layer */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Select Network Channel</label>
          <select
            value={selectedNetwork}
            onChange={(e) => { setSelectedNetwork(e.target.value); setError(""); }}
            disabled={!selectedCrypto}
            className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-neutral-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">-- Choose Network --</option>
            {availableNetworks.map((net) => (
              <option key={net} value={net}>{net}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Display Wallet Window Panel */}
        {selectedCrypto && selectedNetwork && (
          <div className="p-4 border border-neutral-200 bg-neutral-50/50 rounded-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-200 text-neutral-600">
              Payment Destination Address
            </span>
            
            {walletAddress ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-white border p-2.5 rounded-lg">
                  <code className="text-xs font-mono break-all select-all flex-1 text-neutral-700">
                    {walletAddress}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded transitioning-all"
                  >
                    {copied ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-neutral-400">
                  ⚠️ Send exactly <span className="font-bold text-neutral-600">${totalAmount.toLocaleString()}</span> value worth of {selectedCrypto} via the {selectedNetwork}.
                </p>
              </div>
            ) : (
              <div className="text-sm text-amber-700 font-semibold italic p-2 bg-amber-50/50 rounded border border-amber-100">
                ⚡ Available Soon (This network channel is currently undergoing maintenance)
              </div>
            )}
          </div>
        )}

        {/* Input Field: TxHash Tracking Field */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">
            Transaction Hash / TxID <span className="text-xs text-neutral-400 font-normal">(Required)</span>
          </label>
          <input
            type="text"
            required
            placeholder="Paste your transaction hash receipt token here..."
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="w-full p-2.5 border border-neutral-300 rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Interactive Step 3 Action Matrix: WhatsApp Link Out */}
        {selectedCrypto && selectedNetwork && walletAddress && (
          <div className="pt-2">
            <a
              href={generateWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-all text-sm"
            >
              💬 Send Payment Confirmation via WhatsApp
            </a>
            <p className="text-center text-[11px] text-neutral-400 mt-1">
              Click this to open WhatsApp and inform the desk admin to confirm your blockchain logs instantly.
            </p>
          </div>
        )}

        {/* Master Execution Submission */}
        <button
          type="submit"
          disabled={isSubmitting || !walletAddress || isAborting}
          className="w-full mt-4 py-3 bg-neutral-900 hover:bg-black disabled:bg-neutral-300 text-white font-semibold rounded-lg shadow transition-all text-sm tracking-wide"
        >
          {isSubmitting ? "Processing Order Context..." : "Confirm Payment & Complete Checkout"}
        </button>

        {/* 🌟 ESCAPE PIPELINE TRICK LINK OUT BUTTON */}
        <button
          type="button"
          disabled={isAborting || isSubmitting}
          onClick={handleCancelAndReturn}
          className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-gray-50 transition disabled:opacity-50"
        >
          {isAborting ? 'Restoring Cart Matrix...' : '← Change Payment Method'}
        </button>
      </form>
    </div>
  );
}