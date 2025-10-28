/**
 * Mock Database System
 * 
 * This file replaces Supabase database functionality with a simple mock implementation
 * that works without external dependencies.
 */

// Mock data storage
const DB = {
  users: [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      department: 'Management',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'employee@example.com',
      name: 'Employee User',
      role: 'employee',
      department: 'Operations',
      created_at: new Date().toISOString(),
    }
  ],
  tasks: [],
  projects: [],
  attendance: [],
  chat_messages: []
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Mock database client
export const dbClient = {
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          const items = DB[table as keyof typeof DB] || [];
          const item = items.find((item: any) => item[column] === value);
          return { data: item || null, error: null };
        }
      }),
      limit: (limit: number) => ({
        order: (column: string, { ascending = true } = {}) => ({
          range: (from: number, to: number) => ({
            then: (callback: Function) => {
              const items = DB[table as keyof typeof DB] || [];
              const sortedItems = [...items].sort((a: any, b: any) => {
                return ascending 
                  ? a[column] > b[column] ? 1 : -1
                  : a[column] < b[column] ? 1 : -1;
              });
              const slicedItems = sortedItems.slice(from, to + 1);
              return Promise.resolve(callback({ data: slicedItems, error: null }));
            }
          })
        })
      }),
      order: (column: string, { ascending = true } = {}) => ({
        then: (callback: Function) => {
          const items = DB[table as keyof typeof DB] || [];
          const sortedItems = [...items].sort((a: any, b: any) => {
            return ascending 
              ? a[column] > b[column] ? 1 : -1
              : a[column] < b[column] ? 1 : -1;
          });
          return Promise.resolve(callback({ data: sortedItems, error: null }));
        }
      }),
      then: (callback: Function) => {
        const items = DB[table as keyof typeof DB] || [];
        return Promise.resolve(callback({ data: items, error: null }));
      }
    }),
    insert: (data: any) => ({
      select: (returning: string = '*') => {
        const items = DB[table as keyof typeof DB];
        if (!items) return Promise.resolve({ data: null, error: { message: 'Table not found' } });
        
        const newItem = Array.isArray(data) 
          ? data.map((item: any) => ({ ...item, id: item.id || generateId(), created_at: new Date().toISOString() }))
          : { ...data, id: data.id || generateId(), created_at: new Date().toISOString() };
        
        if (Array.isArray(data)) {
          (items as any[]).push(...newItem);
        } else {
          (items as any[]).push(newItem);
        }
        
        return Promise.resolve({ data: newItem, error: null });
      }
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => {
        const items = DB[table as keyof typeof DB] as any[];
        if (!items) return Promise.resolve({ data: null, error: { message: 'Table not found' } });
        
        const index = items.findIndex(item => item[column] === value);
        if (index === -1) return Promise.resolve({ data: null, error: { message: 'Item not found' } });
        
        items[index] = { ...items[index], ...data, updated_at: new Date().toISOString() };
        
        return Promise.resolve({ data: items[index], error: null });
      }
    }),
    delete: () => ({
      eq: (column: string, value: any) => {
        const items = DB[table as keyof typeof DB] as any[];
        if (!items) return Promise.resolve({ error: { message: 'Table not found' } });
        
        const index = items.findIndex(item => item[column] === value);
        if (index === -1) return Promise.resolve({ error: { message: 'Item not found' } });
        
        const deleted = items.splice(index, 1)[0];
        
        return Promise.resolve({ data: { deleted }, error: null });
      }
    })
  }),
  rpc: (procedure: string, params: any) => {
    // Mock RPC calls
    return Promise.resolve({ data: null, error: null });
  },
  removeChannel: (channel: any) => {
    // Mock channel removal
  },
  channel: (name: string) => ({
    on: (event: string, callback: Function) => {
      // Mock channel subscription
      return { 
        subscribe: () => ({ 
          unsubscribe: () => {} 
        }) 
      };
    }
  })
};

// Check if database is configured
export const isDatabaseConfigured = () => true;