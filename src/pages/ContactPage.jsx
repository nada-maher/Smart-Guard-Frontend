import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Contact.css';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import nadaMaherImage from '../assets/images/team/nada-maher.png';
import ahmedSaadImage from '../assets/images/team/ahmed-saad.png';
import hagarKhaledImage from '../assets/images/team/Screenshot 2026-04-05 173139.png';
import marwanMegahedImage from '../assets/images/team/Screenshot 2026-04-05 174056.png';
import mennaAshrafImage from '../assets/images/team/Screenshot 2026-04-05 174349.png';
import shrouqMohamedImage from '../assets/images/team/Screenshot 2026-04-05 174459.png';
import raghadImage from '../assets/images/team/Screenshot 2026-04-05 173837.png';
import hanaaImage from '../assets/images/team/Screenshot 2026-04-05 173508.png';
import amlAshrafImage from '../assets/images/team/Screenshot 2026-04-05 224307.png';
import mennaDemerdashImage from '../assets/images/team/Screenshot 2026-04-05 173407.png';

// Add Font Awesome CDN
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
if (!document.querySelector('link[href*="font-awesome"]')) {
  document.head.appendChild(fontAwesomeLink);
}

function ContactPage({ theme, toggleTheme, unreadCount }) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  // Team members data
  const teamMembers = [
    {
      name: "ندى ماهر محمد الهادي",
      role: "Full Stack Developer",
      image: nadaMaherImage,
      github: "https://github.com/nada-maher",
      linkedin: "https://www.linkedin.com/in/nada-maher-9b7327285/",
      id: 1
    },
    {
      name: "هاجر خالد إبراهيم",
      role: "Frontend Developer",
      image: hagarKhaledImage,
      github: "https://github.com/hagarkhaledkouta",
      linkedin: "https://www.linkedin.com/in/hagar-khaled-kouta-175a62376",
      id: 2
    },
    {
      name: "أحمد سعد كرم",
      role: "Backend Developer",
      image: ahmedSaadImage,
      github: "https://github.com/AhmedSaad332",
      linkedin: "https://www.linkedin.com/in/ahmedsaad-cs?utm_source=share_via&utm_content=profile&utm_medium=member_android",
      id: 3
    },
    {
      name: "منة الدمرداش",
      role: "UI/UX Designer",
      image: mennaDemerdashImage,
      github: "https://github.com/mennaeldemerdash622",
      linkedin: "https://www.linkedin.com/in/menna-el-demerdash-1121bb297?utm_source=share_via&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      id: 4
    },
    {
      name: "هناء الجباس",
      role: "Frontend Developer",
      image: hanaaImage,
      github: "https://github.com/hanaelgabbas",
      linkedin: "https://www.linkedin.com/in/hanaa-elgabbas-6b46772a1/",
      id: 5
    },
    {
      name: "رغد هاني طلعت",
      role: "Backend Developer",
      image: raghadImage,
      github: "https://www.linkedin.com/safety/go/?url=https%3A%2F%2Fgithub%2Ecom%2FRaghadhany&urlhash=flg4&isSdui=true",
      linkedin: "https://www.linkedin.com/in/raghad-hany-6a3b6b263",
      id: 6
    },
    {
      name: "أمل أشرف علي",
      role: "DevOps Engineer",
      image: amlAshrafImage,
      github: "https://github.com/amlashraf2004-cell",
      linkedin: "https://www.linkedin.com/in/aml-ashraf-6451942b2?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
      id: 7
    },
    {
      name: "مروان أشرف حسن",
      role: "Full Stack Developer",
      image: marwanMegahedImage,
      github: "https://github.com/Marwan-Megahed",
      linkedin: "https://www.linkedin.com/in/marwan-megahed-606ab4307/",
      id: 8
    },
    {
      name: "منة أشرف مروان",
      role: "Frontend Developer",
      image: mennaAshrafImage,
      github: "https://github.com/MennaAshraf101",
      linkedin: "https://eg.linkedin.com/in/menna-ashraf-70b1612b7",
      id: 9
    },
    {
      name: "شروق محمد عبدالرؤوف",
      role: "Backend Developer",
      image: shrouqMohamedImage,
      github: "https://github.com/ShrouqKordy",
      linkedin: "https://www.linkedin.com/in/shrouq-mohamed-a335902a0",
      id: 10
    }
  ];

  useEffect(() => {
    // Set page title
    document.title = 'فريق العمل - Smart Guard';
  }, []);

  const handleCardHover = (id) => {
    setHoveredCard(id);
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  return (
    <div className="dashboard-page">
      <Navbar currentPage="contact" showBell={true} unreadCount={unreadCount} />
      
      <div className="contact-header">
        <h1 className="contact-title">فريق العمل</h1>
        <p className="contact-subtitle">العقول اللامعة وراء مشروع<br />Smart Guard</p>
      </div>

      <div className="contact-wrapper">
        <div className="team-grid">
          {teamMembers.map((member) => (
            <div 
              key={member.id}
              className={`team-card ${hoveredCard === member.id ? 'hovered' : ''}`}
              onMouseEnter={() => handleCardHover(member.id)}
              onMouseLeave={handleCardLeave}
            >
              <div className="card-image">
                <img 
                  src={member.image} 
                  alt={member.name}
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/150/CCCCCC/FFFFFF?text=${member.name.charAt(0)}`;
                  }}
                />
              </div>
              
              <div className="card-content">
                <h3 className="member-name">{member.name}</h3>
                
                <div className="social-links">
                  <a 
                    href={member.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-icon github-icon"
                    title="GitHub"
                  >
                    <i className="fab fa-github"></i>
                  </a>
                  
                  <a 
                    href={member.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-icon linkedin-icon"
                    title="LinkedIn"
                  >
                    <i className="fab fa-linkedin"></i>
                  </a>
                </div>
              </div>
            </div>
          ))}
          
          {/* Email Contact Card */}
          <div className="team-card email-card">
            <div className="card-image email-image">
              <i className="fas fa-envelope"></i>
            </div>
            
            <div className="card-content">
              <h3 className="member-name">البريد الالكتروني</h3>
              <p className="contact-text">لاي استفسارات او دعم فني لا تتردد في مراسلتنا</p>
              <a 
                href="mailto:smartguardbnu@gmail.com" 
                className="email-link"
                title="Email Us"
              >
                smartguard@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ContactPage;
