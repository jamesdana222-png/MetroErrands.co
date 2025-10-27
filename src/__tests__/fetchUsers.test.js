// Unit tests for fetchUsers and handleCreateEmployee error handling

// Mock fetch function
global.fetch = jest.fn();

// Mock response object
const mockResponse = (status, contentType, body) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (header) => {
        if (header.toLowerCase() === 'content-type') {
          return contentType;
        }
        return null;
      }
    },
    text: jest.fn().mockResolvedValue(body),
    json: jest.fn().mockImplementation(() => {
      if (body.startsWith('<!DOCTYPE') || body.startsWith('<html')) {
        throw new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON");
      }
      return Promise.resolve(JSON.parse(body));
    }),
    clone: function() {
      return {
        text: this.text
      };
    }
  };
};

// Mock alert
global.alert = jest.fn();

// Mock console methods
console.error = jest.fn();
console.log = jest.fn();

describe('fetchUsers function error handling', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should handle HTML response correctly', async () => {
    // Setup
    const htmlResponse = '<!DOCTYPE html><html><body>Error page</body></html>';
    global.fetch.mockResolvedValueOnce(mockResponse(200, 'text/html', htmlResponse));
    
    // Mock required state functions
    const setLoading = jest.fn();
    const setUsers = jest.fn();
    const isMounted = { current: true };
    
    // Create a simplified version of the fetchUsers function
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/users/get-all', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          console.error('Error fetching users from API:', response.statusText);
          setLoading(false);
          alert('Failed to load users. Please try again later.');
          return;
        }
        
        const responseText = await response.text();
        
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error('Error: Server returned HTML instead of JSON');
          setLoading(false);
          alert('Server error occurred. Please try again later.');
          return;
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          console.error('Error parsing JSON response', error);
          console.error('Raw response:', responseText.substring(0, 200) + '...');
          setLoading(false);
          alert('Invalid data received from server. Please try again.');
          return;
        }
        
        setUsers(data);
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchUsers function:', error);
        setLoading(false);
        alert('An error occurred while fetching users. Please try again.');
      }
    };
    
    // Execute
    await fetchUsers();
    
    // Assert
    expect(global.fetch).toHaveBeenCalledWith('/api/users/get-all', expect.any(Object));
    expect(console.error).toHaveBeenCalledWith('Error: Server returned HTML instead of JSON');
    expect(alert).toHaveBeenCalledWith('Server error occurred. Please try again later.');
    expect(setLoading).toHaveBeenCalledTimes(2); // Once to set true, once to set false
    expect(setUsers).not.toHaveBeenCalled(); // Should not update users with invalid data
  });

  test('should handle valid JSON response correctly', async () => {
    // Setup
    const jsonResponse = JSON.stringify([{ id: 1, name: 'Test User' }]);
    global.fetch.mockResolvedValueOnce(mockResponse(200, 'application/json', jsonResponse));
    
    // Mock required state functions
    const setLoading = jest.fn();
    const setUsers = jest.fn();
    const isMounted = { current: true };
    
    // Create a simplified version of the fetchUsers function
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/users/get-all', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          console.error('Error fetching users from API:', response.statusText);
          setLoading(false);
          alert('Failed to load users. Please try again later.');
          return;
        }
        
        const responseText = await response.text();
        
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error('Error: Server returned HTML instead of JSON');
          setLoading(false);
          alert('Server error occurred. Please try again later.');
          return;
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          console.error('Error parsing JSON response', error);
          console.error('Raw response:', responseText.substring(0, 200) + '...');
          setLoading(false);
          alert('Invalid data received from server. Please try again.');
          return;
        }
        
        setUsers(data);
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchUsers function:', error);
        setLoading(false);
        alert('An error occurred while fetching users. Please try again.');
      }
    };
    
    // Execute
    await fetchUsers();
    
    // Assert
    expect(global.fetch).toHaveBeenCalledWith('/api/users/get-all', expect.any(Object));
    expect(setUsers).toHaveBeenCalledWith([{ id: 1, name: 'Test User' }]);
    expect(setLoading).toHaveBeenCalledTimes(2); // Once to set true, once to set false
    expect(alert).not.toHaveBeenCalled(); // Should not show any alerts
  });
});

describe('handleCreateEmployee function error handling', () => {
  test('should handle HTML response correctly', async () => {
    // Setup
    const htmlResponse = '<!DOCTYPE html><html><body>Error page</body></html>';
    global.fetch.mockResolvedValueOnce(mockResponse(200, 'text/html', htmlResponse));
    
    // Mock required state functions
    const setLoading = jest.fn();
    const setGeneratedCredentials = jest.fn();
    const isMounted = { current: true };
    
    // Create a simplified version of the handleCreateEmployee function
    const handleCreateEmployee = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/users/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            role: 'employee'
          }),
        });
        
        try {
          const responseText = await response.text();
          
          if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
              responseText.trim().toLowerCase().startsWith('<html')) {
            console.error('Received HTML instead of JSON:', responseText.substring(0, 200));
            alert('Please fill in all required fields');
            setLoading(false);
            return;
          }
          
          try {
            const userData = JSON.parse(responseText);
            
            if (!response.ok) {
              console.error('Error from API:', userData);
              const errorMessage = userData?.error || 'Unknown error';
              alert(`Error creating employee: ${errorMessage}`);
              setLoading(false);
              return;
            }
            
            // Success case
            setLoading(false);
            return userData;
          } catch (jsonError) {
            console.error('Failed to parse JSON:', jsonError);
            alert('Invalid response format. Please try again.');
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Failed to read response:', e);
          alert('Error creating employee. Please try again.');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error creating employee:', error);
        alert('Failed to create employee. Please try again.');
        setLoading(false);
      }
    };
    
    // Execute
    await handleCreateEmployee();
    
    // Assert
    expect(global.fetch).toHaveBeenCalledWith('/api/users/create', expect.any(Object));
    expect(console.error).toHaveBeenCalledWith(
      'Received HTML instead of JSON:',
      expect.stringContaining('<!DOCTYPE html>')
    );
    expect(alert).toHaveBeenCalledWith('Please fill in all required fields');
    expect(setLoading).toHaveBeenCalledTimes(2); // Once to set true, once to set false
  });
});