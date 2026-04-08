import { Link } from 'react-router-dom'
import Hero from '../components/Hero/Hero'
import Features from '../components/Features/Features'
import About from '../components/About/About'
import Footer from '../components/Footer/Footer'
import '../App.css'

/**
 * Main landing page component
 * Contains hero, features, about, and footer sections
 */
function LandingPage({ unreadCount = 0 }) {
  return (
    <>
      <Hero 
        unreadCount={unreadCount}
        showBell={false}
        onDiscoverFeatures={() => {
          const featuresSection = document.querySelector('.features');
          if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
          }
        }} 
      />
      <Features />
      <About />
      <Footer />
    </>
  )
}

export default LandingPage;
