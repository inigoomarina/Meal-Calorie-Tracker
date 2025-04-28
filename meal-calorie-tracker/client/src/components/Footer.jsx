import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {year} Meal & Calorie Tracker. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
