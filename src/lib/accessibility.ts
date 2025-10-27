/**
 * Accessibility utilities for ensuring WCAG 2.2 AA compliance
 */

/**
 * Color contrast utilities
 * WCAG 2.2 AA requires a contrast ratio of at least:
 * - 4.5:1 for normal text (less than 18pt or 14pt bold)
 * - 3:1 for large text (at least 18pt or 14pt bold)
 * - 3:1 for UI components and graphical objects
 */

// Color contrast ratio calculation
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    let r, g, b;
    
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      r = parseInt(hex.substring(0, 2), 16) / 255;
      g = parseInt(hex.substring(2, 4), 16) / 255;
      b = parseInt(hex.substring(4, 6), 16) / 255;
    } else if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return 0;
      r = parseInt(rgb[0]) / 255;
      g = parseInt(rgb[1]) / 255;
      b = parseInt(rgb[2]) / 255;
    } else {
      return 0; // Unsupported color format
    }
    
    // Adjust for gamma
    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    
    // Calculate luminance
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const luminance1 = getLuminance(foreground);
  const luminance2 = getLuminance(background);
  
  // Calculate contrast ratio
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Check if a color combination meets WCAG AA standards
export function meetsWCAGAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// Get accessible text color based on background
export function getAccessibleTextColor(backgroundColor: string): string {
  const luminance = getContrastRatio(backgroundColor, '#000000');
  return luminance > 3 ? '#000000' : '#FFFFFF';
}

// Accessible color combinations for the application
export const accessibleColors = {
  // Primary colors with accessible text colors
  primary: {
    50: { bg: '#EBF5FF', text: '#000000' },
    100: { bg: '#E1EFFE', text: '#000000' },
    200: { bg: '#C3DDFD', text: '#000000' },
    300: { bg: '#A4CAFE', text: '#000000' },
    400: { bg: '#76A9FA', text: '#000000' },
    500: { bg: '#3F83F8', text: '#FFFFFF' },
    600: { bg: '#1C64F2', text: '#FFFFFF' },
    700: { bg: '#1A56DB', text: '#FFFFFF' },
    800: { bg: '#1E429F', text: '#FFFFFF' },
    900: { bg: '#233876', text: '#FFFFFF' },
  },
  
  // Status colors with accessible text colors
  status: {
    success: { bg: '#0D9488', text: '#FFFFFF' },
    warning: { bg: '#FBBF24', text: '#000000' },
    error: { bg: '#DC2626', text: '#FFFFFF' },
    info: { bg: '#2563EB', text: '#FFFFFF' },
  },
  
  // Neutral colors with accessible text colors
  neutral: {
    50: { bg: '#F9FAFB', text: '#000000' },
    100: { bg: '#F3F4F6', text: '#000000' },
    200: { bg: '#E5E7EB', text: '#000000' },
    300: { bg: '#D1D5DB', text: '#000000' },
    400: { bg: '#9CA3AF', text: '#000000' },
    500: { bg: '#6B7280', text: '#FFFFFF' },
    600: { bg: '#4B5563', text: '#FFFFFF' },
    700: { bg: '#374151', text: '#FFFFFF' },
    800: { bg: '#1F2937', text: '#FFFFFF' },
    900: { bg: '#111827', text: '#FFFFFF' },
  }
};

/**
 * Keyboard accessibility utilities
 */

// Key codes for keyboard navigation
export const KeyCodes = {
  TAB: 'Tab',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  END: 'End',
  HOME: 'Home',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_UP: 'ArrowUp',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_DOWN: 'ArrowDown',
};

// Helper function to check if an element is focusable
export function isFocusable(element: HTMLElement): boolean {
  const nodeName = element.nodeName.toLowerCase();
  const tabIndex = element.getAttribute('tabindex');
  
  // Elements that are natively focusable if not disabled
  if (
    (nodeName === 'button' ||
     nodeName === 'input' ||
     nodeName === 'select' ||
     nodeName === 'textarea' ||
     nodeName === 'a' && !!element.getAttribute('href')) &&
    !element.hasAttribute('disabled')
  ) {
    return true;
  }
  
  // Elements with valid tabindex
  return tabIndex !== null && tabIndex !== '-1';
}

// Get all focusable elements within a container
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(container.querySelectorAll('*'));
  return elements.filter(el => isFocusable(el as HTMLElement)) as HTMLElement[];
}