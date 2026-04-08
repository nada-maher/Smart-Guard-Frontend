import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Hero.css';
import cameraImage from '../../assets/images/camera1.png';
import { authService } from '../../services/authService';
import Navbar from '../Navbar/Navbar';

function Hero({ onDiscoverFeatures, unreadCount = 0, showBell = true }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page" dir="rtl" lang="ar">
      <Navbar 
        currentPage="home" 
        showBell={showBell} 
        unreadCount={unreadCount}
      />

      <section className="hero-main" aria-labelledby="hero-title">
        {/* Particle Effects */}
        <div className="particles">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                '--delay': `${Math.random() * 15}s`,
                '--drift-x': `${(Math.random() - 0.5) * 100}px`,
                '--size': `${Math.random() * 8 + 4}px`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 6 + 12}s`
              }}
            />
          ))}
        </div>
        
        <div className="hero-main__content">
          <div className="hero-main__heading-block">
            <h1 id="hero-title" className="hero-main__title hero-heading">حارس ذكي</h1>
            <h2 className="hero-main__subtitle hero-subheading">مراقبة مستمرة 24/7</h2>
          </div>
          <p className="hero-main__description hero-description">
            حماية ذكية متقدمة تعمل على مدار الساعة باستخدام الذكاء الاصطناعي لرصد وتحليل أي سلوك غير طبيعي فوراً
          </p>
          <div className="hero-main__actions">
            <button
              type="button"
              className="hero-main__btn hero-main__btn--secondary hero-button"
              onClick={onDiscoverFeatures}
            >
              استكشف الميزات
            </button>
          </div>
        </div>
        <div className="hero-main__media">
          <img
            src={cameraImage}
            alt=""
            className="hero-main__image camera-illustration"
            aria-hidden
          />
        </div>
        
      </section>
    </div>
  );
}

export default Hero;
