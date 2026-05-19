import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchUsers, 
  updateUserRole, 
  fetchAdminProducts, 
  createProduct, 
  fetchCategories, 
  fetchAdminOrders, 
  updateOrderStatus, 
  updateProduct,
  deleteProduct 
} from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // --- UI & NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('inventory');
  const [isCollapsed, setIsCollapsed] = useState(false); 
  
  // --- DATA REPOSITORY ---
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]); 
  const [categories, setCategories] = useState([]); 
  const [orders, setOrders] = useState([]);
  
  // --- ACTION & STATUS STATE ---
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false); 
  const [formError, setFormError] = useState(null); 
  const [isUploading, setIsUploading] = useState(false);

  // --- NEW PRODUCT OBJECT ---
  const [newProduct, setNewProduct] = useState({ 
    name: '', description: '', price: '', stock_quantity: '', 
    category_id: '', color: 'None', main_image: null, 
    image_2: null, image_3: null, image_4: null 
  });

  // --- EDITING & DELETING STATE ---
  const [editingProduct, setEditingProduct] = useState(null); // 🌟 Tracks product details form modification target
  const [deletingProduct, setDeletingProduct] = useState(null); 

  const userRole = localStorage.getItem('userRole') || 'user';
  const firstName = localStorage.getItem('firstName') || 'Executive'; 

  // --- LIFECYCLE: DATA FETCHING ---
  useEffect(() => {
    loadCategories();
    if (activeTab === 'inventory') loadProducts();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'team' && userRole === 'superadmin') loadUsers();
  }, [activeTab, userRole]);

  const loadCategories = async () => {
    try { 
      const data = await fetchCategories();
      setCategories(Array.isArray(data) ? data : data.categories || []); 
    } 
    catch (err) { 
      console.error("Could not load categories from backend API", err);
      setCategories([
        { id: 1, name: "Watches" },
        { id: 2, name: "Necklaces" },
        { id: 3, name: "Earrings" },
        { id: 4, name: "Rings" }
      ]);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try { setUsers(await fetchUsers()); } 
    catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const loadProducts = async () => {
    setLoading(true);
    try { setProducts(await fetchAdminProducts()); } 
    catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const loadOrders = async () => {
    setLoading(true);
    try { setOrders(await fetchAdminOrders()); } 
    catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // --- LOGIC HANDLERS ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError(null); 
    setIsUploading(true);

    if (!newProduct.main_image) {
      setFormError("A primary product image is required.");
      setIsUploading(false);
      return;
    }
    
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('description', newProduct.description);
    formData.append('price', newProduct.price);
    formData.append('stock_quantity', newProduct.stock_quantity);
    formData.append('category_id', newProduct.category_id);
    formData.append('color', newProduct.color);
    formData.append('main_image', newProduct.main_image);
    
    formData.append('images', newProduct.main_image);
    if (newProduct.image_2) formData.append('images', newProduct.image_2);
    if (newProduct.image_3) formData.append('images', newProduct.image_3);
    if (newProduct.image_4) formData.append('images', newProduct.image_4);

    try {
      await createProduct(formData);
      setNewProduct({ name: '', description: '', price: '', stock_quantity: '', category_id: '', color: 'None', main_image: null, image_2: null, image_3: null, image_4: null });
      setShowAddProduct(false);
      loadProducts(); 
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
         setFormError(`${detail[0].loc[1]}: ${detail[0].msg}`);
      } else {
         setFormError(detail || "An unexpected network error occurred.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProductDetails = async (e) => {
    e.preventDefault();
    try {
      await updateProduct(editingProduct.id, {
        name: editingProduct.name,
        price: parseFloat(editingProduct.price),
        stock_quantity: parseInt(editingProduct.stock_quantity),
        category_id: parseInt(editingProduct.category_id),
        color: editingProduct.color,
        description: editingProduct.description
      });
      setEditingProduct(null); 
      loadProducts(); 
    } catch (err) { 
      alert("Failed to modify compilation entry parameters."); 
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      loadProducts(); 
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to purge item from repository.");
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (err) { alert("Failed to update order status."); }
  };

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRole(userId, newRole);
      loadUsers(); 
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-[85vh] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden mt-4 lg:mt-8 relative text-gray-900">
      
      {/* --- SIDEBAR --- */}
      <div className={`bg-black text-white flex flex-col transition-all duration-300 w-full lg:w-64 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className="h-20 flex items-center justify-between px-4 border-b border-gray-800">
          {!isCollapsed && <h2 className="text-xl font-serif tracking-widest uppercase text-amber-500 whitespace-nowrap">Aurum</h2>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 text-gray-400 hover:text-white">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>
        
        <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible py-3 lg:py-6 px-3 gap-2 lg:space-y-3 scrollbar-none">
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center px-3 py-3 rounded text-sm tracking-wide uppercase transition-colors ${activeTab === 'inventory' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-900'}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeWidth="2"></path></svg>
            <span className={`ml-4 ${isCollapsed ? 'lg:hidden' : 'lg:block'}`}>Inventory</span>
          </button>
          
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center px-3 py-3 rounded text-sm tracking-wide uppercase transition-colors ${activeTab === 'orders' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-900'}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeWidth="2"></path></svg>
            <span className={`ml-4 ${isCollapsed ? 'lg:hidden' : 'lg:block'}`}>Orders</span>
          </button>
          
          {userRole === "superadmin" && (
            <button onClick={() => setActiveTab('team')} className={`w-full flex items-center px-3 py-3 rounded text-sm tracking-wide uppercase transition-colors ${activeTab === 'team' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-900'}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" strokeWidth="2"></path></svg>
              <span className={`ml-4 ${isCollapsed ? 'lg:hidden' : 'lg:block'}`}>Team Access</span>
            </button>
          )}
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center py-2 border border-gray-700 text-gray-400 rounded transition-colors hover:text-white hover:border-white">
            <span className={isCollapsed ? "hidden" : "text-xs uppercase tracking-widest"}>Sign Out</span>
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-serif text-gray-900 uppercase tracking-widest">{activeTab.replace('-', ' ')}</h1>
          <div className="text-xs text-gray-500 uppercase bg-white px-4 py-2 rounded-full border shadow-sm">
            Admin: <span className="font-bold text-amber-600">{firstName}</span>
          </div>
        </header>

        {/* INVENTORY SECTION */}
        {activeTab === 'inventory' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase">Catalog Management</h3>
              <button onClick={() => setShowAddProduct(!showAddProduct)} className="bg-black text-white px-4 py-2 rounded text-xs uppercase hover:bg-gray-800 transition">
                {showAddProduct ? 'Cancel' : '+ New Item'}
              </button>
            </div>

            {showAddProduct && (
              <form onSubmit={handleAddProduct} className="mb-8 bg-gray-50 p-6 rounded border border-gray-200">
                {formError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-200">Error: {formError}</div>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="px-3 py-2 border rounded text-sm" placeholder="Product Name" />
                  <input type="number" step="0.01" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="px-3 py-2 border rounded text-sm" placeholder="Price ($)" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <select 
                    required 
                    value={newProduct.category_id} 
                    onChange={e => setNewProduct({...newProduct, category_id: e.target.value})} 
                    className="px-3 py-2 border rounded text-sm bg-white"
                  >
                    <option value="">Select Category</option>
                    <option value="4">Rings</option>
                    <option value="2">Necklaces</option>
                    <option value="1">Watches</option>
                    <option value="3">Earrings</option>
                  </select>

                  <select 
                    required 
                    value={newProduct.color} 
                    onChange={e => setNewProduct({...newProduct, color: e.target.value})} 
                    className="px-3 py-2 border rounded text-sm bg-white"
                  >
                    <option value="None">Material: None</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                  </select>
                </div>

                <textarea required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-3 py-2 border rounded text-sm mb-4 h-20" placeholder="Product Details..."></textarea>

                {/* 🌟 MAIN UPLOAD CANVAS LIVE PREVIEW OVERLAY */}
                <div className="mb-4 p-4 border border-dashed border-amber-300 bg-amber-50 rounded text-center">
                  <p className="text-[10px] font-bold text-amber-900 mb-2 uppercase">Main Image (Required)</p>
                  {newProduct.main_image && (
                    <img 
                      src={URL.createObjectURL(newProduct.main_image)} 
                      className="w-24 h-28 object-cover mx-auto mb-3 rounded shadow-sm border border-amber-200" 
                      alt="Primary canvas generation preview" 
                    />
                  )}
                  <input type="file" accept="image/*" required onChange={e => setNewProduct({...newProduct, main_image: e.target.files[0]})} className="text-xs" />
                </div>

                {/* 🌟 ADDITIONAL ASSETS LIVE PREVIEWS */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {[2, 3, 4].map(num => (
                    <div key={num} className="border p-2 bg-white rounded text-center">
                      <p className="text-[8px] uppercase text-gray-400 mb-1">Extra {num-1}</p>
                      {newProduct[`image_${num}`] && (
                        <img 
                          src={URL.createObjectURL(newProduct[`image_${num}`])} 
                          className="w-12 h-16 object-cover mx-auto mb-1 rounded border shadow-sm" 
                          alt="Extra view asset preview" 
                        />
                      )}
                      <input type="file" accept="image/*" onChange={e => setNewProduct({...newProduct, [`image_${num}`]: e.target.files[0]})} className="text-[8px] w-full" />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <input type="number" required value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: e.target.value})} className="w-32 px-3 py-2 border rounded text-sm" placeholder="Stock Level" />
                  <button type="submit" disabled={isUploading} className="bg-amber-600 text-white font-bold py-2 px-8 rounded text-xs uppercase shadow-md disabled:bg-gray-400">
                    {isUploading ? 'Transferring to Cloud...' : 'Commit to Catalog'}
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto border rounded bg-gray-50 w-full scrollbar-thin">
              <table className="w-full min-w-[750px] text-left text-sm border-collapse">
                <thead className="bg-gray-100 text-xs font-bold uppercase text-gray-700">
                  <tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Added By</th></tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 flex items-center space-x-3 font-medium text-gray-900">
                        <img src={p.main_image_url || p.image_url} className="w-10 h-10 object-cover rounded shadow-sm" alt="" />
                        <span>{p.name}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                           {p.category_id === 1 && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded border uppercase">Watches</span>}
                           {p.category_id === 2 && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded border uppercase">Necklaces</span>}
                           {p.category_id === 3 && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded border uppercase">Earrings</span>}
                           {p.category_id === 4 && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded border uppercase">Rings</span>}
                           {p.color !== "None" && <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${p.color === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-600'}`}>{p.color}</span>}
                        </div>
                      </td>
                      
                      {/* 🌟 AUTOMATIC THOUSAND-SEPARATOR SYSTEM */}
                      <td className="px-4 py-4 font-bold">
                        ${Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${p.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.stock_quantity > 0 ? `${p.stock_quantity} units` : 'Void'}
                        </span>
                        <div className="flex flex-col gap-1 mt-2">
                          {/* 🌟 EDIT LINK ACCESSIBLE TO BOTH ROLES */}
                          {(userRole === 'admin' || userRole === 'superadmin') && (
                            <button onClick={() => setEditingProduct(p)} className="text-left text-[10px] text-amber-600 font-bold hover:underline uppercase tracking-wide">
                              Edit Product
                            </button>
                          )}
                          
                          {/* 🌟 EXCLUSIVE REMOVAL LINK FOR SUPERADMIN ONLY */}
                          {userRole === 'superadmin' && (
                            <button onClick={() => setDeletingProduct(p)} className="text-left text-[10px] text-red-600 font-bold hover:underline uppercase tracking-wide mt-0.5">
                              Delete Product
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-xs text-gray-400 italic">{p.added_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS SECTION */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-6">Order Management</h3>
            <div className="overflow-hidden border rounded bg-gray-50">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-xs font-bold uppercase text-gray-700">
                    <tr><th className="px-4 py-3">Order ID</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">#{order.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold">{order.user?.first_name} {order.user?.last_name}</p>
                          <p className="text-[10px] text-gray-500">{order.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 font-bold">${order.total_amount.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            order.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                            ['confirmed', 'processing', 'shipped'].includes(order.status) ? 'bg-blue-100 text-blue-700' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} className="text-xs border rounded-md px-2 py-1 outline-none">
                            <option value="pending_payment">Pending Payment</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
        )}

        {/* TEAM SECTION */}
        {activeTab === 'team' && userRole === "superadmin" && (
           <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-amber-200">
            <h3 className="text-xs lg:text-sm font-bold text-gray-700 uppercase mb-6">Admin Access Control</h3>
            <div className="overflow-x-auto border rounded bg-gray-50 w-full scrollbar-thin">
               <table className="w-full min-w-[750px] text-left text-sm border-collapse">
                 <thead className="bg-gray-100 text-xs font-bold uppercase text-gray-700">
                    <tr><th className="px-4 py-3">Identity</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3 text-right">Action</th></tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {users.map((user) => (
                     <tr key={user.id} className="hover:bg-gray-50">
                       <td className="px-4 py-3 font-medium text-gray-900">{user.first_name} {user.last_name}</td>
                       <td className="px-4 py-3">{user.email}</td>
                       <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.role === 'superadmin' ? 'bg-amber-100 text-amber-700' : user.role === 'admin' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}>{user.role}</span>
                       </td>
                       <td className="px-4 py-3 text-right">
                         {user.role !== 'superadmin' && (
                           <button onClick={() => handleRoleChange(user.id, user.role)} className={`px-3 py-1 rounded text-[10px] uppercase font-bold transition ${user.role === 'admin' ? 'border border-red-500 text-red-500 hover:bg-red-50' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                             {user.role === 'admin' ? 'Revoke Access' : 'Grant Admin'}
                           </button>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </div>

      {/* 🌟 COMPREHENSIVE PRODUCT FORM MODIFICATION MODAL OVERLAY */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateProductDetails} className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-serif uppercase tracking-widest mb-6 border-b pb-2 text-amber-600">Modify Piece Information</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">Product Title</label>
                <input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">Price Value ($)</label>
                  <input type="number" step="0.01" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">Available Units</label>
                  <input type="number" required value={editingProduct.stock_quantity} onChange={e => setEditingProduct({...editingProduct, stock_quantity: e.target.value})} className="w-full px-3 py-2 border rounded text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">Collection Category</label>
                  <select required value={editingProduct.category_id} onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white outline-none">
                    <option value="4">Rings</option>
                    <option value="2">Necklaces</option>
                    <option value="1">Watches</option>
                    <option value="3">Earrings</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">Material Classification</label>
                  <select required value={editingProduct.color} onChange={e => setEditingProduct({...editingProduct, color: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white outline-none">
                    <option value="None">Material: None</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 block mb-1">Artisanal Details & Specifications</label>
                <textarea required value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full px-3 py-2 border rounded text-sm h-24 outline-none resize-none"></textarea>
              </div>
            </div>

            <div className="flex space-x-4">
              <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 border rounded text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-3 bg-black text-white rounded text-[10px] font-bold uppercase tracking-wider hover:bg-amber-600 transition shadow-md">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL OVERLAY */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl text-center border border-gray-100">
            <h2 className="text-lg font-serif uppercase tracking-widest mb-3 text-red-600">Delete product permanently?</h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Are you sure you want to completely erase <span className="font-bold text-gray-900">"{deletingProduct.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button onClick={() => setDeletingProduct(null)} className="flex-1 py-3 border border-gray-200 rounded text-[10px] uppercase font-bold tracking-wider text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleDeleteProduct} className="flex-1 py-3 bg-red-600 text-white rounded text-[10px] uppercase font-bold tracking-wider shadow-md hover:bg-red-700 transition">
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}