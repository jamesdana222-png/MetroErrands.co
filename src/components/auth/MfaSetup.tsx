'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface MfaSetupProps {
  onComplete?: () => void;
}

export default function MfaSetup({ onComplete }: MfaSetupProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);

  // Step 1: Enroll MFA
  const enrollMfa = async () => {
    try {
      setStatus('loading');
      setMessage('Setting up MFA...');

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        throw error;
      }

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStatus('idle');
        setMessage('');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to set up MFA');
      console.error('MFA enrollment error:', error);
    }
  };

  // Step 2: Verify MFA
  const verifyMfa = async () => {
    if (!factorId || !verificationCode) {
      setStatus('error');
      setMessage('Verification code is required');
      return;
    }

    try {
      setStatus('loading');
      setMessage('Verifying code...');

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      
      if (challengeError) {
        throw challengeError;
      }

      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) {
        throw verifyError;
      }

      setStatus('success');
      setMessage('MFA has been successfully set up!');
      // Notify parent that setup is complete if a callback is provided
      if (typeof onComplete === 'function') {
        try {
          onComplete();
        } catch (cbErr) {
          console.error('Error in onComplete callback:', cbErr);
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to verify MFA code');
      console.error('MFA verification error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Multi-Factor Authentication</CardTitle>
        <CardDescription>
          Enhance your account security with two-factor authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'error' && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === 'success' && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Success</AlertTitle>
            <AlertDescription className="text-green-600">{message}</AlertDescription>
          </Alert>
        )}

        {!qrCode && !secret && (
          <div className="text-center py-4">
            <p className="mb-4">
              Two-factor authentication adds an extra layer of security to your account.
              Once enabled, you'll need your password and a verification code from your
              authenticator app to sign in.
            </p>
            <Button onClick={enrollMfa} disabled={status === 'loading'}>
              {status === 'loading' ? 'Setting up...' : 'Set up MFA'}
            </Button>
          </div>
        )}

        {qrCode && secret && (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="mb-2">Scan this QR code with your authenticator app:</div>
              <div dangerouslySetInnerHTML={{ __html: qrCode }} className="mb-4" />
              <div className="text-sm text-gray-500 mb-2">
                Or enter this code manually in your authenticator app:
              </div>
              <code className="bg-gray-100 p-2 rounded text-sm font-mono mb-4">
                {secret}
              </code>
            </div>

            <div className="space-y-2">
              <label htmlFor="verification-code" className="block text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>
          </div>
        )}
      </CardContent>
      {qrCode && secret && (
        <CardFooter>
          <Button 
            onClick={verifyMfa} 
            className="w-full"
            disabled={!verificationCode || status === 'loading'}
          >
            {status === 'loading' ? 'Verifying...' : 'Verify and Activate'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
