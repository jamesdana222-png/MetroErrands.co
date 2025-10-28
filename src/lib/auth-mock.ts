/**
 * Mock Authentication System
 * 
 * This file replaces Supabase authentication with a simple mock implementation
 * that works without external dependencies.
 */

// Mock user data
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    department: 'Management',
  },
  {
    id: '2',
    email: 'employee@example.com',
    name: 'Employee User',
    role: 'employee',
    department: 'Operations',
  }
];

// Session storage key
const SESSION_KEY = 'mock_auth_session';

// Types
export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
};

export type Session = {
  user: User | null;
  expires: number; // timestamp
};

// Helper functions
const saveSession = (session: Session) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
};

const getSession = (): Session | null => {
  if (typeof window === 'undefined') return null;
  
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;
  
  try {
    const session = JSON.parse(sessionStr) as Session;
    // Check if session is expired
    if (session.expires < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
};

// Auth functions
export const signIn = async (email: string, password: string) => {
  // Simple mock authentication
  const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return { error: { message: 'Invalid credentials' }, data: null };
  }
  
  // Create session (24 hour expiry)
  const session: Session = {
    user,
    expires: Date.now() + 24 * 60 * 60 * 1000
  };
  
  saveSession(session);
  
  return { data: { session, user }, error: null };
};

export const signUp = async (email: string, password: string, userData: Partial<User>) => {
  // In a real app, this would create a new user
  // For this mock, we'll just pretend it worked
  return { data: { user: null }, error: null };
};

export const signOut = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
  return { error: null };
};

export const getCurrentUser = async () => {
  const session = getSession();
  return { data: { user: session?.user || null }, error: null };
};

// Mock function to check if auth is configured
export const isAuthConfigured = () => true;

// Export a mock object to replace supabase client
export const authClient = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      return signIn(email, password);
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      return signUp(email, password, {});
    },
    signOut: async () => {
      return signOut();
    },
    getSession: async () => {
      const session = getSession();
      return { data: { session }, error: null };
    },
    getUser: async () => {
      const session = getSession();
      return { data: { user: session?.user || null }, error: null };
    },
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({ data: null, error: null }),
      challenge: async () => ({ data: null, error: null }),
      verify: async () => ({ data: null, error: null }),
      listFactors: async () => ({ data: { factors: [] }, error: null }),
      enroll: async () => ({ data: null, error: null }),
      unenroll: async () => ({ data: null, error: null }),
    },
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
      }),
    }),
  }),
};