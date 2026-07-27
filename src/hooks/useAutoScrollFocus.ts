import { useEffect, useRef } from 'react';

/**
 * Custom hook to manage focus auto-scrolling for Roku TV app navigation.
 * Ensures scrollIntoView ONLY triggers when navigating via Keyboard or Roku Remote D-Pad,
 * preventing mouse wheel scrolling or mouse hover from yanking/jumping the viewport.
 */
export function useAutoScrollFocus(focusedIndex: number, elementRef: React.RefObject<HTMLElement | null>) {
  const isKeyboardOrRemoteRef = useRef<boolean>(false);

  useEffect(() => {
    const handleKeyDown = () => {
      isKeyboardOrRemoteRef.current = true;
    };

    const handleRemoteNav = () => {
      isKeyboardOrRemoteRef.current = true;
    };

    const handleWheel = () => {
      isKeyboardOrRemoteRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Only mark as mouse interaction if the mouse actually moved
      if (e.movementX !== 0 || e.movementY !== 0) {
        isKeyboardOrRemoteRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('roku-remote-nav', handleRemoteNav, { capture: true });
    window.addEventListener('wheel', handleWheel, { capture: true, passive: true });
    window.addEventListener('mousemove', handleMouseMove, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('roku-remote-nav', handleRemoteNav, { capture: true });
      window.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (elementRef.current && isKeyboardOrRemoteRef.current) {
      elementRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [focusedIndex, elementRef]);

  return isKeyboardOrRemoteRef;
}
