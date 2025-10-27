import { NextRequest, NextResponse } from 'next/server';
import { createTooManyRequestsResponse } from '../lib/api-utils';

// Simple in-memory store for rate limiting
// In production, use Redis or another distributed cache
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  limit: number;        // Maximum requests allowed in the window
  windowMs: number;     // Time window in milliseconds
  keyGenerator?: (req: NextRequest) => string; // Function to generate a unique key for the request
}

// Default options
const defaultOptions: RateLimitOptions = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (req) => {
    // Default key is IP address + path
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    return `${ip}:${req.nextUrl.pathname}`;
  }
};

export function rateLimiter(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...defaultOptions, ...options };
  
  return async function middleware(req: NextRequest) {
    // Generate key for this request
    const key = opts.keyGenerator!(req);
    
    // Get current time
    const now = Date.now();
    
    // Get or create rate limit data for this key
    let rateData = rateLimitStore.get(key);
    
    if (!rateData || now > rateData.resetTime) {
      // First request or window expired, create new rate limit data
      rateData = {
        count: 1,
        resetTime: now + opts.windowMs
      };
      rateLimitStore.set(key, rateData);
      
      // Set headers and allow request
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', opts.limit.toString());
      response.headers.set('X-RateLimit-Remaining', (opts.limit - 1).toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(rateData.resetTime / 1000).toString());
      return response;
    }
    
    // Increment count
    rateData.count++;
    
    // Check if limit exceeded
    if (rateData.count > opts.limit) {
      // Return rate limit exceeded response
      const retryAfter = Math.ceil((rateData.resetTime - now) / 1000);
      
      const response = createTooManyRequestsResponse('Rate limit exceeded', {
        retryAfter,
        limit: opts.limit,
        windowMs: opts.windowMs
      });
      
      response.headers.set('Retry-After', retryAfter.toString());
      return response;
    }
    
    // Update store
    rateLimitStore.set(key, rateData);
    
    // Set headers and allow request
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', opts.limit.toString());
    response.headers.set('X-RateLimit-Remaining', (opts.limit - rateData.count).toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(rateData.resetTime / 1000).toString());
    return response;
  };
}

// Helper to apply different rate limits based on the route
export function configureRateLimits() {
  return {
    // Authentication endpoints - stricter limits to prevent brute force
    auth: rateLimiter({
      limit: 10,
      windowMs: 60 * 1000, // 1 minute
    }),
    
    // Standard API endpoints
    api: rateLimiter({
      limit: 100,
      windowMs: 60 * 1000, // 1 minute
    }),
    
    // Public endpoints - more lenient
    public: rateLimiter({
      limit: 200,
      windowMs: 60 * 1000, // 1 minute
    })
  };
}