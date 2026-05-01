import { useState, useEffect } from 'react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'users'
  const [users, setUsers] = useState([]);
  
  // Product Form State
  const [formData, setFormData] = useState({ name: '', price: '', description: '' });

  // Fetch users when the tab changes to 'users'
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://jewelry-api-8kpg.onrender.com/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users");
    }
  };

  const handlePromote = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      // Assuming your backend has an endpoint to update a user's role
      const response = await fetch(`https://jewelry-api-8kpg.onrender.com/api/users/${userId}/promote`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert("User promoted to Admin!");
        fetchUsers(); // Refresh the list
      } else {
        alert("Failed to promote user. Are you sure you are a Super Admin?");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const response = await fetch('https://jewelry-api-8kpg.onrender.com/api/catalog/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (response.ok) alert("Product added to the vault!");
    else alert("Access Denied: You are not an admin.");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b pb-2">
        <button 
          onClick={() => setActiveTab('products')}
          className={`font-medium ${activeTab === 'products' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          Add Jewelry
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`font-medium ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          Manage Users
        </button>
      </div>

      {/* Tab Content: Add Products */}
      {activeTab === 'products' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-md">
          <h2 className="text-xl font-bold mb-4">Add New Item</h2>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <input placeholder="Product Name" className="w-full p-2 border rounded" onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <input placeholder="Price" type="number" className="w-full p-2 border rounded" onChange={(e) => setFormData({...formData, price: e.target.value})} />
            <textarea placeholder="Description" className="w-full p-2 border rounded" onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium transition">Add to Vault</button>
          </form>
        </div>
      )}

      {/* Tab Content: Manage Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t">
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.is_admin ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="p-4">
                    {!user.is_admin && (
                      <button 
                        onClick={() => handlePromote(user.id)}
                        className="text-indigo-600 font-medium hover:underline"
                      >
                        Make Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="3" className="p-4 text-center text-gray-500">Loading users...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}