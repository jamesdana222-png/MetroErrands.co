'use client';

import { useEffect } from 'react';
import { ReactNode } from 'react';

export default function AuthPageClient({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Check if we have a redirect parameter in the URL
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    
    if (redirect) {
      // Store the redirect URL for after authentication
      sessionStorage.setItem('authRedirect', redirect);
    }
  }, []);

  return <>{children}</>;
}