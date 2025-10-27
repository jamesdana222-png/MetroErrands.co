// fetchUsers.ts - Dedicated fetch utility for user data
import { toast } from 'react-toastify';

export interface UserType {
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

export async function fetchUsers(): Promise<UserType[]> {
  console.log('[Frontend] Starting fetchUsers()');
  
  try {
    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    console.log('[Frontend] Fetching from /api/users/get-all');
    const response = await fetch('/api/users/get-all', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Frontend] API error (${response.status}):`, errorText);
      
      // Try to parse error as JSON if possible
      let errorDetail = 'Unknown server error';
      try {
        if (errorText && errorText.includes('{')) {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorJson.details || errorText;
        }
      } catch (e) {
        errorDetail = errorText || `HTTP error: ${response.status}`;
      }
      
      toast.error(`Failed to load users: ${errorDetail}`);
      return [];
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('[Frontend] Invalid content type:', contentType);
      toast.error('Server returned invalid content type. Expected JSON.');
      return [];
    }
    
    // Parse JSON with error handling
    let data;
    try {
      data = await response.json();
      console.log('[Frontend] Successfully parsed JSON response');
    } catch (error) {
      console.error('[Frontend] JSON parse error:', error);
      toast.error('Failed to parse server response');
      return [];
    }
    
    // Validate data is an array
    if (!Array.isArray(data)) {
      console.error('[Frontend] API returned non-array data:', typeof data);
      toast.error('Server returned invalid data format');
      return [];
    }
    
    // Map and validate each user object
    const users = data.map((user: any) => ({
      id: user.id || 'unknown-id',
      email: user.email || 'no-email',
      name: user.name || 'Unknown User',
      role: user.role || 'employee',
      department: user.department || 'Unassigned',
      position: user.position || 'Staff',
      created_at: user.created_at || new Date().toISOString(),
      address: user.address || '',
      status: user.status || 'active'
    }));
    
    console.log(`[Frontend] Successfully loaded ${users.length} users`);
    return users;
    
  } catch (error: any) {
    // Handle fetch errors (network, timeout, etc)
    const errorMessage = error.name === 'AbortError' 
      ? 'Request timed out' 
      : error.message || 'Network error';
      
    console.error('[Frontend] Fetch error:', errorMessage);
    toast.error(`Failed to load users: ${errorMessage}`);
    return [];
  }
}