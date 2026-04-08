import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Hero/Hero.css';
import { authService } from '../../services/authService';
import logoImage from '../../assets/images/LogoU.png';
import logoLight from '../../assets/images/Logo.png';
import logoDark from '../../assets/images/Logo(dark mood).png';

function Navbar({ 
  currentPage = '', 
  onLogout 
}) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentOrg, setCurrentOrg] = useState(null);
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('supabase_token');
  
  // Detect current theme
  const [currentTheme, setCurrentTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  useEffect(() => {
    const handleThemeChange = () => {
      setCurrentTheme(document.documentElement.getAttribute('data-theme') || 'light');
    };
    
    // Initial theme detection
    handleThemeChange();
    
    // Listen for theme changes
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      if (user && user.organization) {
        setCurrentOrg(user.organization);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Simple logout - just handle authentication
      if (onLogout) {
        onLogout();
      } else {
        authService.signout();
        navigate('/login');
      }
      
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout process failed:', error);
      // Emergency fallback
      try {
        if (onLogout) {
          onLogout();
        } else {
          authService.signout();
          navigate('/login');
        }
      } catch (fallbackError) {
        console.error('❌ Emergency fallback failed:', fallbackError);
        window.location.href = '/login';
      }
    }
  };

  const getLinkClassName = (page) => {
    const baseClass = "hero-header__link";
    return currentPage === page ? `${baseClass} active` : baseClass;
  };

  return (
    <header className="hero-header">
      <div className="hero-header__brand">
        <img 
          src={currentTheme === 'dark' ? logoDark : logoLight} 
          alt="" 
          className="hero-header__logo-icon" 
          style={{ objectFit: 'cover' }} 
          aria-hidden 
        />
        <span className="hero-header__brand-name">حارس ذكي</span>
      </div>
      <nav className="hero-header__nav" aria-label="الرئيسية">
        <Link to="/" className={getLinkClassName('home')}>الرئيسية</Link>
        {currentUser && currentUser.role !== 'موظف أمن' && currentUser.role !== 'security_man' && (
          <Link to="/dashboard" className={getLinkClassName('dashboard')}>لوحة التحكم</Link>
        )}
        {currentUser && currentUser.role?.toLowerCase() === 'admin' && (
          <Link to="/organization-staff" className={getLinkClassName('organization-staff')}>موظفو الأمن</Link>
        )}
        {currentUser && (currentUser.organization === 'Smart Guard' || currentUser.organization === 'SmartGuard' || currentUser.organization?.toLowerCase().includes('smart')) && (
          <Link 
            to="/admin-dashboard" 
            className={getLinkClassName('admin-dashboard')}
            style={currentPage === 'admin-dashboard' ? {color: '#8b5cf6'} : {}}
          >
            لوحة تحكم المسؤول
          </Link>
        )}
        <Link to="/monitoring" className={getLinkClassName('monitoring')}>نظام المراقبة</Link>
        <Link to="/contact" className={getLinkClassName('contact')}>تواصل معنا</Link>
      </nav>
      <div className="hero-header__actions">
        {isLoggedIn && (
          <div className="hero-header__profile">
            <div className="profile-dropdown">
              <button 
                className="profile-circle"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                onBlur={() => setTimeout(() => setProfileDropdownOpen(false), 200)}
              >
                <div className="avatar-circle">
                  {(currentUser?.full_name || 'مستخدم').charAt(0).toUpperCase()}
                </div>
              </button>
              {profileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-name">{currentUser?.full_name || 'مستخدم'}</div>
                    <div className="profile-dropdown-role">
                      {currentUser?.role === 'admin' ? 'مسؤول' : 'موظف أمن'}
                    </div>
                    <div className="profile-dropdown-org">
                      🏢 {currentOrg || 'غير محدد'}
                    </div>
                  </div>
                  <div className="profile-dropdown-email">
                    {currentUser?.email || 'user@example.com'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {isLoggedIn ? (
          <button 
            onClick={handleLogout} 
            className="hero-header__login"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            تسجيل الخروج
          </button>
        ) : (
          <Link to="/login" className="hero-header__login">تسجيل الدخول</Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
