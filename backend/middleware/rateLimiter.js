const rateLimitStore = {};

/**
 * Custom in-memory rate limiting middleware to prevent brute-force and spamming.
 */
const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // Default: 15 minutes
  const max = options.max || 100; // Default: 100 requests per window
  const message = options.message || 'Too many requests from this IP. Please try again later.';

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const now = Date.now();

    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = {
        resetTime: now + windowMs,
        count: 1
      };
      return next();
    }

    const client = rateLimitStore[ip];

    // If time window has passed, reset the client's rate limit window
    if (now > client.resetTime) {
      client.resetTime = now + windowMs;
      client.count = 1;
      return next();
    }

    client.count++;

    // Block if request count exceeds maximum allowed
    if (client.count > max) {
      return res.status(429).json({
        success: false,
        message
      });
    }

    next();
  };
};

module.exports = rateLimiter;
