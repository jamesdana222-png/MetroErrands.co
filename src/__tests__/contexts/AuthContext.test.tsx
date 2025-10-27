import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { signIn, signOut, getCurrentUser } from '@/lib/supabase';

// Mock the supabase functions
jest.mock('@/lib/supabase', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  getCurrentUser: jest.fn(),
  supabase: {
    auth: {
      mfa: {
        getAuthenticatorAssuranceLevel: jest.fn(),
        challenge: jest.fn(),
        verify: jest.fn()
      }
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}));

// Mock the db-init functions
jest.mock('@/lib/db-init', () => ({
  initDb: jest.fn().mockResolvedValue(true),
  isDatabaseInitialized: jest.fn().mockReturnValue(true),
  getDatabaseInitializationError: jest.fn().mockReturnValue(null)
}));

// Test component that uses the auth context
function TestComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="auth-state">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-email">{user?.email || 'No User'}</div>
      <button 
        data-testid="login-button" 
        onClick={() => login('test@example.com', 'password123')}
      >
        Login
      </button>
      <button 
        data-testid="logout-button" 
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getCurrentUser to return no user by default
    (getCurrentUser as jest.Mock).mockResolvedValue({
      user: null,
      error: null
    });
  });
  
  it('should provide initial unauthenticated state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially loading
    expect(screen.getByTestId('loading-state').textContent).toBe('Loading');
    
    // After auth check completes
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Not Loading');
      expect(screen.getByTestId('auth-state').textContent).toBe('Not Authenticated');
      expect(screen.getByTestId('user-email').textContent).toBe('No User');
    });
  });
  
  it('should handle successful login', async () => {
    // Mock successful login
    (signIn as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user123',
          email: 'test@example.com',
          role: 'user'
        }
      },
      error: null
    });
    
    // Mock MFA not required
    (supabase.auth.mfa.getAuthenticatorAssuranceLevel as jest.Mock).mockResolvedValue({
      data: {
        currentLevel: 'aal1',
        nextLevel: 'aal1'
      }
    });
    
    // Mock user role from database
    (supabase.from().select().eq().single as jest.Mock).mockResolvedValue({
      data: { role: 'user' },
      error: null
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Not Loading');
    });
    
    // Click login button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Verify login function was called
    expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // After successful login
    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('Authenticated');
      expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
    });
  });
  
  it('should handle login failure', async () => {
    // Mock failed login
    (signIn as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Not Loading');
    });
    
    // Click login button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Verify login function was called
    expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // After failed login, state should remain unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('Not Authenticated');
      expect(screen.getByTestId('user-email').textContent).toBe('No User');
    });
  });
  
  it('should handle logout', async () => {
    // Mock initial authenticated state
    (getCurrentUser as jest.Mock).mockResolvedValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        role: 'user'
      },
      error: null
    });
    
    // Mock successful logout
    (signOut as jest.Mock).mockResolvedValue({
      error: null
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete with authenticated user
    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('Authenticated');
      expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
    });
    
    // Click logout button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('logout-button'));
    
    // Verify logout function was called
    expect(signOut).toHaveBeenCalled();
    
    // After logout, state should be unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('Not Authenticated');
      expect(screen.getByTestId('user-email').textContent).toBe('No User');
    });
  });
  
  it('should handle MFA requirement during login', async () => {
    // Mock successful initial auth but MFA required
    (signIn as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user123',
          email: 'test@example.com',
          role: 'user',
          email_confirmed_at: new Date().toISOString()
        }
      },
      error: null
    });
    
    // Mock MFA required
    (supabase.auth.mfa.getAuthenticatorAssuranceLevel as jest.Mock).mockResolvedValue({
      data: {
        currentLevel: 'aal1',
        nextLevel: 'aal2'
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Not Loading');
    });
    
    // Click login button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Verify login function was called
    expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // After login with MFA required, state should remain unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('Not Authenticated');
    });
  });
});