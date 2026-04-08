import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import './Footer.css';
import footerLogoImage from '../../assets/images/Logo(dark mood).png';

function Footer() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  return (
    <footer className="footer" dir="rtl" lang="ar">
      <div className="footer__container">
        <div className="footer__content">
          
          {/* العمود الأول: هوية البراند */}
          <div className="footer__section footer__brand">
            <div className="footer__brand-header">
              <img src={footerLogoImage} alt="" className="footer__brand-icon" style={{ objectFit: 'cover' }} aria-hidden />
              <h2 className="footer__brand-name">حارس ذكي</h2>
            </div>
            <p className="footer__brand-description">
              نظام أمني متقدم مدعوم بالذكاء الاصطناعي لحماية البيئات الجامعية.
            </p>
          </div>

          {/* العمود الثاني: روابط المنتج */}
          <div className="footer__section">
            <h3 className="footer__section-title">المنتج</h3>
            <nav className="footer__nav">
              <Link to="/" className="footer__link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>الرئيسية</Link>
              {currentUser && currentUser.role !== 'موظف أمن' && currentUser.role !== 'security_man' && (
                <>
                  <Link to="/dashboard" className="footer__link">لوحة التحكم</Link>
                  {currentUser.role?.toLowerCase() === 'admin' && (
                    <>
                      <Link to="/organization-staff" className="footer__link">موظفو الامن</Link>
                      {currentUser.organization?.toLowerCase().includes('smart') && (
                        <Link to="/admin-dashboard" className="footer__link">لوحه تحكم المسؤول</Link>
                      )}
                    </>
                  )}
                </>
              )}
              <Link to="/monitoring" className="footer__link">نظام المراقبة</Link>
              <Link to="/contact" className="footer__link">تواصل معنا</Link>
            </nav>
          </div>

          {/* العمود الثالث: تواصل معنا (أقصى اليسار) */}
          <div className="footer__section footer__section--social">
            <h3 className="footer__section-title">تواصل معنا</h3>
            <div className="footer__social-list">
              <a href="https://www.linkedin.com/in/smartguard" target="_blank" rel="noopener noreferrer" className="footer__social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a2.7 2.7 0 0 0-2.7-2.7c-1.2 0-2 .7-2.3 1.3V10.2h-2.8v8.3h2.8v-4.6c0-.6.5-1.1 1.1-1.1.7 0 1.2.5 1.2 1.1v4.6h2.7M7.3 18.5V10.2H4.6v8.3h2.7m.1-10.4c0-.8-.6-1.4-1.4-1.4-.8 0-1.4.6-1.4 1.4 0 .8.6 1.4 1.4 1.4.8 0 1.4-.6 1.4-1.4z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
              <a href="https://www.instagram.com/smartguard.ai/" target="_blank" rel="noopener noreferrer" className="footer__social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8c0 2 1.6 3.6 3.6 3.6h8.8c2 0 3.6-1.6 3.6-3.6V7.6c0-2-1.6-3.6-3.6-3.6H7.6m9.6 2.1a1.2 1.2 0 0 1 1.2 1.2 1.2 1.2 0 0 1-1.2 1.2 1.2 1.2 0 0 1-1.2-1.2 1.2 1.2 0 0 1 1.2-1.2M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
                </svg>
                <span>Instagram</span>
              </a>
            </div>
          </div>

        </div>

        <div className="footer__copyright">
          <hr className="footer__divider" />
          <p className="footer__copyright-text">
            2026 حارس ذكي - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;