import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook tracking document visibility state (Page Visibility API).
 * Returns true if the page is currently visible, false if hidden or minimized.
 *
 * @param {Function} [onVisible] - Optional callback triggered immediately when visibility transitions from hidden -> visible.
 * @returns {boolean} isVisible
 */
export function usePageVisibility(onVisible) {
  const [isVisible, setIsVisible] = useState(() => {
    return typeof document !== 'undefined' ? !document.hidden : true;
  });

  const onVisibleRef = useRef(onVisible);
  useEffect(() => {
    onVisibleRef.current = onVisible;
  }, [onVisible]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = typeof document !== 'undefined' ? !document.hidden : true;
      setIsVisible(visible);
      if (visible && onVisibleRef.current) {
        onVisibleRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

export default usePageVisibility;
