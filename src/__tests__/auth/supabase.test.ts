import { signIn, signUp, signOut, AuthError } from '@/lib/supabase';

// Mock the supabase client
jest.mock('@/lib/supabase', () => {
  const originalModule = jest.requireActual('@/lib/supabase');
  
  return {
    __esModule: true,
    ...originalModule,
    supabase: {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
    },
    executeWithTimeout: jest.fn().mockImplementation((promise) => promise),
  };
});

// Mock error logging
jest.mock('@/lib/error-utils', () => ({
  logError: jest.fn(),
  handleError: jest.fn((error) => error),
}));

// Import the mocked module
import { supabase, executeWithTimeout } from '@/lib/supabase';

describe('Authentication Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should return error when email is missing', async () => {
      const result = await signIn('', 'password123');
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Email and password are required');
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should return error when password is missing', async () => {
      const result = await signIn('test@example.com', '');
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Email and password are required');
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should handle successful authentication', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com', user_metadata: { role: 'user' } };
      const mockAuthResponse = { data: { user: mockUser, session: {} }, error: null };
      
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockAuthResponse);
      
      const result = await signIn('test@example.com', 'password123');
      
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(executeWithTimeout).toHaveBeenCalled();
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle authentication failure', async () => {
      const mockError = { message: 'Invalid login credentials' };
      const mockAuthResponse = { data: { user: null, session: null }, error: mockError };
      
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockAuthResponse);
      
      const result = await signIn('test@example.com', 'wrong-password');
      
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'wrong-password'
      });
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid login credentials');
    });

    it('should handle unexpected errors', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const result = await signIn('test@example.com', 'password123');
      
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Authentication failed');
    });
  });

  describe('signUp', () => {
    it('should validate email and password', async () => {
      const result = await signUp('', '');
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Email and password are required');
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      const result = await signUp('test@example.com', 'short');
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Password must be at least 8 characters long');
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should handle successful signup', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      const mockSignupResponse = { data: { user: mockUser, session: null }, error: null };
      
      (supabase.auth.signUp as jest.Mock).mockResolvedValue(mockSignupResponse);
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });
      
      const result = await signUp('test@example.com', 'password123');
      
      expect(supabase.auth.signUp).toHaveBeenCalled();
      expect(result.data).toBeDefined();
      expect(result.data?.emailVerification).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should handle signup failure', async () => {
      const mockError = { message: 'Email already registered' };
      const mockSignupResponse = { data: { user: null }, error: mockError };
      
      (supabase.auth.signUp as jest.Mock).mockResolvedValue(mockSignupResponse);
      
      const result = await signUp('existing@example.com', 'password123');
      
      expect(result.error).toBeDefined();
    });
  });

  describe('signOut', () => {
    it('should handle successful signout', async () => {
      const mockSignoutResponse = { error: null };
      (supabase.auth.signOut as jest.Mock).mockResolvedValue(mockSignoutResponse);
      
      const result = await signOut();
      
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(executeWithTimeout).toHaveBeenCalled();
      expect(result.error).toBeUndefined();
    });

    it('should handle signout failure', async () => {
      const mockError = new Error('Session not found');
      (supabase.auth.signOut as jest.Mock).mockRejectedValue(mockError);
      
      const result = await signOut();
      
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Signout failed');
    });
  });
});