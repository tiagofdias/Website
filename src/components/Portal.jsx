import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modern Portal component for React 18+
 * Provides a clean way to render children into a DOM node outside the parent hierarchy
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render in the portal
 * @param {HTMLElement} [props.container] - Custom container element (defaults to document.body)
 * @param {string} [props.containerSelector] - CSS selector to find container (e.g., '#modal-root')
 */
const Portal = ({ children, container, containerSelector }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerSelector) {
      containerRef.current = document.querySelector(containerSelector);
    } else if (container) {
      containerRef.current = container;
    } else {
      containerRef.current = document.body;
    }

    // Cleanup function
    return () => {
      containerRef.current = null;
    };
  }, [container, containerSelector]);

  if (!containerRef.current && typeof window !== 'undefined') {
    containerRef.current = containerSelector 
      ? document.querySelector(containerSelector) || document.body
      : container || document.body;
  }

  return containerRef.current
    ? createPortal(children, containerRef.current)
    : null;
};

export default Portal;
