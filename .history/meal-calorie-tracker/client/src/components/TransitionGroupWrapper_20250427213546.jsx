import React, { useRef } from 'react';
import { Transition as ReactTransition, CSSTransition, TransitionGroup } from 'react-transition-group';

/**
 * A React 18 compatible wrapper for Transition component
 * Uses nodeRef instead of the deprecated findDOMNode
 */
export const Transition = ({ children, ...props }) => {
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
    <CSSTransition
      {...props}
      nodeRef={nodeRef}
    >
      {React.cloneElement(React.Children.only(children), { ref: nodeRef })}
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
