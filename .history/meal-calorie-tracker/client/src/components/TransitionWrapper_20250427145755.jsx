import React, { useRef } from 'react';
import { Transition as ReactTransition, TransitionGroup } from 'react-transition-group';

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
 * A React 18 compatible wrapper for TransitionGroup
 */
export const SafeTransitionGroup = (props) => {
  return <TransitionGroup {...props} />;
};
