import React from 'react';
import { Transition } from './TransitionGroupWrapper';
import './ModalTransition.css';

const ModalTransition = ({ 
  children, 
  isOpen, 
  onClose, 
  className = '', 
  timeout = 300,
  closeOnOverlayClick = true,
  maxWidth = '500px'
}) => {
  if (!isOpen) return null;
  
  const handleOverlayClick = closeOnOverlayClick ? onClose : undefined;
  
  return (
    <Transition
      in={isOpen}
      timeout={timeout}
      unmountOnExit
    >
      {state => (
        <div 
          className="modal-overlay" 
          onClick={handleOverlayClick}
          style={{
            opacity: state === 'entering' || state === 'entered' ? 1 : 0
          }}
        >
          <div 
            className={`modal-content ${className}`} 
            onClick={e => e.stopPropagation()}
            style={{
              transform: state === 'entering' || state === 'entered' 
                ? 'translateY(0)' 
                : 'translateY(20px)',
              maxWidth: maxWidth
            }}
          >
            {children}
          </div>
        </div>
      )}
    </Transition>
  );
};

export default ModalTransition;
