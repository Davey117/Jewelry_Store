import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function useInactivityTimeout(logoutMinutes = 30, warningMinutes = 25) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  
  const warningTimeoutId = useRef(null);
  const logoutTimeoutId = useRef(null);

  const performLogout = () => {
    const token = localStorage.getItem('token');
    if (token) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('firstName');
      localStorage.removeItem('lastName');
      localStorage.removeItem('email');
      
      setShowWarning(false);
      navigate('/login');
    }
  };

  const resetTimers = () => {
    // Clear any existing timers
    if (warningTimeoutId.current) clearTimeout(warningTimeoutId.current);
    if (logoutTimeoutId.current) clearTimeout(logoutTimeoutId.current);
    
    setShowWarning(false);

    // Set the Warning Timer (e.g., 25 minutes)
    warningTimeoutId.current = setTimeout(() => {
      const token = localStorage.getItem('token');
      if (token) setShowWarning(true); 
    }, warningMinutes * 60 * 1000);

    // Set the Final Logout Timer (e.g., 30 minutes)
    logoutTimeoutId.current = setTimeout(performLogout, logoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    // Only reset the timer from mouse movement if the warning ISN'T showing.
    // If the warning is showing, they must explicitly click the button to continue.
    const handleActivity = () => {
      if (!showWarning) resetTimers();
    };

    resetTimers();

    events.forEach(e => window.addEventListener(e, handleActivity));

    return () => {
      if (warningTimeoutId.current) clearTimeout(warningTimeoutId.current);
      if (logoutTimeoutId.current) clearTimeout(logoutTimeoutId.current);
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [location.pathname, showWarning]);

  return { showWarning, extendSession: resetTimers, forceLogout: performLogout };
}