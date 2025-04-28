import React, { useRef } from "react";
// This import should work after running `npm install react-transition-group`
import { Transition as ReactTransition, CSSTransition, TransitionGroup } from "react-transition-group";

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

/**
 * A React 18 compatible wrapper for Transition component
 * Uses nodeRef instead of the deprecated findDOMNode
 */
export const SafeTransition = ({ children, ...props }) => {
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
export const SafeTransitionGroup = props => {
  return <TransitionGroup {...props} />;
};
