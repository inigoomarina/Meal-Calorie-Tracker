import React from 'react';
import { Transition } from './TransitionGroupWrapper';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  width = '90%',
  maxWidth = '500px',
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <Transition
      in={isOpen}
      timeout={300}
      unmountOnExit
    >
      {state => (
        <div 
          className="modal-overlay" 
          onClick={onClose}
          style={{
            opacity: state === 'entering' || state === 'entered' ? 1 : 0,
            pointerEvents: state === 'exiting' ? 'none' : 'auto'
          }}
        >
          <div 
            className={`modal-container ${className}`}
            style={{
              width,
              maxWidth,
              transform: state === 'entering' || state === 'entered' 
                ? 'translateY(0) scale(1)' 
                : 'translateY(-20px) scale(0.95)',
              opacity: state === 'entering' || state === 'entered' ? 1 : 0
            }}
            onClick={e => e.stopPropagation()}
          >
            {title && (
              <div className="modal-header">
                <h2>{title}</h2>
                <button className="modal-close-btn" onClick={onClose}>×</button>
              </div>
            )}
            <div className="modal-content">
              {children}
            </div>
          </div>
        </div>
      )}
    </Transition>
  );
};

export default Modal;
