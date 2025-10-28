"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MfaVerification from "@/components/auth/MfaVerification";
import { useToast } from "@/contexts/ToastContext";
import { loginFormSchema, validateForm } from "@/lib/form-validation";
import FormErrorAnnouncer from "@/components/ui/FormErrorAnnouncer";
import { announceToScreenReader } from "@/lib/focus-management";

// Import the authentication context
import { useAuth } from "@/contexts/AuthContext";
import { signIn } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  // Focus on email input when component mounts
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
    
    // Add the background animation effect
    document.body.classList.add('login-page');
    
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);
  
  // Announce loading state changes to screen readers
  useEffect(() => {
    if (isLoading) {
      announceToScreenReader("Logging in, please wait...");
    }
  }, [isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form inputs
    const validation = validateForm(loginFormSchema, { email, password });
    
    if (!validation.success) {
      setErrors(validation.errors || {});
      // Announce validation errors to screen readers
      const errorMessages = Object.values(validation.errors || {}).join('. ');
      if (errorMessages) {
        announceToScreenReader(`Form has errors: ${errorMessages}`);
      }
      return;
    }
    
    setIsLoading(true);
    announceToScreenReader("Logging in, please wait...");

    try {
      // Use the context login which now supports MFA
      const result = await login(email, password);
      
      // If MFA is required, redirect to MFA verification page
      if (result.requiresMfa) {
        announceToScreenReader("Multi-factor authentication required. Redirecting to verification page.");
        router.push(`/login/mfa?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
        return;
      }
      
      if (!result.success) {
        setErrors({ _form: result.error || "Invalid email or password." });
        showToast('Login failed. Please check your credentials.', 'error');
        announceToScreenReader("Login failed. Please check your credentials.");
      } else {
        showToast('Login successful!', 'success');
        announceToScreenReader("Login successful! Redirecting to dashboard.");
      }
      // Login success is handled by the AuthContext (redirect)
      
    } catch (err) {
      setErrors({ _form: "An error occurred during login. Please try again." });
      showToast('Login failed. Please try again.', 'error');
      announceToScreenReader("An error occurred during login. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to extract factor ID from error
  const extractFactorId = (error: any): string | null => {
    // This is a simplified example - adjust based on actual Supabase MFA error format
    if (error?.message?.includes('factor_id')) {
      const match = error.message.match(/factor_id[:=]\s*["']?([^"']+)["']?/);
      return match ? match[1] : null;
    }
    return null;
  };
  
  // Handle MFA verification success
  const handleMfaSuccess = async () => {
    // After MFA verification, the session should be established
    // Refresh the auth state and redirect
    announceToScreenReader("Verifying multi-factor authentication...");
    const result = await login(email, password);
    if (!result.success) {
      setErrors({ _form: result.error || "Authentication failed after MFA verification." });
      announceToScreenReader("Authentication failed after MFA verification.");
    } else {
      announceToScreenReader("Authentication successful! Redirecting to dashboard.");
    }
  };
  
  // Cancel MFA verification
  const handleMfaCancel = () => {
    setMfaFactorId(null);
    announceToScreenReader("Multi-factor authentication cancelled.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background with dark blue gradient and subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 z-0">
        {/* Animated subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0,_transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(45deg,_transparent_25%,_rgba(255,255,255,0.1)_25%,_rgba(255,255,255,0.1)_50%,_transparent_50%,_transparent_75%,_rgba(255,255,255,0.1)_75%)]" style={{backgroundSize: '20px 20px'}}></div>
      </div>
      
      {/* Content */}
      <div className="w-full max-w-md z-10 relative">
        <Link 
          href="/" 
          className="flex items-center justify-center mb-8 text-white hover:text-blue-200 transition-colors"
        >
          <span className="text-3xl font-bold drop-shadow-md">MetroErrandCo</span>
        </Link>
        
        {mfaFactorId ? (
          <MfaVerification 
            factorId={mfaFactorId}
            onSuccess={handleMfaSuccess}
            onCancel={handleMfaCancel}
          />
        ) : (
          <Card className="backdrop-blur-sm bg-white/10 border border-white/20 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-white text-2xl">Welcome Back</CardTitle>
              <CardDescription className="text-center text-blue-100">
                Access your dashboard to manage errands.
              </CardDescription>
            </CardHeader>
            
            <form id="login-form" onSubmit={handleLogin}>
              <CardContent className="space-y-5 pt-2">
                {/* Screen reader announcer for form errors */}
                <FormErrorAnnouncer errors={errors} formId="login-form" />
                
                {errors._form && (
                  <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-white">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors._form}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-100">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    ref={emailInputRef}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-300 focus:ring-blue-300"
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-red-300 mt-1">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-blue-100">Password</Label>
                    <Link 
                      href="/auth/forgot-password" 
                      className="text-sm text-blue-200 hover:text-white transition-colors"
                      aria-label="Forgot password? Reset it here"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    required
                    className="bg-white/10 border-white/20 text-white focus:border-blue-300 focus:ring-blue-300"
                  />
                  {errors.password && (
                    <p id="password-error" className="text-sm text-red-300 mt-1">{errors.password}</p>
                  )}
                </div>
                
                <div className="text-sm text-center mt-4">
                  <span className="text-blue-200">Don't have an account? </span>
                  <Link href="/auth/signup" className="text-white hover:text-blue-300 font-medium transition-colors">
                    Sign up
                  </Link>
                </div>
              </CardContent>
              
              <CardFooter className="pb-6">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/20"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  aria-label={isLoading ? "Logging in, please wait" : "Log in to your account"}
                  isLoading={isLoading}
                  loadingText="Logging in..."
                >
                  {isLoading ? "Logging in..." : "Log in"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
