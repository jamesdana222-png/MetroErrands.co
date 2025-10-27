import React from 'react';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  id?: string;
  as?: keyof JSX.IntrinsicElements;
  role?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  className?: string;
}

/**
 * Component for content that should only be visible to screen readers
 * Enhanced with additional accessibility attributes
 */
const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ 
  children, 
  id, 
  as: Component = 'span',
  role,
  'aria-live': ariaLive,
  'aria-atomic': ariaAtomic,
  className = '',
  ...props
}) => {
  return (
    <Component
      className={`sr-only ${className}`}
      id={id}
      role={role}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      {...props}
    >
      {children}
    </Component>
  );
};

export default ScreenReaderOnly;