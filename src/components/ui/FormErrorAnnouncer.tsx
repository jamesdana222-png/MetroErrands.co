'use client';

import React, { useEffect, useState } from 'react';

interface FormErrorAnnouncerProps {
  errors: Record<string, string> | null;
  formId: string;
}

/**
 * Component that announces form errors to screen readers
 * Uses an ARIA live region to announce errors when they occur
 */
const FormErrorAnnouncer: React.FC<FormErrorAnnouncerProps> = ({ 
  errors, 
  formId 
}) => {
  const [announcement, setAnnouncement] = useState<string>('');

  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) {
      return;
    }

    // Create a message that lists all errors
    const errorCount = Object.keys(errors).length;
    const errorList = Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('. ');

    const announcementText = `Form submission has ${errorCount} ${
      errorCount === 1 ? 'error' : 'errors'
    }. ${errorList}`;

    // Set the announcement text which will be read by screen readers
    setAnnouncement(announcementText);

    // Clear the announcement after it's been read
    const timer = setTimeout(() => {
      setAnnouncement('');
    }, 5000);

    return () => clearTimeout(timer);
  }, [errors]);

  if (!announcement) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      aria-relevant="additions text"
      className="sr-only"
      id={`${formId}-error-announcer`}
    >
      {announcement}
    </div>
  );
};

export default FormErrorAnnouncer;