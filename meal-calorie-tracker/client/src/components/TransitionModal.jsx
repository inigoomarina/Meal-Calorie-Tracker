import React, { useEffect } from 'react';
import './TransitionModal.css';

const TransitionModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  className = '',
  maxWidth = '550px' 
}) => {
  useEffect(() => {
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div 
        className={`modal-container ${className}`} 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth }}
      >
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        )}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default TransitionModal;
