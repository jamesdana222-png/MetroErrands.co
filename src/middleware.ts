import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { configureRateLimits } from './middleware/rate-limiter';

// Configure rate limiters
const rateLimits = configureRateLimits();

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || 
                      path === '/auth' || 
                      path === '/login' ||
                      path === '/request' || 
                      path.startsWith('/admin') ||
                      path.startsWith('/employee') ||
                      path.startsWith('/_next') || 
                      path.startsWith('/api/auth');
  
  // Get the token from the cookies
  const token = request.cookies.get('sb-access-token')?.value;
  
  // Redirect unauthenticated users to login page if trying to access protected routes
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Prevent redirection from landing page to login
  if (path === '/' && !token) {
    return NextResponse.next();
  }
  
  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com; font-src 'self' data:; connect-src 'self' https://*.supabase.co;"
  );
  
  // Apply rate limiting for API routes
  if (path.startsWith('/api/')) {
    // Apply different rate limits based on the route
    if (path.startsWith('/api/auth')) {
      // Auth endpoints have stricter limits
      const rateLimit = rateLimits.auth(request);
      if (rateLimit instanceof NextResponse) {
        return rateLimit;
      }
    } else {
      // Standard API rate limits
      const rateLimit = rateLimits.api(request);
      if (rateLimit instanceof NextResponse) {
        return rateLimit;
      }
    }
  }

  // Apply CSRF protection for state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && 
      path.startsWith('/api/') && 
      !path.startsWith('/api/auth')) {
    
    // Check for CSRF token in header
    const csrfToken = request.headers.get('X-CSRF-Token');
    const csrfCookie = request.cookies.get('csrf_token')?.value;
    
    // If no CSRF token or tokens don't match, return 403
    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
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
  }
  
  // For GET requests to pages, set a new CSRF token if one doesn't exist
  if (request.method === 'GET' && !request.cookies.get('csrf_token')?.value) {
    // Generate a new CSRF token using Web Crypto API
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    const csrfToken = Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Set the CSRF token in a cookie
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    });
  }
  
  return response;
}