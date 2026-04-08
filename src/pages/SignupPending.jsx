import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Dashboard.css';
import Navbar from '../components/Navbar/Navbar';

/**
 * SignupPending Component
 * 
 * Simple confirmation page after signup showing pending approval status.
 * Matches the system's design with dashboard hero section.
 */
function SignupPending() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from location state or localStorage
    if (location.state?.userData) {
      setUserData(location.state.userData);
    } else {
      // Try to get from localStorage
      const storedData = localStorage.getItem('pendingSignup');
      if (storedData) {
        setUserData(JSON.parse(storedData));
        localStorage.removeItem('pendingSignup'); // Clean up
      }
    }

    // Countdown timer for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, location.state]);


  return (
    <div className="dashboard-page">
      <Navbar />

      {/* --- Hero Section --- */}
      <section className="dashboard-hero">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '3px solid #22c55e'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="dashboard-hero__title">تم إرسال طلب التسجيل</h1>
          <p className="dashboard-hero__subtitle">شكراً لتسجيلك في نظام حارس ذكي</p>
        </div>
      </section>
      
      <div className="dashboard-content">
        {/* Success Message */}
        <div className="events-section">
          <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.05)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '0.75rem',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ 
              color: '#22c55e', 
              fontSize: '1.3rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem' 
            }}>
              ✅ تم استلام طلبك بنجاح
            </h2>
            <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              طلبك قيد المراجعة حالياً من قبل المسؤول...
            </p>

            {userData && (
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                marginTop: '1.5rem',
                textAlign: 'right'
              }}>
                <h3 style={{ fontSize: '1rem', color: '#374151', marginBottom: '1rem' }}>
                  📋 تفاصيل طلبك:
                </h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                    <strong>الاسم:</strong> {userData.name || userData.full_name || 'غير محدد'}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                    <strong>البريد الإلكتروني:</strong> {userData.email}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                    <strong>المنظمة:</strong> {userData.organization || 'غير محدد'}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                    <strong>الدور المطلوب:</strong> {userData.role === 'admin' ? 'مسؤول' : 'موظف أمن'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Important Notice */}
          <div className="quick-btn" style={{ 
            flexDirection: 'column', 
            padding: '1.5rem', 
            width: '100%',
            cursor: 'default',
            backgroundColor: 'rgba(251, 191, 36, 0.05)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⏳</span>
              <h3 style={{ 
                color: '#d97706', 
                fontSize: '1.1rem', 
                fontWeight: '600',
                margin: 0
              }}>
                ملاحظات هامة
              </h3>
            </div>
            <ul style={{ 
              color: '#92400e', 
              fontSize: '0.9rem', 
              lineHeight: '1.6',
              paddingRight: '1.5rem',
              margin: 0
            }}>
              <li>عملية المراجعة تستغرق عادة من 24-48 ساعة</li>
             
              <li>يمكنك محاولة تسجيل الدخول بعد الحصول على موافقة المسؤول</li>
            </ul>
          </div>

          {/* Auto-redirect notice */}
          <div className="quick-btn" style={{ 
            flexDirection: 'column', 
            padding: '1.5rem', 
            cursor: 'default',
            textAlign: 'center',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1rem',
              marginBottom: '0.5rem'
            }}>
              سيتم توجيهك تلقائياً إلى صفحة تسجيل الدخول خلال
            </p>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#374151',
              width: '100%',
              textAlign: 'center'
            }}>
              {countdown}
            </div>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '1rem 0 0 0' }}>
              ثانية
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <Link
              to="/login"
              className="save-btn save-btn--primary"
              style={{ 
                textDecoration: 'none', 
                padding: '0.75rem 2rem',
                background: 'var(--accent-gradient)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              الذهاب إلى تسجيل الدخول
            </Link>
            
            <Link
              to="/"
              className="save-btn save-btn--primary"
              style={{ 
                textDecoration: 'none', 
                padding: '0.75rem 2rem',
                background: 'var(--accent-gradient)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPending;
