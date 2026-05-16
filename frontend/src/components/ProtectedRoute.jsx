import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole'); // ✨ Read the user's real role

  // 1. If they aren't logged in at all, send them to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. If they are a regular user trying to snoop, kick them back to the Home page
  if (role !== 'admin' && role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  // 3. If they are an admin/superadmin, let them in
  return children;
}