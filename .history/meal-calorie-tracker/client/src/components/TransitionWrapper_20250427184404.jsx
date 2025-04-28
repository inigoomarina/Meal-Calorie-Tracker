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