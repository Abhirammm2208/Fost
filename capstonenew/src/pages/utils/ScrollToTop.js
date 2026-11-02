// First create a new file ScrollToTop.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' instead of 'smooth' to prevent visible scrolling
    });
  }, [location.pathname]); // Trigger when pathname changes

  return null;
};

export default ScrollToTop;