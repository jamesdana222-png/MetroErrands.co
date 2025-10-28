'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

function EmailConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token from the URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (!token || type !== 'email_confirmation') {
          setStatus('error');
          setMessage('Invalid verification link. Please request a new one.');
          return;
        }

        // Verify the email with Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });

        if (error) {
          setStatus('error');
          setMessage(`Verification failed: ${error.message}`);
          return;
        }

        setStatus('success');
        setMessage('Email verified successfully! You can now log in.');
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again later.');
        console.error('Email verification error:', error);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            Confirm your email address to complete registration
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-4">
          {status === 'loading' && (
            <div className="animate-pulse">
              <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-blue-400"></div>
              </div>
            </div>
          )}
          {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
          {status === 'error' && <AlertCircle className="h-12 w-12 text-red-500" />}
          
          <p className={`mt-4 text-center ${status === 'error' ? 'text-red-500' : ''}`}>
            {message}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => router.push('/login')}
            className="w-full"
          >
            {status === 'success' ? 'Go to Login' : 'Back to Login'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function EmailConfirmPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <EmailConfirmContent />
    </Suspense>
  );
}
