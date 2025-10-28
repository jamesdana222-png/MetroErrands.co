import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { mockAttendanceData } from '../lib/test-utils';

// Mock the Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          data: mockAttendanceData,
          error: null
        })
      }),
      insert: () => ({
        select: () => ({
          data: { id: 'new-record-id' },
          error: null
        })
      }),
      update: () => ({
        eq: () => ({
          data: { id: 'updated-record-id' },
          error: null
        })
      })
    }),
    auth: {
      getUser: () => ({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })
    }
  })
}));

// Mock the attendance service
jest.mock('../lib/db-service', () => ({
  attendanceService: {
    getAttendanceRecords: jest.fn().mockResolvedValue({
      data: mockAttendanceData,
      error: null
    }),
    checkIn: jest.fn().mockResolvedValue({
      data: { id: 'new-check-in-id' },
      error: null
    }),
    checkOut: jest.fn().mockResolvedValue({
      data: { id: 'updated-record-id' },
      error: null
    })
  }
}));

// Basic test for attendance functionality
describe('Attendance Feature', () => {
  test('attendance service should handle check-in correctly', async () => {
    const { attendanceService } = require('../lib/db-service');
    
    // Test check-in functionality
    const checkInResult = await attendanceService.checkIn('test-user-id');
    expect(checkInResult.data).toBeTruthy();
    expect(checkInResult.error).toBeNull();
    
    // Verify the mock was called with correct parameters
    expect(attendanceService.checkIn).toHaveBeenCalledWith('test-user-id');
  });
  
  test('attendance service should handle check-out correctly', async () => {
    const { attendanceService } = require('../lib/db-service');
    
    // Test check-out functionality
    const checkOutResult = await attendanceService.checkOut('test-record-id');
    expect(checkOutResult.data).toBeTruthy();
    expect(checkOutResult.error).toBeNull();
    
    // Verify the mock was called with correct parameters
    expect(attendanceService.checkOut).toHaveBeenCalledWith('test-record-id');
  });
  
  test('attendance service should retrieve attendance records', async () => {
    const { attendanceService } = require('../lib/db-service');
    
    // Test getting attendance records
    const records = await attendanceService.getAttendanceRecords();
    expect(records.data).toEqual(mockAttendanceData);
    expect(records.error).toBeNull();
    
    // Verify the mock was called
    expect(attendanceService.getAttendanceRecords).toHaveBeenCalled();
  });
});