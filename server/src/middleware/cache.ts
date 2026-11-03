import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generate ETag from response body
 */
function generateETag(body: string): string {
  return `"${crypto.createHash('md5').update(body).digest('hex')}"`;
}

/**
 * Cache middleware that adds Cache-Control and ETag headers
 * 
 * @param maxAge - Cache duration in seconds
 * @param options - Additional cache options
 */
export function cache(maxAge: number, options: {
  private?: boolean;
  mustRevalidate?: boolean;
  staleWhileRevalidate?: number;
  etag?: boolean;
} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const { private: isPrivate = true, mustRevalidate = false, staleWhileRevalidate, etag = true } = options;

    // Build Cache-Control header
    const cacheControl: string[] = [];
    
    if (isPrivate) {
      cacheControl.push('private');
    } else {
      cacheControl.push('public');
    }
    
    cacheControl.push(`max-age=${maxAge}`);
    
    if (mustRevalidate) {
      cacheControl.push('must-revalidate');
    }
    
    if (staleWhileRevalidate) {
      cacheControl.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }

    // Set Cache-Control header
    res.setHeader('Cache-Control', cacheControl.join(', '));

    // Add ETag support if enabled
    if (etag) {
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        const bodyString = JSON.stringify(body);
        const etagValue = generateETag(bodyString);
        
        // Set ETag header
        res.setHeader('ETag', etagValue);
        
        // Check if client has matching ETag
        const clientETag = req.headers['if-none-match'];
        if (clientETag === etagValue) {
          // Return 304 Not Modified
          return res.status(304).end();
        }
        
        // Return normal response
        return originalJson(body);
      };
    }

    next();
  };
}

/**
 * No cache middleware - prevents any caching
 */
export function noCache(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
}

/**
 * Predefined cache strategies
 */
export const cacheStrategies = {
  // Static data that rarely changes (5 minutes, revalidate in background)
  static: cache(300, { staleWhileRevalidate: 60, etag: true }),
  
  // User-specific data (2 minutes, private)
  userPrivate: cache(120, { private: true, etag: true }),
  
  // Frequently changing data (30 seconds)
  short: cache(30, { mustRevalidate: true, etag: true }),
  
  // Very short cache for real-time-ish data (10 seconds)
  realtime: cache(10, { mustRevalidate: true, etag: true }),
  
  // No caching at all
  none: noCache,
};
