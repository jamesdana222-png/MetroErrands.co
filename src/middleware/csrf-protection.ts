import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// CSRF token generation using Web Crypto API (Edge compatible)
export async function generateCsrfToken(): Promise<string> {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Set CSRF token in cookies and return it
export async function setCsrfToken(req: NextRequest): Promise<string> {
  const token = await generateCsrfToken();
  const cookieStore = cookies();
  
  // Set cookie with secure attributes
  cookieStore.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });
  
  return token;
}

// Middleware to validate CSRF token
export function withCsrfProtection(handler: Function) {
  return async (req: NextRequest) => {
    // Skip CSRF check for GET, HEAD, OPTIONS requests (they should be idempotent)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return handler(req);
    }
    
    const cookieStore = cookies();
    const csrfCookie = cookieStore.get('csrf_token')?.value;
    const csrfHeader = req.headers.get('X-CSRF-Token');
    
    // Validate CSRF token
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Invalid CSRF token',
            code: 'CSRF_ERROR'
          } 
        },
        { status: 403 }
      );
    }
    
    // Token is valid, proceed with the request
    return handler(req);
  };
}

// Helper to include CSRF token in fetch requests
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const cookieStore = cookies();
  const csrfToken = cookieStore.get('csrf_token')?.value;
  
  return {
    ...headers,
    'X-CSRF-Token': csrfToken || '',
  };
}