import React, { useState, useEffect, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService';
import Footer from '../components/Footer/Footer';
import '../styles/Monitoring.css';
import Navbar from '../components/Navbar/Navbar';
import theatreImage from '../assets/images/theatre.png';
import playgroundImage from '../assets/images/playground.png';
import libraryImage from '../assets/images/library.png';

// Separate memoized camera component to prevent re-renders when events change
const CameraFeed = memo(({ streamKey, handleCameraLoad, handleCameraError }) => {
  return (
    <img 
      src={`http://127.0.0.1:8001/stream/mjpeg?t=${streamKey}`} 
      alt="Live Camera Feed" 
      className="camera-feed"
      crossOrigin="anonymous"
      onLoad={handleCameraLoad}
      onError={(e) => {
        console.log("Camera error, trying /live endpoint as fallback");
        handleCameraError();
        // Try fallback to /live endpoint if /stream/mjpeg fails
        if (e.target && !e.target.src.includes('/live')) {
          e.target.src = `http://127.0.0.1:8001/live?t=${Date.now()}`;
          return;
        }
        
        // Final fallback to SVG if both fail
        setTimeout(() => {
          if (e.target) {
            e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg width=\'640\' height=\'480\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect fill=\'%232a2a3a\' width=\'640\' height=\'480\'/%3E%3Ctext x=\'320\' y=\'240\' font-family=\'Arial\' font-size=\'24\' fill=\'%23fff\' text-anchor=\'middle\'%3Eنظام المراقبة%3C/text%3E%3Ctext x=\'320\' y=\'280\' font-family=\'Arial\' font-size=\'18\' fill=\'%23ccc\' text-anchor=\'middle\'%3Eيعمل%3C/text%3E%3Ccircle cx=\'320\' cy=\'340\' r=\'50\' fill=\'none\' stroke=\'%2322c55e\' stroke-width=\'3\'/%3E%3Ccircle cx=\'360\' cy=\'340\' r=\'8\' fill=\'%2322c55e\'/%3E%3Ccircle cx=\'280\' cy=\'340\' r=\'8\' fill=\'%2322c55e\'/%3E%3Ccircle cx=\'320\' cy=\'380\' r=\'8\' fill=\'%2322c55e\'/%3E%3C/svg%3E';
          }
        }, 3000);
      }}
    />
  );
});

function Monitoring({ events = [], unreadCount = 0, wsConnected = false, isWsConnecting = false, theme, toggleTheme }) {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [useTestVideo, setUseTestVideo] = useState(false); // Toggle for testing
  const [lastCameraTime, setLastCameraTime] = useState(() => {
    const saved = localStorage.getItem('lastCameraOnlineTime');
    return saved ? new Date(saved) : null;
  });
  const [cameraStatus, setCameraStatus] = useState('offline'); // 'online', 'offline', 'loading'
  const [searchQuery, setSearchQuery] = useState(() => {
    const saved = localStorage.getItem('monitoringSearchQuery');
    return saved !== null ? saved : '';
  });
  const [sortBy, setSortBy] = useState(() => {
    const saved = localStorage.getItem('monitoringSortBy');
    return saved !== null ? saved : 'score';
  }); // 'score', 'time', 'location'
  const [currentUser, setCurrentUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [selectedOrganization, setSelectedOrganization] = useState('all'); // 'all' or specific org
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showOverlay, setShowOverlay] = useState(false);

  // Use useCallback to prevent unnecessary re-renders of CameraFeed
  const handleCameraLoad = React.useCallback(() => {
    setCameraStatus(prev => prev !== 'online' ? 'online' : prev);
    const now = new Date();
    setLastCameraTime(now);
    localStorage.setItem('lastCameraOnlineTime', now.toISOString());
  }, []);

  const handleCameraError = React.useCallback(() => {
    setCameraStatus(prev => prev !== 'offline' ? 'offline' : prev);
  }, []);

  // Update camera time and status
  useEffect(() => {
    const updateCameraTime = () => {
      if (cameraEnabled) {
        setCameraStatus(prev => prev !== 'online' ? 'online' : prev);
      } else {
        setCameraStatus(prev => prev !== 'offline' ? 'offline' : prev);
      }
    };

    if (cameraEnabled) {
      updateCameraTime();
    }
    
    const interval = cameraEnabled ? setInterval(updateCameraTime, 1000) : null;
    return () => clearInterval(interval);
  }, [cameraEnabled]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await authService.getCurrentUser();
      if (!user) {
        navigate('/login');
      } else {
        setCurrentUser(user);
        
        // Ensure organization is set in backend for email notifications
        if (user.organization) {
          setCurrentOrg(user.organization);
          
          try {
            const response = await fetch('http://127.0.0.1:8001/set-organization', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                organization: user.organization
              })
            });
            
            if (response.ok) {
              console.log('✅ Monitoring - Organization set successfully:', user.organization);
            } else {
              console.error('❌ Monitoring - Failed to set organization:', user.organization);
            }
          } catch (error) {
            console.error('❌ Monitoring - Error setting organization:', error);
          }
        }
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    authService.signout();
    navigate('/login');
  };

  // Fullscreen functions
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 1));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Helper function to get status class for styling
  const getStatusClass = (status, severity) => {
    // Special case for resolved status
    if (status && status.includes('تم الحل')) {
      return 'resolved'; // Green badge
    }
    return severity || 'normal';
  };

  // Handle Escape key for fullscreen exit and zoom reset
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      } else if (e.key === 'Escape' && zoomLevel !== 1) {
        resetZoom();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, zoomLevel]);

  // Fetch initial camera status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8001/camera/status');
        setCameraEnabled(response.data.enabled);
        setStreamKey(Date.now());
      } catch (err) {
        console.error('Failed to fetch camera status:', err);
      }
    };
    fetchStatus();
  }, []);

  const toggleCamera = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post('http://127.0.0.1:8001/camera/toggle');
      setCameraEnabled(response.data.enabled);
      setStreamKey(Date.now()); // Update stream key only when camera is toggled
    } catch (err) {
      console.error('Failed to toggle camera:', err);
      alert('فشل التحكم في الكاميرا');
    } finally {
      setIsLoading(false);
    }
  };

  // Control overlay visibility when camera is enabled/disabled
  React.useEffect(() => {
    if (cameraEnabled) {
      // Show overlay for 2 seconds when camera is enabled
      setShowOverlay(true);
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      // Hide overlay when camera is disabled
      setShowOverlay(false);
    }
  }, [cameraEnabled]);

  // Scroll to events table after navigation completes
  useEffect(() => {
    const checkAndScroll = () => {
      if (window.location.pathname === '/Dashboard' && window.location.hash === '#events-table') {
        const timeout = setTimeout(() => {
          const eventsTable = document.querySelector('.events-section');
          if (eventsTable) {
            eventsTable.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        
        return () => clearTimeout(timeout);
      }
    };

    checkAndScroll();
  }, []); 

  useEffect(() => {
    localStorage.setItem('monitoringSearchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('monitoringSortBy', sortBy);
  }, [sortBy]);

  // Extract unique organizations from events
  useEffect(() => {
    if (events.length > 0) {
      const orgs = [...new Set(events.map(event => event.organization).filter(Boolean))];
      setAllOrganizations(orgs);
    }
  }, [events]);

  const filteredEvents = events
    .filter(event => {
      // Filter by organization - ONLY Smart Guard can access all organizations
      if (currentUser && currentUser.email === 'admin@smartguard.com') {
        // Smart Guard can filter by specific organization
        if (selectedOrganization !== 'all' && event.organization !== selectedOrganization) {
          return false;
        }
      } else if (currentUser) {
        // All other users can only see their own organization's events
        if (event.organization !== currentUser.organization) {
          return false;
        }
      }
      
      return (
        !searchQuery ||
        event.location.includes(searchQuery) ||
        event.datetime.includes(searchQuery) ||
        event.status.includes(searchQuery) ||
        (event.modelUsed && event.modelUsed.includes(searchQuery))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        const scoreA = parseFloat(a.confidence) || 0;
        const scoreB = parseFloat(b.confidence) || 0;
        return scoreB - scoreA;
      } else if (sortBy === 'time') {
        return new Date(b.id) - new Date(a.id); 
      } else if (sortBy === 'location') {
        return a.location.localeCompare(b.location);
      }
      return 0;
    });

  return (
    <div className="dashboard-page">
      <Navbar currentPage="monitoring" showBell={true} unreadCount={unreadCount} />
      <section className="monitoring-hero">
        <h1 className="monitoring-hero__title">نظام المراقبة المباشر</h1>
        <p className="monitoring-hero__subtitle">مراقبة مباشرة على مدار الساعة بتقنية الذكاء الاصطناعي</p>
        <div className={`ws-status ${wsConnected ? 'connected' : 'disconnected'}`}>
          <span className="ws-dot"></span>
          {wsConnected ? 'متصل بنظام التنبيهات' : 'جاري الاتصال بنظام التنبيهات...'}
        </div>
      </section>
      
      <div className="monitoring-content">
        <h2 className="section-title" style={{ margin: '2rem 0' }}>البث المباشر للكاميرات</h2>
        
        <div className="camera-grid" style={{
          display: isFullscreen ? 'block' : 'grid',
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? '0' : 'auto',
          left: isFullscreen ? '0' : 'auto',
          width: isFullscreen ? '100vw' : 'auto',
          height: isFullscreen ? '100vh' : 'auto',
          zIndex: isFullscreen ? 9999 : 'auto',
          backgroundColor: isFullscreen ? 'black' : 'transparent'
        }}>
          {/* Main Camera View */}
          <div className="camera-main" style={{
            display: isFullscreen ? 'flex' : 'block',
            alignItems: 'center',
            justifyContent: 'center',
            height: isFullscreen ? '100vh' : 'auto'
          }}>
            <div className="camera-card" style={{
              width: isFullscreen ? '100%' : 'auto',
              height: isFullscreen ? '100%' : 'auto',
              maxWidth: isFullscreen ? '100vw' : 'none',
              maxHeight: isFullscreen ? '100vh' : 'none'
            }}>
              <div className="camera-header">
                <h3 className="camera-title">الكاميرا الرئيسية - مدخل الجامعة</h3>
                <div className="camera-header__actions">
                  {/* Zoom Controls */}
                  <div className="zoom-controls" style={{ 
                    display: 'flex', 
                    gap: '0.25rem', 
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 100
                  }}>
                    <button 
                      className="zoom-btn"
                      onClick={zoomOut}
                      disabled={zoomLevel <= 0.5}
                      title="تصغير"
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        cursor: zoomLevel > 0.5 ? 'pointer' : 'not-allowed',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--card-shadow)',
                        minWidth: '2rem'
                      }}
                    >
                      −
                    </button>
                    <button 
                      className="zoom-reset-btn"
                      onClick={resetZoom}
                      disabled={zoomLevel === 1}
                      title="إعادة تعيين التكبير (ESC)"
                      style={{
                        background: zoomLevel !== 1 ? 'var(--accent-primary)' : 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        color: zoomLevel !== 1 ? 'var(--text-inverse)' : 'var(--text-primary)',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        cursor: zoomLevel !== 1 ? 'pointer' : 'not-allowed',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--card-shadow)',
                        minWidth: '2.5rem',
                        fontWeight: zoomLevel !== 1 ? 'bold' : 'normal'
                      }}
                    >
                      {Math.round(zoomLevel * 100)}%
                    </button>
                    <button 
                      className="zoom-btn"
                      onClick={zoomIn}
                      disabled={zoomLevel >= 1}
                      title="تكبير"
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        cursor: zoomLevel < 1 ? 'pointer' : 'not-allowed',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--card-shadow)',
                        minWidth: '2rem'
                      }}
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Fullscreen Toggle */}
                  <button 
                    className="fullscreen-btn"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '4px',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '0.5rem',
                      boxShadow: 'var(--card-shadow)'
                    }}
                  >
                    {isFullscreen ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                      </svg>
                    )}
                  </button>

                  <button 
                    className={`camera-toggle-btn ${cameraEnabled ? 'enabled' : 'disabled'}`}
                    onClick={toggleCamera}
                    disabled={isLoading}
                    title={cameraEnabled ? 'إغلاق الكاميرا' : 'تشغيل الكاميرا'}
                  >
                    {isLoading ? (
                      <span className="spinner"></span>
                    ) : cameraEnabled ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 1l22 22M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.17l2-3h7.66l2 3H21a2 2 0 0 1 2 2v9.34M10.17 10.17a4 4 0 1 0 5.66 5.66" />
                        </svg>
                        <span>إيقاف</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span>تشغيل</span>
                      </>
                    )}
                  </button>
                  <span className={`live-indicator ${cameraEnabled ? 'active' : 'inactive'}`}>
                    <span className="live-dot"></span>
                    مباشر
                  </span>
                </div>
              </div>
              <div className="camera-view" style={{
                position: 'relative',
                overflow: 'hidden',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center',
                transition: 'transform 0.3s ease',
                backgroundColor: !cameraEnabled ? '#000' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: isFullscreen ? '100vh' : '400px'
              }}>
                {/* Floating Reset Zoom Button */}
                {zoomLevel !== 1 && cameraEnabled && (
                  <button
                    className="zoom-reset-floating"
                    onClick={resetZoom}
                    title="إعادة تعيين التكبير (ESC)"
                    style={{
                      position: 'absolute',
                      bottom: '1rem',
                      right: '1rem',
                      background: 'var(--accent-primary)',
                      border: 'none',
                      color: 'var(--text-inverse)',
                      borderRadius: '50%',
                      width: '3rem',
                      height: '3rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(74, 91, 239, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                )}
                {isFullscreen && (
                  <button
                    className="fullscreen-close-btn"
                    onClick={exitFullscreen}
                    title="خروج من ملء الشاشة (ESC)"
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(0, 0, 0, 0.7)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '50%',
                      width: '3rem',
                      height: '3rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    ×
                  </button>
                )}
                {!cameraEnabled || showOverlay ? (
                  <div className="camera-disabled-overlay" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '2rem'
                  }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                      <path d="M1 1l22 22M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.17l2-3h7.66l2 3H21a2 2 0 0 1 2 2v9.34M10.17 10.17a4 4 0 1 0 5.66 5.66" />
                    </svg>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                      {cameraEnabled ? 'camera is starting...' : 'camera is disabled'}
                    </h3>
                    <p style={{ opacity: 0.7 }}>
                      {cameraEnabled ? 'يرجى الانتظار قليلاً' : 'يرجى تشغيل الكاميرا لاستئناف البث المباشر'}
                    </p>
                  </div>
                ) : (
                  <CameraFeed 
                    streamKey={streamKey} 
                    handleCameraLoad={handleCameraLoad}
                    handleCameraError={handleCameraError}
                  />
                )}
              </div>
              <div className="camera-footer">
                <span className="camera-time">
                  {cameraEnabled && cameraStatus === 'online' ? (
                    <>
                      <span className="status-dot--online" style={{ color: '#22c55e' }}>●</span> {' '}
                      {new Date().toLocaleString('ar-SA', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        hour12: false 
                      })}
                    </>
                  ) : (
                    <>
                      <span className="status-dot--offline" style={{ color: '#ef4444' }}>●</span> {' '}
                      <span style={{ color: '#ef4444' }}>آخر ظهور: </span>
                      {lastCameraTime ? 
                        lastCameraTime.toLocaleString('ar-SA', { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit',
                          hour12: false 
                        }) : 
                        'غير متوفر'
                      }
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar Cameras */}
          {!isFullscreen && (
            <div className="camera-sidebar">
            {/* Camera 2 - المسرح */}
            <div className="camera-card camera-card--small">
              <div className="camera-header">
                <h4 className="camera-title--small">كاميرا 2: المسرح</h4>
                <span className="live-indicator live-indicator--small inactive">
                  <span className="live-dot"></span>
                </span>
              </div>
              <div className="camera-view camera-view--small">
                <img 
                  src={theatreImage} 
                  alt="المسرح" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }} 
                />
              </div>
            </div>

            {/* Camera 3 - الملعب */}
            <div className="camera-card camera-card--small">
              <div className="camera-header">
                <h4 className="camera-title--small">كاميرا 3: الملعب</h4>
                <span className="live-indicator live-indicator--small inactive">
                  <span className="live-dot"></span>
                </span>
              </div>
              <div className="camera-view camera-view--small">
                <img 
                  src={playgroundImage} 
                  alt="الملعب" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }} 
                />
              </div>
            </div>

            {/* Camera 4 - المكتبة */}
            <div className="camera-card camera-card--small">
              <div className="camera-header">
                <h4 className="camera-title--small">كاميرا 4: المكتبة</h4>
                <span className="live-indicator live-indicator--small inactive">
                  <span className="live-dot"></span>
                </span>
              </div>
              <div className="camera-view camera-view--small">
                <img 
                  src={libraryImage} 
                  alt="المكتبة" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }} 
                />
              </div>
            </div>
          </div>
          )}
        </div>

        {/* --- Events Log --- */}
        <h2 className="section-title" style={{ margin: '2rem 0' }}>سجلات الأحداث</h2>
        
        {/* Organization Filter - ONLY Smart Guard can access all organizations */}
        {currentUser && currentUser.email === 'admin@smartguard.com' && allOrganizations.length > 1 && (
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className="sorting-label">المنظمة:</span>
            <select 
              className="sorting-select" 
              value={selectedOrganization} 
              onChange={(e) => setSelectedOrganization(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="all">جميع المنظمات</option>
              {allOrganizations.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="events-section">
          <table className="events-table">
            <thead>
              <tr>
                <th>الموقع</th>
                <th>التاريخ والوقت</th>
                <th>الحالة</th>
                <th>الدقة</th>
                <th>النموذج</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? filteredEvents.map((event, index) => (
                <tr key={event.id || index}>
                  <td>{event.location}</td>
                  <td>{event.datetime}</td>
                  <td>
                    <span className={`status-badge status-badge--${getStatusClass(event.status, event.severity)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td>{event.confidence || '-'}</td>
                  <td>
                    <span className={`model-tag ${event.severity === 'emergency' ? 'model-tag--emergency' : event.severity === 'high' ? 'model-tag--fight' : 'model-tag--keras'}`}>
                      {event.status === 'طبيعي' ? 'Normal Detection' : 'Abnormal Detection'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    لا توجد نتائج
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default Monitoring;