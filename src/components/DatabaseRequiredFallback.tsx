'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function DatabaseRequiredFallback({ pageName }: { pageName: string }) {
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  
  useEffect(() => {
    // Check if Supabase is configured
    const hasSupabaseConfig = 
      typeof window !== 'undefined' && 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setIsSupabaseConfigured(!!hasSupabaseConfig);
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <h1 className="text-2xl font-bold mb-4">Database Configuration Required</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          The {pageName} page requires Supabase credentials to be configured in your environment variables.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 max-w-md">
          <p className="text-sm text-yellow-800">
            Please add the following environment variables to your Render dashboard:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-yellow-800">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>SUPABASE_SERVICE_ROLE_KEY</li>
          </ul>
        </div>
      </div>
    );
  }

  // This will only render on the client side when Supabase is configured
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <span className="ml-2">Loading {pageName}...</span>
    </div>
  );
}