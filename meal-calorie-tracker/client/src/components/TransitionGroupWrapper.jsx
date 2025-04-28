import React, { useRef } from 'react';
import { Transition as ReactTransition, CSSTransition, TransitionGroup } from 'react-transition-group';

/**
 * A React 18 compatible wrapper for Transition component
 * Uses nodeRef instead of the deprecated findDOMNode
 */
// Note: This component is named 'Transition' but acts like 'SafeTransition'
export const Transition = ({ children, ...props }) => {
  const nodeRef = useRef(null);
  return (
    // Note: This wraps the child in an extra div. Ensure this is intended.
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
  // Ensure the child is a single valid React element
  const child = React.Children.only(children);

  // Check if the child is a DOM element or a component that forwards refs
  if (!React.isValidElement(child)) {
    console.error("SafeCSSTransition requires a single valid React element child.");
    return children; // Or handle error appropriately
  }

  return (
    <CSSTransition
      {...props}
      nodeRef={nodeRef} // Pass nodeRef to CSSTransition
    >
      {/* Clone the child and pass the nodeRef as the ref prop.
          The child component MUST forward this ref to its underlying DOM node. */}
      {React.cloneElement(child, { ref: nodeRef })}
    </CSSTransition>
  );
};

/**
 * A React 18 compatible wrapper for TransitionGroup
 */
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
export const defaultTransitionStyle = {
  transition: `opacity ${DURATION.FADE}ms ease, transform ${DURATION.SLIDE}ms ease`,
  opacity: 0
};

export default {
  Transition,
  TransitionGroup: SafeTransitionGroup,
  DURATION,
  styles: transitionStyles,
  defaultStyle: defaultTransitionStyle
};
