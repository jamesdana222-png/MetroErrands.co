// Mock data for testing
export const mockAttendanceData = [
  {
    id: 'att-1',
    user_id: 'user-1',
    check_in: '2023-06-01T08:00:00Z',
    check_out: '2023-06-01T17:00:00Z',
    status: 'completed',
    notes: 'Regular day'
  },
  {
    id: 'att-2',
    user_id: 'user-2',
    check_in: '2023-06-01T08:30:00Z',
    check_out: '2023-06-01T16:45:00Z',
    status: 'completed',
    notes: 'Left early for appointment'
  },
  {
    id: 'att-3',
    user_id: 'user-1',
    check_in: '2023-06-02T08:15:00Z',
    check_out: null,
    status: 'in_progress',
    notes: ''
  }
];

// Helper function to mock API responses
export const mockApiResponse = (data, error = null) => {
  return {
    data,
    error
  };
};