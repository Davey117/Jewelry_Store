import { Navigate } from 'react-router-dom';

export default function StoreRoute({ children }) {
  const role = localStorage.getItem('userRole');

  // If an admin or superadmin tries to view a regular store page, bounce them back
  if (role === 'admin' || role === 'superadmin') {
    return <Navigate to="/admin" replace />;
  }

  // If it's a regular user or a guest (not logged in), let them browse the store
  return children;
}