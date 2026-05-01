import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';

export default function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); // Used to redirect the user after success

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing when you submit
    setError(null);
    setLoading(true);

    try {
      if (isLoginView) {
        // 1. Attempt to Login
        const data = await loginUser(email, password);
        
        // 2. Save the secure token to the browser!
        localStorage.setItem('token', data.access_token);
        
        alert("Login successful!");
        navigate('/'); // Send them back to the Home page
        
      } else {
        // 1. Attempt to Register
        await registerUser(email, password);
        
        // 2. If successful, automatically switch them to the login view
        alert("Registration successful! Please log in.");
        setIsLoginView(true);
        setPassword(''); // Clear password field for safety
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md">
        
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
          {isLoginView ? 'Welcome Back' : 'Create an Account'}
        </h1>

        {/* Error Message Display */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400"
          >
            {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* Toggle Button */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {isLoginView ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLoginView(!isLoginView)}
            className="text-indigo-600 font-bold hover:underline"
          >
            {isLoginView ? 'Sign up here' : 'Log in here'}
          </button>
        </div>

      </div>
    </div>
  );
}