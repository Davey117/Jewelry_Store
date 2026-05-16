import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { loginUser, registerUser } from '../services/api';

export default function Login() {
  const [view, setView] = useState('login'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (token && role) {
      if (role === 'admin' || role === 'superadmin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
        token: credentialResponse.credential
      });
      
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('userRole', res.data.role); 
      
      // ✨ FIX: Properly save all details with fallbacks for Google Login
      if(res.data.first_name) {
        localStorage.setItem('firstName', res.data.first_name || '');
        localStorage.setItem('lastName', res.data.last_name || '');
        localStorage.setItem('email', res.data.email || '');
      }

      if (res.data.role === 'admin' || res.data.role === 'superadmin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true }); 
      }
    } catch (err) {
      setError("Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const cleanEmail = email.toLowerCase();

    if (view === 'register' && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (view === 'login') {
        const data = await loginUser(cleanEmail, password);
        
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userRole', data.role); 
        
        // ✨ FIX: Properly save all details with fallbacks for Standard Login
        if(data.first_name) {
          localStorage.setItem('firstName', data.first_name || '');
          localStorage.setItem('lastName', data.last_name || ''); 
          localStorage.setItem('email', data.email || cleanEmail);
        }

        if (data.role === 'admin' || data.role === 'superadmin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }

      } else if (view === 'register') {
        const userData = {
          email: cleanEmail,
          password: password,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          address: address
        };
        await registerUser(userData);
        setMessage("Account created! Please check your email to verify your account.");
        setView('login');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setAddress('');
      } else if (view === 'forgot') {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, { email: cleanEmail });
        setMessage("If an account exists, a reset link has been sent to your email.");
        setView('login');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Account not verified. Please check your email for the activation link.");
      } else {
        setError(err.response?.data?.detail || "An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gray-50 py-10">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-gray-900 tracking-widest uppercase">Aurum & Co.</h1>
          <p className="text-gray-500 text-xs mt-2 tracking-widest uppercase">
            {view === 'login' && 'Sign in to your collection'}
            {view === 'register' && 'Join the Inner Circle'}
            {view === 'forgot' && 'Reset your password'}
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-xs font-bold text-center border border-red-100">{error}</div>}
        {message && <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-xs font-bold text-center border border-green-100">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {view === 'register' && (
            <>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-tighter">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-amber-500 outline-none transition"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-tighter">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-amber-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-tighter">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-amber-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-tighter">Shipping Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-amber-500 outline-none transition"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-tighter">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-amber-500 outline-none transition"
            />
          </div>

          {view !== 'forgot' && (
            <>
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-tighter">Password</label>
                  {view === 'login' && (
                    <button type="button" onClick={() => setView('forgot')} className="text-[10px] text-amber-600 font-bold hover:underline uppercase tracking-wide">
                      Forgot?
                    </button>
                  )}
                </div>
                
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-amber-500 outline-none transition pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {view === 'register' && (
                <div className="relative mt-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-tighter">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-amber-500 outline-none transition pr-10"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-3 rounded hover:bg-gray-800 transition disabled:bg-gray-400 mt-2 uppercase text-xs tracking-widest">
            {loading ? 'Processing...' : (view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Send Reset Link')}
          </button>
        </form>

        {view !== 'forgot' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-gray-400 tracking-widest">Or continue with</span></div>
            </div>
            <div className="flex justify-center mb-6"><GoogleLogin onSuccess={handleGoogleSuccess} theme="outline" shape="rectangular" /></div>
          </>
        )}

        <div className="mt-4 text-center text-xs text-gray-500 tracking-wide">
          {view === 'login' ? (
            <>New to Aurum & Co.? <button onClick={() => {setView('register'); setError(null);}} className="text-amber-600 font-bold hover:underline">Create an Account</button></>
          ) : (
            <>Already registered? <button onClick={() => {setView('login'); setError(null);}} className="text-amber-600 font-bold hover:underline">Login Here</button></>
          )}
        </div>

      </div>
    </div>
  );
}