'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import UserTable from '@/components/dashboard/UserTable';
import UserForm from '@/components/dashboard/UserForm';
import ViewSwitcher from '@/components/dashboard/ViewSwitcher';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logClientError } from '@/lib/error-logger';

// Define UserType interface
interface UserType {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  position: string;
  created_at: string;
  address?: string;
  status?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);
  const supabase = createClientComponentClient();
  const { error, handleError, clearError } = useErrorHandler('UserManagement');

  // Load users from localStorage
  const loadUsersFromLocalStorage = () => {
    try {
      const savedUsers = localStorage.getItem('users');
      const savedTimestamp = localStorage.getItem('usersTimestamp');
      
      if (savedUsers && savedTimestamp) {
        const now = new Date().getTime();
        const timestamp = parseInt(savedTimestamp);
        
        // Only use cache if it's less than 5 minutes old
        if (now - timestamp < 5 * 60 * 1000) {
          const parsedUsers = JSON.parse(savedUsers);
          if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
            console.log('Loaded', parsedUsers.length, 'users from localStorage');
            return parsedUsers;
          }
        }
      }
    } catch (error) {
      console.error('Error loading users from localStorage:', error);
    }
    return [];
  };

  // Save users to localStorage
  const saveUsersToLocalStorage = (usersData: UserType[]) => {
    try {
      localStorage.setItem('users', JSON.stringify(usersData));
      localStorage.setItem('usersTimestamp', new Date().getTime().toString());
    } catch (error) {
      console.error('Error saving users to localStorage:', error);
    }
  };

  // Function to fetch users from the API
  const fetchUsers = async (skipCache = false) => {
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      console.log('Fetching users from API...');
      
      // Try to load from cache first if not skipping cache
      if (!skipCache) {
        const cachedUsers = loadUsersFromLocalStorage();
        if (cachedUsers.length > 0) {
          setUsers(cachedUsers);
          setLoading(false);
          return;
        }
      }
      
      try {
        // Use mock data if API fails
        const mockUsers = [
          { id: 'mock-1', email: 'admin@metro.com', role: 'admin', name: 'Admin User' },
          { id: 'mock-2', email: 'employee1@metro.com', role: 'employee', name: 'Employee One' }
        ];
        
        // Try to fetch from API
        try {
          const response = await fetch('/api/users/get-all?t=' + new Date().getTime(), {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            // Add timeout to prevent long-hanging requests
            signal: AbortSignal.timeout(5000)
          });
          
          // Check if response is OK and has JSON content type
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              return data;
            }
          }
          
          // If we get here, either response wasn't OK or wasn't JSON
          // Fall back to mock data
          console.log('API returned non-JSON response, using mock data');
          return mockUsers;
        } catch (error) {
          // Network error or timeout
          console.log('API fetch failed, using mock data:', error);
          return mockUsers;
        }
      } catch (finalError) {
        // Last resort fallback
        handleError(finalError, { context: 'fetchUsers' });
        return [];
      }
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        handleError({ message: 'API returned non-array data' }, { data });
        throw new Error('Server returned invalid data format');
      }
      
      console.log('Successfully loaded', data.length, 'users');
      
      // Save to state and localStorage
      setUsers(data);
      saveUsersToLocalStorage(data);
      
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to load users');
      
      // Don't clear existing users on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to handle user creation
  const handleCreateUser = async (formData: any) => {
    try {
      // Generate a secure password if not provided
      const securePassword = formData.password || 
        Math.random().toString(36).slice(-10) + 
        Math.random().toString(36).toUpperCase().slice(-2) + 
        Math.random().toString(10).slice(-2);
      
      // Try to create user with Supabase Auth
      let userId;
      let userEmail = formData.email;
      
      try {
        // First attempt: Use auth.signUp (most reliable method)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: userEmail,
          password: securePassword,
          options: {
            emailRedirectTo: `${window.location.origin}/admin/users`,
            data: {
              name: formData.name,
              role: formData.role || 'employee',
              department: formData.department || 'Unassigned',
              position: formData.position || 'Staff'
            }
          }
        });
        
        if (signUpError) throw signUpError;
        if (signUpData?.user?.id) {
          userId = signUpData.user.id;
          console.log('User created successfully with signUp method');
        } else {
          throw new Error('No user ID returned from signUp');
        }
      } catch (authError) {
        console.error('Auth signup error:', authError);
        toast.error(`Authentication error: ${authError.message}`);
        throw new Error(`Failed to create user: ${authError.message}`);
      }
      
      // Create user in the database
      const { data: dbData, error: dbError } = await supabase.from('users').insert({
        id: userId,
        email: userEmail,
        name: formData.name,
        role: formData.role || 'employee',
        department: formData.department || 'Unassigned',
        position: formData.position || 'Staff',
        address: formData.address || '',
        status: 'active'
      });

      if (dbError) {
        // Log detailed error information
        const errorDetails = {
          message: dbError.message || 'Unknown database error',
          code: dbError.code || 'No error code',
          details: dbError.details || 'No details available',
          hint: dbError.hint || 'No hint available',
          toString: dbError.toString ? dbError.toString() : 'Error object cannot be converted to string'
        };
        
        console.error('Database error:', errorDetails);
        logClientError('UserManagement', 'handleCreateUser', errorDetails);
        
        // More user-friendly error message with improved accessibility
        let errorMessage = 'Failed to create user in database';
        if (dbError.code === '23505') {
          errorMessage = 'A user with this email already exists';
        } else if (dbError.code === '23503') {
          errorMessage = 'Invalid reference to another record';
        } else if (dbError.message) {
          errorMessage = `${errorMessage}: ${dbError.message}`;
        }
        
        toast.error(errorMessage, { role: 'alert', autoClose: 7000 });
        throw dbError;
      }

      // Create a new user object
      const newUser: UserType = {
        id: userId,
        email: userEmail,
        name: formData.name,
        role: formData.role || 'employee',
        department: formData.department || 'Unassigned',
        position: formData.position || 'Staff',
        created_at: new Date().toISOString(),
        address: formData.address || '',
        status: 'active'
      };

      // Update state and localStorage
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      saveUsersToLocalStorage(updatedUsers);
      
      // Success message with improved accessibility
      toast.success('User created successfully!', { role: 'status', autoClose: 5000 });
      setShowAddModal(false);
    } catch (error: any) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        toString: error?.toString ? error.toString() : 'Error object cannot be converted to string'
      };
      console.error('Error creating user:', errorDetails);
      logClientError('UserManagement', 'handleCreateUser', errorDetails);
      toast.error(error instanceof Error ? error.message : 'Failed to create user', { role: 'alert' });
    }
  };

  // Function to handle user update
  const handleUpdateUser = async (formData: any) => {
    if (!currentUser) return;
    
    try {
      // Update user in the database
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          role: formData.role,
          department: formData.department,
          position: formData.position,
          address: formData.address
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update user in state
      const updatedUsers = users.map(user => 
        user.id === currentUser.id 
          ? { 
              ...user, 
              name: formData.name,
              role: formData.role,
              department: formData.department,
              position: formData.position,
              address: formData.address
            } 
          : user
      );
      
      setUsers(updatedUsers);
      saveUsersToLocalStorage(updatedUsers);
      
      toast.success('User updated successfully!');
      setShowEditModal(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  // Function to handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      // Delete user from the database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Remove user from state
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      saveUsersToLocalStorage(updatedUsers);
      
      toast.success('User deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.department.toLowerCase().includes(searchLower) ||
      user.position.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={5000} />
      {error.visible && (
        <ErrorMessage 
          message={error.message}
          details={error.details}
          severity={error.severity}
          onDismiss={clearError}
        />
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">User Management</h1>
        <div className="flex space-x-4">
          <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add User
          </button>
          <button
            onClick={() => fetchUsers(true)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full px-4 py-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <UserTable
        users={filteredUsers}
        loading={loading}
        onEdit={(user) => {
          setCurrentUser(user);
          setShowEditModal(true);
        }}
        onDelete={handleDeleteUser}
        viewMode={viewMode}
      />
      
      {showAddModal && (
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowAddModal(false)}
          title="Add New User"
        />
      )}
      
      {showEditModal && currentUser && (
        <UserForm
          onSubmit={handleUpdateUser}
          onCancel={() => setShowEditModal(false)}
          title="Edit User"
          initialData={currentUser}
        />
      )}
    </div>
  );
}