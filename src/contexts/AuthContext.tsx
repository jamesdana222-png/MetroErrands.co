'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signIn, signOut, getCurrentUser, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { initDb, isDatabaseInitialized, getDatabaseInitializationError } from '@/lib/db-init';

// Define the shape of our auth context
type User = {
  id: string;
  email: string;
  role: string;
  mfaEnabled?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  dbInitialized: boolean;
  dbError: string | null;
  login: (email: string, password: string, totpCode?: string) => Promise<{ success: boolean; error?: string; requiresMfa?: boolean }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
type AuthProviderProps = {
  children: ReactNode;
};

// Create the provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // Session timeout constants
  const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

  // Check if the current path is a login page
  const isLoginPage = pathname?.includes('/login');

  // Function to check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      // Don't set loading state for the home page to prevent flashing
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
      if (!isHomePage) {
        setIsLoading(true);
      }
      
      const { user: currentUser, error } = await getCurrentUser();
      
      if (error || !currentUser) {
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
      
      setUser({
        id: currentUser.id,
        email: currentUser.email ?? '',
        role: currentUser.role ?? 'employee'
      });
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      if (window.location.pathname !== '/' && window.location.pathname !== '') {
        setIsLoading(false);
      }
    }
  };

  // Reset session timeouts
  const resetSessionTimeouts = () => {
    // Clear existing timeout
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }
    
    // Set new idle timeout
    const timeout = setTimeout(() => {
      console.log('Session expired due to inactivity');
      logout();
    }, IDLE_TIMEOUT);
    
    setSessionTimeout(timeout);
  };
  
  // Initialize session timeouts
  const initializeSessionTimeouts = () => {
    // Set idle timeout
    resetSessionTimeouts();
    
    // Set absolute session timeout
    setTimeout(() => {
      console.log('Session expired due to maximum session length');
      logout();
    }, ABSOLUTE_TIMEOUT);
  };
  
  // Add event listeners for user activity
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize timeouts when user is authenticated
      initializeSessionTimeouts();
      
      // Add event listeners for user activity
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Cleanup function
      return () => {
        if (sessionTimeout) {
          clearTimeout(sessionTimeout);
        }
        events.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
      };
    }
  }, [isAuthenticated]);
  
  // Handle user activity to reset idle timeout
  const handleUserActivity = () => {
    if (isAuthenticated) {
      resetSessionTimeouts();
    }
  };
  
  // Add event listeners for user activity
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize timeouts when user is authenticated
      initializeSessionTimeouts();
      
      // Add event listeners for user activity
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Cleanup function
      return () => {
        if (sessionTimeout) {
          clearTimeout(sessionTimeout);
        }
        events.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
      };
    }
  }, [isAuthenticated]);
  
  // Login function
  const login = async (email: string, password: string, totpCode?: string) => {
    try {
      // If Supabase is temporarily disabled, return a friendly error
      if (!isSupabaseConfigured() || !supabase) {
        return {
          success: false,
          error: 'Authentication is temporarily unavailable while we complete deployment. Please try again later.'
        };
      }
      // Validate inputs
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }
      
      setIsLoading(true);
      const { data, error } = await signIn(email, password);
      
      if (error || !data?.user) {
        return { 
          success: false, 
          error: error?.message || 'Login failed. Please check your credentials.' 
        };
      }
      
      // Check if email is verified
      if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
        return {
          success: false,
          error: 'Please verify your email before logging in.'
        };
      }
      
      // Check if MFA is required (guarded)
      let mfaData: any = null;
      if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        mfaData = data;
      }
      
      // If MFA is required but no TOTP code provided, return early
      if (mfaData && mfaData.currentLevel !== 'aal2' && mfaData.nextLevel === 'aal2' && !totpCode) {
        return { 
          success: false,
          requiresMfa: true,
          error: 'MFA verification required'
        };
      }
      
      // If TOTP code is provided, verify it
      if (totpCode && isSupabaseConfigured() && supabase) {
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: 'totp'
        });
        
        if (challengeError) {
          return {
            success: false,
            error: challengeError.message
          };
        }
        
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: 'totp',
          challengeId: challengeData.id,
          code: totpCode
        });
        
        if (verifyError) {
          return {
            success: false,
            error: 'Invalid MFA code'
          };
        }
      }
      
      // Get user role from database
      let dbRole: string | undefined = undefined;
      if (isSupabaseConfigured() && supabase) {
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (roleError) {
          console.error('Error fetching user role:', roleError);
        }
        dbRole = userData?.role;
      }
      
      // Check if MFA is enabled for this user
      let mfaEnabled = false;
      if (isSupabaseConfigured() && supabase) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        mfaEnabled = !!factors && Array.isArray(factors.totp) && factors.totp.some(factor => factor.status === 'verified');
      }
      
      // Set user data
      const userInfo = {
        id: data.user.id,
        email: data.user.email ?? '',
        role: dbRole || data.user.user_metadata?.role || 'customer',
        mfaEnabled
      };
      
      setUser(userInfo);
      setIsAuthenticated(true);
      
      // Initialize session timeouts
      initializeSessionTimeouts();
      
      // Redirect based on role with validation
      const role = userInfo.role;
      if (role === 'admin') {
        router.push('/admin/users');
      } else if (role === 'employee') {
        router.push('/employee/dashboard');
      } else if (role === 'customer') {
        router.push('/profile');
      } else {
        // Handle unknown roles
        console.warn('Unknown user role detected:', role);
        router.push('/profile'); // Default to profile
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'An unexpected error occurred. Please try again later.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication and initialize database on initial load and path changes
  useEffect(() => {
    const initAuth = async () => {
      // Skip auth check for home page to prevent redirection
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
      
      // Only check authentication if not on home page
      const isAuthed = isHomePage ? isAuthenticated : await checkAuth();
      
      // Initialize database if authenticated and Supabase is configured
      if (isAuthed && isSupabaseConfigured()) {
        try {
          await initDb();
          setDbInitialized(true);
          setDbError(null);
          
          // Initialize session timeouts
          resetSessionTimeouts();
          
          // Set absolute session timeout
          setTimeout(() => {
            console.log('Session expired due to maximum session length');
            logout();
          }, ABSOLUTE_TIMEOUT);
        } catch (error) {
          console.error('Database initialization error:', error);
          setDbError(error instanceof Error ? error.message : 'Unknown database error');
        }
      }
      
      // Check if we need to redirect to login, but skip for home page
      if (!isAuthed && !isLoginPage && !isHomePage) {
        router.push('/login');
      }
      
      // For home page, just set loading to false without checking auth
      if (isHomePage) {
        setIsLoading(false);
      }
    };
    
    initAuth();
    
    // Set up event listeners for user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Clean up event listeners
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      
      // Clear any timeouts
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, [pathname]);

  // Provide the auth context to children
  // Function to refresh user data
  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const { user: currentUser, error } = await getCurrentUser();
      
      if (error || !currentUser) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      
      // Check if MFA is enabled for this user (guarded for disabled Supabase)
      let mfaEnabled = false;
      if (isSupabaseConfigured() && supabase) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        mfaEnabled = !!factors && Array.isArray(factors.totp) && factors.totp.some(factor => factor.status === 'verified');
      }
      
      setUser({
        id: currentUser.id,
        email: currentUser.email ?? '',
        role: currentUser.role ?? 'employee',
        mfaEnabled
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('User refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        dbInitialized,
        dbError,
        login,
        logout,
        checkAuth,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
