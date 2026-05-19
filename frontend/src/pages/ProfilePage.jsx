import { useState, useEffect } from 'react';
import { fetchUserProfile, updateUserProfile, fetchUserOrderHistory } from '../services/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    shipping_address: ''
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const [userProfile, orderHistory] = await Promise.all([
          fetchUserProfile(),
          fetchUserOrderHistory()
        ]);
        setProfile(userProfile);
        setOrders(orderHistory);
        setFormData({
          first_name: userProfile.first_name || '',
          last_name: userProfile.last_name || '',
          phone_number: userProfile.phone_number || '',
          shipping_address: userProfile.shipping_address || ''
        });
      } catch (err) {
        console.error("Failed to load customer profile context:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const updated = await updateUserProfile(formData);
      setProfile(updated);
      setIsEditing(false);
      setMsg({ type: 'success', text: 'Profile changes permanently committed.' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to update credentials. Try again.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-xs tracking-[0.2em] uppercase text-gray-400">
        Authenticating Vault Access...
      </div>
    );
  }

  // Tier style generator
  const getTierBadgeStyles = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'vanguard vip':
        return 'bg-gradient-to-r from-amber-600 to-amber-900 text-white border-amber-500 shadow-md';
      case 'elite':
        return 'bg-stone-900 text-amber-400 border-stone-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 text-gray-900">
      
      {/* HEADER SECTION */}
      <div className="border-b pb-6 mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif uppercase tracking-widest">Account Profile</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Manage credentials and purchase registry</p>
        </div>
        {msg.text && (
          <div className={`px-4 py-2 rounded text-xs uppercase tracking-wider font-medium border ${
            msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {msg.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: LOYALTY CARD & VAULT STATS */}
        <div className="space-y-6">
          
          {/* DIGITAL MEMBERSHIP MEMBERSHIP CARD */}
          <div className="bg-gradient-to-br from-stone-900 via-black to-stone-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-amber-500/20 aspect-[1.6/1] flex flex-col justify-between group">
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-colors duration-700"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-[0.3em] text-amber-500/70 font-bold block mb-1">Aurum Guild Membership</span>
                <h3 className="text-xl font-serif tracking-widest uppercase truncate max-w-[200px]">
                  {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : 'Collector'}
                </h3>
              </div>
              <span className={`text-[9px] px-3 py-1 font-bold rounded-full uppercase tracking-widest border ${getTierBadgeStyles(profile?.loyalty_tier)}`}>
                {profile?.loyalty_tier || 'Novice'}
              </span>
            </div>

            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
              <div>
                <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 block">Total Investment</span>
                <span className="text-lg font-bold text-amber-500 font-serif tracking-wide">
                  ${Number(profile?.total_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <span className="font-serif text-xl tracking-widest text-stone-700 select-none uppercase">A & CO</span>
            </div>
          </div>

          {/* CREDENTIALS/SECURITY SYSTEM OVERLAY (COMING SOON) */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center z-10 p-4">
              <span className="bg-black text-white text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded shadow-md mb-2">
                Coming Soon
              </span>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest max-w-[200px] leading-relaxed">
                Direct password changes will lock live upon custom domain configuration.
              </p>
            </div>
            
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">Security Parameters</h4>
            <div className="space-y-3 opacity-30 pointer-events-none">
              <input type="password" disabled placeholder="Current Password" className="w-full px-3 py-2 border rounded text-xs bg-white" />
              <input type="password" disabled placeholder="New Secure Password" className="w-full px-3 py-2 border rounded text-xs bg-white" />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REVENUE ARCHIVE & PROFILE FORMS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* PROFILE CORE MANAGEMENT LAYOUT */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Contact Documentation</h3>
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className="text-xs font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 transition"
              >
                {isEditing ? 'Cancel' : 'Modify Credentials'}
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">First Name</label>
                  <input 
                    type="text" 
                    disabled={!isEditing} 
                    value={formData.first_name} 
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm outline-none bg-gray-50/50 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Last Name</label>
                  <input 
                    type="text" 
                    disabled={!isEditing} 
                    value={formData.last_name} 
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm outline-none bg-gray-50/50 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Registered Email Address</label>
                <input 
                  type="email" 
                  disabled 
                  value={profile?.email || ''} 
                  className="w-full px-3 py-2 border rounded text-sm bg-gray-100 text-gray-400 cursor-not-allowed outline-none" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Primary Telephone Phone</label>
                <input 
                  type="text" 
                  disabled={!isEditing} 
                  placeholder="No phone record registered"
                  value={formData.phone_number} 
                  onChange={e => setFormData({...formData, phone_number: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm outline-none bg-gray-50/50 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Vault Shipping Address Destination</label>
                <textarea 
                  disabled={!isEditing} 
                  placeholder="No physical address signature saved"
                  value={formData.shipping_address} 
                  onChange={e => setFormData({...formData, shipping_address: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm h-20 outline-none resize-none bg-gray-50/50 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                ></textarea>
              </div>

              {isEditing && (
                <div className="pt-2 flex justify-end">
                  <button type="submit" className="bg-black text-white font-bold py-2 px-8 rounded text-xs uppercase shadow-md hover:bg-amber-600 transition tracking-wider">
                    Save Modifications
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* ACQUISITION ARCHIVE LOGS (PURCHASE HISTORY) */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 border-b pb-4">Order Acquisition Registry</h3>
            
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 border border-dashed rounded">
                <p className="text-gray-400 uppercase text-[10px] tracking-widest">No transaction data present inside account context ledger.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full scrollbar-thin">
                <table className="w-full min-w-[550px] text-left text-sm border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b">
                    <tr>
                      <th className="px-4 py-3">Receipt Index</th>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Aggregate Value</th>
                      <th className="px-4 py-3 text-right">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/60 transition-colors text-xs">
                        <td className="px-4 py-4 font-mono font-bold text-gray-900">#{order.id}</td>
                        <td className="px-4 py-4 text-gray-500">
                          {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-4 font-bold text-gray-900">
                          ${Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block ${
                            order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                            ['confirmed', 'processing', 'shipped'].includes(order.status) ? 'bg-blue-100 text-blue-700' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}