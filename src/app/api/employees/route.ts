import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Function to generate a random password
function generatePassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export async function POST(request: Request) {
  try {
    // Parse the request body safely
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid JSON in request body' 
      }, { 
        status: 400
      });
    }
    
    console.log('Request body:', body);
    const { email, fullName, department, position, phone, startDate, address, password } = body;
    
    console.log('Creating employee with data:', { email, fullName, department, position });
    
    // Validate required fields
    if (!email || !fullName || !position || !department || !phone || !startDate) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { 
        status: 400
      });
    }
    
    // Check if the Supabase client is initialized
    if (!supabase) {
      console.error('Supabase client not initialized');
      return NextResponse.json({ 
        success: false, 
        message: 'Database connection error' 
      }, { 
        status: 500
      });
    }

    // Check if user with this email already exists
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user:', checkError);
        return NextResponse.json({ 
          success: false, 
          message: 'Error checking existing user' 
        }, { 
          status: 500
        });
      }
      
      if (existingUser) {
        return NextResponse.json({ 
          success: false, 
          message: 'User with this email already exists' 
        }, { 
          status: 409
        });
      }
    } catch (existingUserError) {
      console.error('Exception checking existing user:', existingUserError);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Error checking existing user' 
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Use provided password or generate a temporary one
    const tempPassword = password || generatePassword();
    
    // Create auth user in Supabase
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true
      });
      
      if (authError) {
        console.error('Auth creation error:', authError);
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Failed to create authentication account: ' + authError.message 
        }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      const userId = authData?.user?.id;
      
      if (!userId) {
        console.error('No user ID returned from auth creation');
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Failed to create user account - no user ID returned' 
        }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Create user record in users table
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: userId,
              email,
              name: fullName,
              role: 'employee',
              department,
              position,
              phone,
              address: address || null,
              start_date: startDate,
              status: 'active'
            }
          ])
          .select()
          .single();
        
        if (userError) {
          console.error('User creation error:', userError);
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Failed to create user record: ' + userError.message 
          }), { 
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
        
        // Log the action
        try {
          await supabase
            .from('audit_logs')
            .insert([
              {
                user_id: '1', // Admin ID
                user_name: 'Admin User',
                action: 'create',
                entity_type: 'user',
                entity_id: userData?.id || 'unknown',
                details: `Created new employee: ${fullName}`,
                ip_address: '127.0.0.1' // Would be actual IP in production
              }
            ]);
          console.log('Audit log created successfully');
        } catch (auditErr) {
          console.error('Error creating audit log:', auditErr);
          // Continue even if audit log fails
        }
        
        return NextResponse.json({ 
          success: true, 
          user: {
            id: userData?.id,
            email: userData?.email || email,
            fullName: userData?.name || fullName,
            role: 'employee',
            department: department,
            position: position,
            createdAt: userData?.created_at || new Date().toISOString(),
            lastLogin: null
          },
          tempPassword // Return the temporary password so it can be communicated to the user
        });
      } catch (userCreationError) {
        console.error('Exception creating user record:', userCreationError);
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Exception creating user record' 
        }), { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (authCreationError) {
      console.error('Exception creating auth user:', authCreationError);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Exception creating authentication account' 
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Create employee error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to create employee. Please check server logs for details.' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Failed to fetch users' 
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Convert from snake_case to camelCase for frontend
    const formattedUsers = data.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.name,
      role: user.role,
      department: user.department,
      position: user.position,
      createdAt: user.created_at,
      lastLogin: user.last_login || null
    }));
    
    return new Response(JSON.stringify({ 
      success: true, 
      users: formattedUsers 
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to fetch users' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}