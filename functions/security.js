/**
 * Security utilities for Cloud Functions
 * Provides rate limiting, input sanitization, and CORS protection
 */

// In-memory rate limiter (resets when function cold starts)
const rateLimitStore = new Map();

/**
 * Simple rate limiter
 * @param {string} identifier - IP address or other identifier
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if request should be allowed
 */
export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(identifier) || [];

  // Remove requests outside the time window
  const recentRequests = userRequests.filter(time => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(identifier, recentRequests);

  return true;
}

/**
 * Sanitize string input to prevent XSS and injection attacks
 * @param {string} input - User input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input, maxLength = 500) {
  if (typeof input !== 'string') return '';

  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);

  // Remove potential formula injection (Google Sheets)
  if (sanitized.startsWith('=') || sanitized.startsWith('+') ||
      sanitized.startsWith('-') || sanitized.startsWith('@')) {
    sanitized = "'" + sanitized; // Prefix with single quote to force text
  }

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/\x00/g, '').replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321
}

/**
 * Validate phone number (basic)
 * @param {string} phone - Phone number
 * @returns {boolean} - True if valid
 */
export function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  // Allow digits, spaces, parentheses, plus, and hyphens
  const phoneRegex = /^[\d\s()+-]{7,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Check CORS origin
 * @param {string} origin - Request origin
 * @param {Array<string>} allowedOrigins - Allowed origins
 * @returns {boolean} - True if origin is allowed
 */
export function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return false;

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development' &&
      origin.includes('localhost')) {
    return true;
  }

  return allowedOrigins.some(allowed => origin === allowed);
}

/**
 * Apply CORS headers with origin checking
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Array<string>} allowedOrigins - Allowed origins
 * @returns {boolean} - True if origin is allowed
 */
export function applyCORS(req, res, allowedOrigins) {
  const origin = req.headers.origin || req.headers.referer;

  if (!isAllowedOrigin(origin, allowedOrigins)) {
    return false;
  }

  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');

  return true;
}

/**
 * Get client IP address from request
 * @param {Object} req - Request object
 * @returns {string} - IP address
 */
export function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         'unknown';
}

/**
 * Validate admin password securely
 * Note: In production, use Firebase Authentication instead
 * @param {string} password - Password to check
 * @param {string} correctPassword - Correct password from environment
 * @returns {boolean} - True if password matches
 */
export function validateAdminPassword(password, correctPassword) {
  if (!password || !correctPassword) return false;

  // Constant-time comparison to prevent timing attacks
  if (password.length !== correctPassword.length) return false;

  let result = 0;
  for (let i = 0; i < password.length; i++) {
    result |= password.charCodeAt(i) ^ correctPassword.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Verify reCAPTCHA v3 token
 * @param {string} token - reCAPTCHA token from frontend
 * @param {string} secretKey - reCAPTCHA secret key
 * @param {string} expectedAction - Expected action name
 * @param {number} minScore - Minimum score (0.0 to 1.0, default 0.5)
 * @returns {Promise<{success: boolean, score?: number, error?: string}>}
 */
export async function verifyRecaptcha(token, secretKey, expectedAction, minScore = 0.5) {
  // If no token provided, allow request (reCAPTCHA is optional for now)
  if (!token) {
    console.warn('No reCAPTCHA token provided');
    return { success: true, score: 0 };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return { success: false, error: 'reCAPTCHA verification failed' };
    }

    // Verify action matches
    if (data.action !== expectedAction) {
      console.error('reCAPTCHA action mismatch:', data.action, 'expected:', expectedAction);
      return { success: false, error: 'Invalid reCAPTCHA action' };
    }

    // Check score (v3 returns score 0.0-1.0)
    if (data.score < minScore) {
      console.warn('reCAPTCHA score too low:', data.score);
      return { success: false, error: 'Bot detection score too low', score: data.score };
    }

    return { success: true, score: data.score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    // On error, allow request but log it
    return { success: true, score: 0 };
  }
}
