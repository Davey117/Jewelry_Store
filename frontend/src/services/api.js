import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// 1. Create a centralized Axios instance configured to handle cookies globally
const apiClient = axios.create({
  withCredentials: true,
});

// 2. Request Interceptor: Automatically injects the Authorization header to all protected endpoints
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Catches 401 errors to run silent background token rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Trigger token exchange if the response is unauthorized and hasn't been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Ping the refresh route using the browser's HTTP-Only cookie storage context
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = response.data;

        // Cache the new short-lived authorization token
        localStorage.setItem('token', access_token);

        // Update the authorization reference header for the initially stalled process
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Re-execute the request transparently
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If the refresh token itself is expired, force clear sessions and boot to login
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('firstName');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// --- CATALOG SERVICES ---

export const fetchProducts = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/products`);
    return response.data;
  } catch (error) {
    console.error("API Error fetching products:", error);
    throw error;
  }
};

export const fetchCategories = async () => {
  const response = await apiClient.get(`${API_URL}/products/categories`);
  return response.data;
};

export const fetchProduct = async (id) => {
  try {
    const response = await apiClient.get(`${API_URL}/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`API Error fetching product ${id}:`, error);
    throw error;
  }
};

export const fetchPublicProducts = async () => {
  const response = await apiClient.get(`${API_URL}/products`);
  return response.data;
};

// --- AUTH SERVICES ---

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    throw error; 
  }
};

export const loginUser = async (email, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginWithGoogle = async (googleToken) => {
  try {
    const response = await axios.post(`${API_URL}/auth/google`, { token: googleToken }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUsers = async () => {
  const response = await apiClient.get(`${API_URL}/auth/users`);
  return response.data;
};

export const updateUserRole = async (userId, newRole) => {
  const response = await apiClient.put(`${API_URL}/auth/users/${userId}/role`, { role: newRole });
  return response.data;
};

// --- ADMIN & MANAGEMENT SERVICES ---

export const fetchAdminProducts = async () => {
  const response = await apiClient.get(`${API_URL}/products/admin`);
  return response.data;
};

export const createProduct = async (formData) => {
  const response = await apiClient.post(`${API_URL}/products/`, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const updateProduct = async (productId, updateData) => {
  const response = await apiClient.patch(`${API_URL}/products/${productId}`, updateData);
  return response.data;
};

// --- ORDER SERVICES ---

export const createOrder = async (orderData) => {
  const response = await apiClient.post(`${API_URL}/orders/`, orderData);
  return response.data;
};

export const fetchAdminOrders = async () => {
  const response = await apiClient.get(`${API_URL}/orders/admin`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await apiClient.patch(`${API_URL}/orders/${orderId}/status`, { status });
  return response.data;
};