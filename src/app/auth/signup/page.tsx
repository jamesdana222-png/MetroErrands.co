'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { announceToScreenReader } from '@/lib/focus-management';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  
  // Focus on full name input when component mounts
  useEffect(() => {
    if (fullNameInputRef.current) {
      fullNameInputRef.current.focus();
    }
  }, []);
  
  // Announce loading state changes to screen readers
  useEffect(() => {
    if (isLoading) {
      announceToScreenReader("Creating account, please wait...");
    }
  }, [isLoading]);
  
  // Announce status changes to screen readers
  useEffect(() => {
    if (status === 'success') {
      announceToScreenReader(message || "Registration successful! Please check your email to verify your account.");
    } else if (status === 'error') {
      announceToScreenReader(`Error: ${message}`);
    }
  }, [status, message]);

  const validatePassword = (password: string): boolean => {
    // Minimum 8 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !password || !confirmPassword || !fullName) {
      setStatus('error');
      setMessage('All fields are required');
      announceToScreenReader("Error: All fields are required");
      return;
    }
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      announceToScreenReader("Error: Passwords do not match");
      return;
    }
    
    if (!validatePassword(password)) {
      setStatus('error');
      setMessage('Password must be at least 8 characters and include letters and numbers');
      announceToScreenReader("Error: Password must be at least 8 characters and include letters and numbers");
      return;
    }
    
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    announceToScreenReader("Creating account, please wait...");
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'customer' // Default role for new users
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });
      
      if (error) {
        throw error;
      }
      
      setStatus('success');
      setMessage('Registration successful! Please check your email to verify your account.');
      announceToScreenReader("Registration successful! Please check your email to verify your account.");
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to create account');
      announceToScreenReader(`Error: ${error instanceof Error ? error.message : 'Failed to create account'}`);
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <Link 
          href="/" 
          className="flex items-center justify-center mb-8 text-primary-600 hover:text-primary-700 transition-colors"
        >
          <span className="text-2xl font-bold">MetroErrandCo</span>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>
              Sign up to start using our services
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {status === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              
              {status === 'success' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">{message}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={status === 'success'}
                  ref={fullNameInputRef}
                  aria-invalid={status === 'error' && !fullName}
                  aria-describedby="fullname-requirements"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === 'success'}
                  aria-invalid={status === 'error' && !email}
                  aria-describedby="email-requirements"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={status === 'success'}
                  aria-invalid={status === 'error' && (!password || !validatePassword(password))}
                  aria-describedby="password-requirements"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={status === 'success'}
                  aria-invalid={status === 'error' && (password !== confirmPassword)}
                  aria-describedby="confirm-password-requirements"
                />
              </div>
              
              <div 
                id="password-requirements" 
                className="text-xs text-gray-500"
                aria-live="polite"
              >
                Password must be at least 8 characters and include letters and numbers
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || status === 'success'}
                aria-busy={isLoading}
                aria-label={isLoading ? "Creating account, please wait" : "Create your account"}
                isLoading={isLoading}
                loadingText="Creating Account..."
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
              
              <div className="text-sm text-center mt-2">
                <span className="text-gray-500">Already have an account? </span>
                <Link href="/login" className="text-primary-600 hover:text-primary-700">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}