import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                return;
            }

            try {
                // 🌟 Dynamically read your backend URL with a fallback to your live production Render API
                const API_BASE = import.meta.env.VITE_API_BASE_URL;
                
                // Clean trailing slashes to prevent double-slashing urls
                const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
                
                // Build the request path safely depending on whether your base url environment key includes '/api'
                const finalUrl = cleanBase.includes('/api') 
                    ? `${cleanBase}/auth/verify-email?token=${token}` 
                    : `${cleanBase}/api/auth/verify-email?token=${token}`;

                const response = await axios.get(finalUrl);
                setStatus('success');
                
                // Optional: Auto-redirect to login after 4 seconds
                setTimeout(() => navigate('/login'), 4000);
            } catch (err) {
                console.error("Verification failed layout context:", err);
                setStatus('error');
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#1a1a1a', // Charcoal
            color: '#ffffff',
            textAlign: 'center',
            fontFamily: 'serif'
        }}>
            <h1 style={{ color: '#d4af37', letterSpacing: '4px', textTransform: 'uppercase' }}>Aurum & Co.</h1>
            
            <div style={{ marginTop: '20px', padding: '40px', border: '1px solid #d4af37', borderRadius: '4px' }}>
                {status === 'verifying' && (
                    <p>Polishing your keys... Verifying your account.</p>
                )}

                {status === 'success' && (
                    <>
                        <h2 style={{ color: '#d4af37' }}>Account Activated</h2>
                        <p>Welcome to the inner circle. Redirecting you to login...</p>
                        <Link to="/login" style={{ color: '#d4af37', textDecoration: 'underline' }}>Click here if you aren't redirected</Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h2 style={{ color: '#ff4d4d' }}>Invalid Link</h2>
                        <p>This verification link has expired or is invalid.</p>
                        <Link to="/register" style={{ color: '#d4af37' }}>Try Registering Again</Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;