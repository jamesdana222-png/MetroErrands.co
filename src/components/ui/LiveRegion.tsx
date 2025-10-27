import React, { useState, useEffect } from 'react';

interface LiveRegionProps {
  message: string;
  assertive?: boolean;
  clearAfter?: number; // milliseconds
  id?: string;
}

/**
 * LiveRegion component for dynamic announcements to screen readers
 * 
 * @param message - The message to announce
 * @param assertive - Whether to use assertive (true) or polite (false) announcements
 * @param clearAfter - Time in milliseconds after which to clear the announcement
 * @param id - Optional ID for the element
 */
const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  assertive = false,
  clearAfter = 5000,
  id = 'live-region',
}) => {
  const [announcement, setAnnouncement] = useState(message);

  useEffect(() => {
    // Update announcement when message changes
    setAnnouncement(message);
    
    // Clear announcement after specified time
    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, clearAfter);
      
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      id={id}
      className="sr-only"
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      aria-relevant="additions text"
    >
      {announcement}
    </div>
  );
};

export default LiveRegion;