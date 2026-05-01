import { useState, useEffect } from 'react';
import { fetchProducts } from '../services/api';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to load the data
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        setError("Could not load products. Please try again later.");
      } finally {
        setLoading(false); // Stop the loading spinner whether it succeeded or failed
      }
    };

    loadProducts();
  }, []);

  // What to show while waiting for the database
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl font-medium text-gray-500 animate-pulse">Loading the vault...</p>
      </div>
    );
  }

  // What to show if the API connection fails
  if (error) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Our Collection</h1>
      
      {/* Product Grid */}
      {products.length === 0 ? (
        <p className="text-gray-500">No jewelry in the database yet!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              
              {/* Image Placeholder */}
              <div className="h-48 bg-gray-50 rounded-xl mb-4 flex items-center justify-center text-gray-400">
                <span>[ Image ]</span>
              </div>
              
              {/* Product Details */}
              <h2 className="text-lg font-bold text-gray-800 truncate">{product.name}</h2>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
              
              {/* Price & Button */}
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xl font-extrabold text-indigo-600">${product.price}</span>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                  Add
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}