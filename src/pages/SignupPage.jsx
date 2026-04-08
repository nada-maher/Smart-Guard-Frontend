import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';
import cameraImage from '../assets/images/camera3.jpeg';
import { authService } from '../services/authService';

/**
 * SignupPage Component
 * 
 * Professional signup interface with form validation and role selection.
 * Users can choose between admin and security person roles.
 * 
 * @component
 */
function SignupPage() {
  const navigate = useNavigate();
  
  // Form state management
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'security_man', // 'admin' or 'security_man'
    organization: '',
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '',
    requirements: {
      length: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSpecial: false
    }
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Validates password strength and updates state
   * @param {string} password - Password to validate
   */
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({
        score: 0, label: '', color: '',
        requirements: { length: false, hasUpper: false, hasLower: false, hasNumber: false, hasSpecial: false }
      });
      return;
    }

    const reqs = {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password)
    };

    let score = 0;
    if (reqs.length) score++;
    if (reqs.hasUpper) score++;
    if (reqs.hasLower) score++;
    if (reqs.hasNumber) score++;
    if (reqs.hasSpecial) score++;

    let label = '';
    let color = '';

    switch (score) {
      case 0:
      case 1:
        label = 'ضعيفة جداً';
        color = '#ef4444'; // Red
        break;
      case 2:
        label = 'ضعيفة';
        color = '#f97316'; // Orange
        break;
      case 3:
        label = 'متوسطة';
        color = '#eab308'; // Yellow
        break;
      case 4:
        label = 'قوية';
        color = '#22c55e'; // Green
        break;
      case 5:
        label = 'قوية جداً';
        color = '#10b981'; // Emerald
        break;
      default:
        break;
    }

    setPasswordStrength({ score, label, color, requirements: reqs });
  };

  /**
   * Validates form inputs
   * @returns {boolean} Whether the form is valid
   */
  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name) {
      newErrors.name = 'الاسم مطلوب';
    } else if (formData.name.length < 3) {
      newErrors.name = 'الاسم يجب أن يكون 3 أحرف على الأقل';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'يرجى استخدام كلمة مرور أقوى (متوسطة على الأقل)';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }
    
    // Organization validation
    if (!formData.organization) {
      newErrors.organization = 'اسم المنظمة مطلوب';
    } else if (formData.organization.length < 2) {
      newErrors.organization = 'اسم المنظمة قصير جداً';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Call signup service
      console.log('Calling signup service with:', formData);
      const result = await authService.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organization: formData.organization
      });
      
      console.log('Signup service returned:', result);
      console.log('Result.user:', result.user);
      console.log('Result.status:', result.status);
      console.log('Result.request_id:', result.request_id);
      
      // Redirect to dashboard or show success message
      if (result.status === 'pending' || result.request_id) {
        console.log('Redirecting to pending page...');
        // Store user data for the pending page
        localStorage.setItem('pendingSignup', JSON.stringify(formData));
        navigate('/signup-pending', { state: { userData: formData } });
      } else if (result.user) {
        console.log('Redirecting to dashboard...');
        navigate('/Dashboard');  // Changed from '/dashboard' to '/Dashboard' for "نظام المراقبة"
      } else {
        console.log('Unknown result state, setting success flag');
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Signup failed:', error);
      
      // Parse backend error message to provide helpful feedback
      let errorMsg = error.message || 'حدث خطأ أثناء التسجيل';
      
      if (errorMsg.includes('مسجل بالفعل') || errorMsg.includes('سوبابيس') || errorMsg.includes('محلياً')) {
        if (errorMsg.includes('معلق')) {
          errorMsg = '⏳ طلبك قيد الانتظار. يرجى الانتظار حتى يوافق المسؤول على حسابك';
        } else {
          errorMsg = '⚠️ هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول إذا كان لديك حساب';
        }
      } else if (errorMsg.includes('خطأ')) {
        errorMsg = '❌ حدث خطأ في التسجيل. يرجى المحاولة مرة أخرى';
      }
      
      setErrors({ form: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates form field value and clears associated error
   * @param {string} field - Field name
   * @param {string} value - New value
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check password strength if field is password
    if (field === 'password') {
      checkPasswordStrength(value);
    }

    // Clear field error on input
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Toggles password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  /**
   * Toggles confirm password visibility
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  return (
    <div className="login-page" dir="rtl" lang="ar">
      {/* Navigation - Back to home */}
      <Link 
        to="/" 
        className="back-to-home"
        aria-label="العودة للرئيسية"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </Link>
      
      <div className="login-container">
        {/* Branding Section */}
        <section className="branding-section" aria-label="معلومات النظام">
          {/* Security icon */}
          <div className="security-badge" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm3 8H9V7a3 3 0 0 1 6 0v3z"/>
            </svg>
          </div>
          
          <div className="branding-content">
            {/* Product illustration */}
            <div className="product-visual">
              <img 
                src={cameraImage}
                alt="نظام حارس ذكي - كاميرات المراقبة الذكية" 
                loading="eager"
                width="260"
                height="260"
              />
            </div>
            
            {/* Brand identity */}
            <h1 className="brand-name">حارس ذكي</h1>
            <p className="brand-tagline">نظام أمني ذكي ومتقدم</p>
            
            {/* Feature highlights */}
            <div className="feature-badges" role="list" aria-label="مميزات النظام">
              <span className="feature-badge" role="listitem">
                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>آمن</span>
              </span>
              <span className="feature-badge" role="listitem">
                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2"/>
                  <circle cx="12" cy="5" r="2"/>
                  <path d="M12 7v4"/>
                  <line x1="8" y1="16" x2="8" y2="16"/>
                  <line x1="16" y1="16" x2="16" y2="16"/>
                </svg>
                <span> ذكي</span>
              </span>
              <span className="feature-badge" role="listitem">
                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>مراقبة 24/7</span>
              </span>
            </div>
          </div>
        </section>

        {/* Signup Form Section */}
        <section className="form-section" aria-labelledby="signup-title">
          {isSuccess ? (
            <div className="success-container" style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="success-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>تم استلام طلبك!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                طلبك قيد المراجعة حالياً من قبل المسؤول. <br />
                يرجى الانتظار حتى تتم الموافقة على حسابك، ستتمكن من تسجيل الدخول فور تفعيل الحساب.
              </p>
              <Link to="/signup-pending" className="submit-button" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
                عرض صفحة الانتظار
              </Link>
              <br />
              <Link to="/login" className="switch-auth-link" style={{ textDecoration: 'none' }}>
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <header className="form-header">
                <h2 id="signup-title" className="form-title">انشئ حساب جديد</h2>
                <p className="form-description">انضم إلى نظام الأمن الذكي الآن</p>
              </header>

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                {/* Full Name Field */}
                <div className="form-field">
                  <label htmlFor="name" className="field-label">الاسم الكامل</label>
                  <div className={`field-input-wrapper ${errors.name ? 'has-error' : ''}`}>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="field-input"
                      placeholder="أحمد سعد محمد"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      dir="rtl"
                      autoComplete="name"
                      aria-required="true"
                    />
                    <span className="field-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                  </div>
                  {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
                </div>

                {/* Email Field */}
                <div className="form-field">
                  <label htmlFor="email" className="field-label">البريد الإلكتروني</label>
                  <div className={`field-input-wrapper ${errors.email ? 'has-error' : ''}`}>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="field-input"
                      placeholder="admin@smartguard.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      dir="ltr"
                      autoComplete="email"
                      aria-required="true"
                    />
                    <span className="field-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    </span>
                  </div>
                  {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
                </div>

                {/* Organization Field */}
                <div className="form-field">
                  <label htmlFor="organization" className="field-label">اسم المنظمة</label>
                  <div className={`field-input-wrapper ${errors.organization ? 'has-error' : ''}`}>
                    <input
                      id="organization"
                      name="organization"
                      type="text"
                      className="field-input"
                      placeholder="مثال: جامعة القاهرة"
                      value={formData.organization}
                      onChange={(e) => handleInputChange('organization', e.target.value)}
                      dir="rtl"
                      autoComplete="organization"
                      aria-required="true"
                    />
                    <span className="field-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </span>
                  </div>
                  {errors.organization && <p className="field-error" role="alert">{errors.organization}</p>}
                </div>

                {/* Role Selection Field */}
                <div className="form-field">
                  <label htmlFor="role" className="field-label">صلاحيتك في النظام</label>
                  <div className={`field-input-wrapper ${errors.role ? 'has-error' : ''}`}>
                    <select
                      id="role"
                      name="role"
                      className="field-input"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      dir="rtl"
                      aria-required="true"
                    >
                      <option value="security_man">موظف أمن عادي</option>
                      <option value="admin">مسؤول</option>
                    </select>
                    <span className="field-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                    </span>
                  </div>
                  {errors.role && <p className="field-error" role="alert">{errors.role}</p>}
                </div>

                {/* Password Field */}
                <div className="form-field">
                  <label htmlFor="password" className="field-label">كلمة المرور</label>
                  <div className={`field-input-wrapper ${errors.password ? 'has-error' : ''}`}>
                    <button
                      type="button"
                      className="visibility-toggle"
                      onClick={togglePasswordVisibility}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="field-input"
                      placeholder="أدخل كلمة المرور"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      dir="rtl"
                      autoComplete="new-password"
                      aria-required="true"
                    />
                    <span className="field-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                    </span>
                  </div>
                  
                  {/* Password Strength Indicator & Requirements */}
                  <div className="password-strength-container" style={{ marginTop: '10px' }}>
                    {formData.password && (
                      <>
                        <div className="strength-bar-bg" style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            className="strength-bar-fill" 
                            style={{ 
                              height: '100%', 
                              width: `${(passwordStrength.score / 5) * 100}%`, 
                              backgroundColor: passwordStrength.color,
                              transition: 'all 0.3s ease'
                            }} 
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.8rem' }}>
                          <span style={{ color: passwordStrength.color, fontWeight: 'bold' }}>{passwordStrength.label}</span>
                          <span style={{ color: '#64748b' }}>قوة كلمة المرور</span>
                        </div>
                      </>
                    )}
                    
                    <ul className="password-requirements" style={{ listStyle: 'none', padding: 0, marginTop: '8px', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                      <li style={{ color: passwordStrength.requirements.length ? '#10b981' : '#94a3b8' }}>
                        {passwordStrength.requirements.length ? '✅' : '○'} 8 أحرف على الأقل
                      </li>
                      <li style={{ color: passwordStrength.requirements.hasUpper ? '#10b981' : '#94a3b8' }}>
                        {passwordStrength.requirements.hasUpper ? '✅' : '○'} حرف كبير
                      </li>
                      <li style={{ color: passwordStrength.requirements.hasLower ? '#10b981' : '#94a3b8' }}>
                        {passwordStrength.requirements.hasLower ? '✅' : '○'} حرف صغير
                      </li>
                      <li style={{ color: passwordStrength.requirements.hasNumber ? '#10b981' : '#94a3b8' }}>
                        {passwordStrength.requirements.hasNumber ? '✅' : '○'} رقم واحد
                      </li>
                      <li style={{ color: passwordStrength.requirements.hasSpecial ? '#10b981' : '#94a3b8' }}>
                        {passwordStrength.requirements.hasSpecial ? '✅' : '○'} رمز خاص
                      </li>
                    </ul>
                  </div>
                  
                  {errors.password && <p className="field-error" role="alert">{errors.password}</p>}
                </div>

                {/* Confirm Password Field */}
                <div className="form-field">
                  <label htmlFor="confirmPassword" className="field-label">تأكيد كلمة المرور</label>
                  <div className={`field-input-wrapper ${errors.confirmPassword ? 'has-error' : ''}`}>
                    <button
                      type="button"
                      className="visibility-toggle"
                      onClick={toggleConfirmPasswordVisibility}
                      aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="field-input"
                      placeholder="أعد إدخال كلمة المرور"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      dir="rtl"
                      autoComplete="new-password"
                      aria-required="true"
                    />
                    <span className="field-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                    </span>
                  </div>
                  {errors.confirmPassword && <p className="field-error" role="alert">{errors.confirmPassword}</p>}
                </div>

                {/* Form-level Error Message */}
                {errors.form && (
                  <div className="form-field">
                    <p className="field-error" style={{ textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem' }} role="alert">
                      {errors.form}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className={`submit-button ${isLoading ? 'is-loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="loading-spinner" width="16" height="16" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.4" />
                      </svg>
                      <span>جاري المعالجة...</span>
                    </>
                  ) : (
                    'إنشاء الحساب'
                  )}
                </button>
              </form>

              {/* Login link */}
              <footer className="form-footer">
                <p className="switch-auth-text">
                  لديك حساب بالفعل؟{' '}
                  <Link to="/login" className="switch-auth-link">سجل دخولك هنا</Link>
                </p>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default SignupPage;
