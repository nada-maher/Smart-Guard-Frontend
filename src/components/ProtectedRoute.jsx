/**
 * Protected Route Component
 * Protects routes from unauthorized access
 */

import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

function ProtectedRoute({ element }) {
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await authService.isAuthenticated();
      const currentUser = await authService.getCurrentUser();
      setIsAuth(auth);
      setUser(currentUser);
    };
    checkAuth();
  }, []);

  if (isAuth === null) {
    return <div className="loading-spinner">جاري التحقق...</div>;
  }
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Role-based protection
  console.log('Checking access for:', location.pathname, 'User role:', user?.role, 'Role type:', typeof user?.role);
  
  if (location.pathname === '/organization-staff' && user?.role !== 'admin') {
    console.warn('Access denied to Organization Staff page for role:', user?.role);
    return <Navigate to="/monitoring" replace />;
  }
  
  if (location.pathname === '/admin-dashboard' && user?.email !== 'admin@smartguard.com') {
    return <Navigate to="/monitoring" replace />;
  }
  
  // Restrict dashboard to admin and manager roles only
  if (location.pathname === '/dashboard') {
    console.log('Dashboard access check - Role:', user?.role);
    console.log('Role comparison tests:');
    console.log('user?.role === "security_man":', user?.role === 'security_man');
    console.log('user?.role === "موظف أمن":', user?.role === 'موظف أمن');
    console.log('user?.role?.toLowerCase() === "security_man":', user?.role?.toLowerCase() === 'security_man');
    console.log('user?.role?.toLowerCase() === "موظف أمن":', user?.role?.toLowerCase() === 'موظف أمن');
    
    if (user?.role === 'security_man' || user?.role === 'موظف أمن' || user?.role?.toLowerCase() === 'security_man' || user?.role?.toLowerCase() === 'موظف أمن') {
      console.warn('Access denied to Dashboard page for role:', user?.role);
      return <Navigate to="/monitoring" replace />;
    }
  }
  
  console.log('Access granted to:', location.pathname, 'for role:', user?.role);
  
  return element;
}

export default ProtectedRoute;
