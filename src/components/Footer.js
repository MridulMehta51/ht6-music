import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        &copy; {new Date().getFullYear()} Music Converter. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
