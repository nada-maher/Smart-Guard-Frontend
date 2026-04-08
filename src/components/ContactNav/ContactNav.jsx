import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Hero/Hero.css';
import { authService } from '../../services/authService';
import Navbar from '../Navbar/Navbar';

function ContactNav({ unreadCount = 0, showBell = true }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page" dir="rtl" lang="ar">
      <Navbar 
        currentPage="contact" 
        showBell={showBell} 
        unreadCount={unreadCount}
      />
    </div>
  );
}

export default ContactNav;
