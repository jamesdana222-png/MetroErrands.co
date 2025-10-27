'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function MFASetupPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    const checkMfaStatus = async () => {
      try {
        setIsLoading(true);
        
        // Check if MFA is already enabled for this user
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        
        if (factorsError) {
          throw factorsError;
        }
        
        const totpFactor = factors.totp.find(factor => factor.status === 'verified');
        
        if (totpFactor) {
          setIsMfaEnabled(true);
        } else {
          // Generate new TOTP secret
          const { data, error: enrollError } = await supabase.auth.mfa.enroll({
            factorType: 'totp'
          });
          
          if (enrollError) {
            throw enrollError;
          }
          
          setQrCode(data.totp.qr_code);
          setSecret(data.totp.secret);
        }
      } catch (err) {
        console.error('MFA setup error:', err);
        setError('Failed to set up MFA. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkMfaStatus();
  }, []);

  const verifyTotp = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      
      if (!verificationCode.trim()) {
        setError('Please enter the verification code');
        return;
      }
      
      const { data, error: verifyError } = await supabase.auth.mfa.challenge({
        factorId: 'totp',
        code: verificationCode
      });
      
      if (verifyError) {
        throw verifyError;
      }
      
      const { data: verifyData, error: challengeError } = await supabase.auth.mfa.verify({
        factorId: 'totp',
        challengeId: data.id,
        code: verificationCode
      });
      
      if (challengeError) {
        throw challengeError;
      }
      
      // Generate recovery codes
      const { data: recData, error: recError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (recError) {
        throw recError;
      }
      
      setIsMfaEnabled(true);
      setShowRecoveryCodes(true);
      setRecoveryCodes(recData.recovery_codes || []);
      
      // Update user in context
      await refreshUser();
      
      toast({
        title: "MFA Enabled",
        description: "Two-factor authentication has been successfully enabled for your account.",
        variant: "default",
      });
    } catch (err: any) {
      console.error('MFA verification error:', err);
      setError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const disableMfa = async () => {
    try {
      setIsVerifying(true);
      
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        throw factorsError;
      }
      
      const totpFactor = factors.totp.find(factor => factor.status === 'verified');
      
      if (totpFactor) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: totpFactor.id
        });
        
        if (unenrollError) {
          throw unenrollError;
        }
        
        setIsMfaEnabled(false);
        
        // Update user in context
        await refreshUser();
        
        toast({
          title: "MFA Disabled",
          description: "Two-factor authentication has been disabled for your account.",
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error('MFA disable error:', err);
      setError(err.message || 'Failed to disable MFA. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            {isMfaEnabled 
              ? 'Manage your two-factor authentication settings' 
              : 'Enhance your account security with two-factor authentication'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isMfaEnabled && !showRecoveryCodes ? (
            <div className="flex flex-col items-center space-y-4">
              <ShieldCheck className="h-16 w-16 text-green-500" />
              <p className="text-center">
                Two-factor authentication is currently enabled for your account.
              </p>
            </div>
          ) : showRecoveryCodes ? (
            <div className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTitle>Save your recovery codes</AlertTitle>
                <AlertDescription>
                  Store these recovery codes in a secure place. They can be used to regain access to your account if you lose your authenticator device.
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="mb-1">{code}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                {qrCode && (
                  <div className="bg-white p-4 rounded-md">
                    <div dangerouslySetInnerHTML={{ __html: qrCode }} />
                  </div>
                )}
                
                {secret && (
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">If you can't scan the QR code, enter this code manually:</p>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{secret}</code>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {isMfaEnabled && !showRecoveryCodes ? (
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={disableMfa}
              disabled={isVerifying}
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable Two-Factor Authentication
            </Button>
          ) : showRecoveryCodes ? (
            <Button 
              className="w-full" 
              onClick={() => router.push('/settings')}
            >
              Done
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={verifyTotp}
              disabled={isVerifying}
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify and Enable
            </Button>
          )}
          
          {!showRecoveryCodes && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push('/settings')}
            >
              Back to Settings
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}