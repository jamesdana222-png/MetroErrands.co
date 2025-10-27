/**
 * Focus management utilities for accessibility
 * Helps with keyboard navigation and focus trapping in modals
 */
import React from 'react';

/**
 * Traps focus within a container element for modals and dialogs
 * @param containerRef - Reference to the container element
 * @param isActive - Whether focus trapping is active
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean = true) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // Focus the first element when the modal opens
    if (firstElement) {
      firstElement.focus();
    }
    
    // Handle tab key to trap focus
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      
      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } 
      // Tab
      else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Store previous active element to restore focus when modal closes
    const previousActiveElement = document.activeElement as HTMLElement;
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous element when modal closes
      if (previousActiveElement) {
        previousActiveElement.focus();
      }
    };
  }, [containerRef, isActive]);
}

/**
 * Manages focus for a list of items with keyboard navigation
 * @param itemsRef - Array of refs to the items
 * @param isActive - Whether keyboard navigation is active
 */
export function useListNavigation(itemsRef: React.RefObject<HTMLElement[]>, isActive: boolean = true) {
  React.useEffect(() => {
    if (!isActive || !itemsRef.current) return;
    
    const items = itemsRef.current;
    
    function handleKeyDown(e: KeyboardEvent) {
      const currentIndex = items.findIndex(item => item === document.activeElement);
      if (currentIndex === -1) return;
      
      let nextIndex;
      
      switch (e.key) {
        case 'ArrowDown':
          nextIndex = (currentIndex + 1) % items.length;
          e.preventDefault();
          break;
        case 'ArrowUp':
          nextIndex = (currentIndex - 1 + items.length) % items.length;
          e.preventDefault();
          break;
        case 'Home':
          nextIndex = 0;
          e.preventDefault();
          break;
        case 'End':
          nextIndex = items.length - 1;
          e.preventDefault();
          break;
        default:
          return;
      }
      
      items[nextIndex].focus();
    }
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [itemsRef, isActive]);
}

/**
 * Announces messages to screen readers using ARIA live regions
 * @param message - Message to announce
 * @param priority - Priority of the announcement (polite or assertive)
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  // Create or get existing live region
  let liveRegion = document.getElementById(`aria-live-${priority}`);
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = `aria-live-${priority}`;
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-relevant', 'additions');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  
  // Update the live region to trigger announcement
  liveRegion.textContent = '';
  // Use setTimeout to ensure the DOM update is recognized as a change
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 50);
}

/**
 * Hook to manage focus when a component mounts
 * @param ref - Reference to the element to focus
 * @param shouldFocus - Whether the element should be focused
 */
export function useFocusOnMount(ref: React.RefObject<HTMLElement>, shouldFocus: boolean = true) {
  React.useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus();
    }
  }, [ref, shouldFocus]);
}