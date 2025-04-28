import React, { useRef } from 'react';
import { Transition as ReactTransition, TransitionGroup } from 'react-transition-group';

// Wrapper around ReactTransition to provide a nodeRef and handle children as a function
export const SafeTransition = ({ children, ...props }) => {
  const nodeRef = useRef(null);
  return (
    <ReactTransition {...props} nodeRef={nodeRef}>
      {(state) => (
        <div ref={nodeRef}>
          {typeof children === 'function' ? children(state) : children}
        </div>
      )}
    </ReactTransition>
  );
};

export const SafeTransitionGroup = (props) => {
  return <TransitionGroup {...props} />;
};

// Default animation durations
export const DURATION = {
  FADE: 300,
  SLIDE: 500,
  NONE: 0
};

// Common transition styles
export const transitionStyles = {
  fade: {
    entering: { opacity: 1 },
    entered: { opacity: 1 },
    exiting: { opacity: 0 },
    exited: { opacity: 0 },
  },
  slideUp: {
    entering: { transform: 'translateY(0)' },
    entered: { transform: 'translateY(0)' },
    exiting: { transform: 'translateY(20px)' },
    exited: { transform: 'translateY(20px)' },
  }
};

// Default transition style
export const defaultStyle = {
  transition: `opacity ${DURATION.FADE}ms ease, transform ${DURATION.SLIDE}ms ease`,
  opacity: 0
};