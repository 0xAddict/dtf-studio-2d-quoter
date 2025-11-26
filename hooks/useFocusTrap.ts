import { useEffect, useRef, useCallback } from 'react';

interface UseFocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

/**
 * Custom hook for implementing accessible focus trapping in modals and dialogs.
 * Follows WCAG 2.1 AA guidelines for keyboard navigation.
 *
 * @param containerRef - Ref to the container element that should trap focus
 * @param options - Configuration options for the focus trap
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: React.RefObject<T>,
  options: UseFocusTrapOptions
) {
  const { isActive, onEscape, restoreFocus = true, initialFocusRef } = options;
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const selector = [
      'button:not([disabled]):not([tabindex="-1"])',
      '[href]:not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    ).filter(el => {
      // Filter out elements that are hidden or have display: none
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, [containerRef]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive || !containerRef.current) return;

    // Handle Escape key
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      event.stopPropagation();
      onEscape();
      return;
    }

    // Handle Tab key for focus trapping
    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Check if focus is outside the container
      if (!containerRef.current.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey) {
        // Shift + Tab: move focus backwards
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: move focus forwards
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isActive, containerRef, getFocusableElements, onEscape]);

  // Store previously focused element and set up focus trap
  useEffect(() => {
    if (isActive) {
      // Store the currently focused element
      previouslyFocusedRef.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Add keyboard event listener
      document.addEventListener('keydown', handleKeyDown);

      // Set initial focus
      requestAnimationFrame(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          const focusableElements = getFocusableElements();
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else {
            // If no focusable elements, focus the container itself
            containerRef.current?.focus();
          }
        }
      });

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;

        // Restore focus to previously focused element
        if (restoreFocus && previouslyFocusedRef.current) {
          // Use setTimeout to ensure focus restoration happens after the modal unmounts
          setTimeout(() => {
            previouslyFocusedRef.current?.focus();
          }, 0);
        }
      };
    }
  }, [isActive, handleKeyDown, getFocusableElements, initialFocusRef, containerRef, restoreFocus]);

  return {
    getFocusableElements,
  };
}
