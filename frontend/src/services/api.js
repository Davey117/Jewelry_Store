// src/services/api.js

const BASE_URL = 'https://jewelry-api-8kpg.onrender.com/api';

export const fetchProducts = async () => {
  try {
    // Assuming your endpoint is /api/products
    const response = await fetch(`${BASE_URL}/catalog/products`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// src/services/api.js

export const registerUser = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    // FastAPI's default OAuth2 expects Form Data, using 'username' (which is our email)
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    // *IMPORTANT: Change '/auth/login' to '/auth/token' if that is what your backend uses!
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Invalid email or password');
    }
    return await response.json(); // This returns your JWT!
  } catch (error) {
    throw error;
  }
};