import React, { useRef } from 'react';
// Import CSSTransition as well
import { Transition as ReactTransition, CSSTransition, TransitionGroup } from 'react-transition-group';

/**
 * A React 18 compatible wrapper for Transition component
 * Uses nodeRef instead of the deprecated findDOMNode
 */
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

/**
 * A React 18 compatible wrapper for CSSTransition
 */
export const SafeCSSTransition = ({ children, ...props }) => {
  const nodeRef = useRef(null);
  return (
    // Use CSSTransition directly
    <CSSTransition
      {...props}
      nodeRef={nodeRef} // Pass nodeRef to CSSTransition
    >
      {/* The direct child must accept the ref */}
      {React.cloneElement(React.Children.only(children), { ref: nodeRef })}
    </CSSTransition>
  );
};


/**
 * A React 18 compatible wrapper for TransitionGroup
 */
export const SafeTransitionGroup = props => {
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
  entering: { opacity: 0 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
};
