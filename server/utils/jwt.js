import jwt from 'jsonwebtoken';

const DEFAULT_JWT_SECRET = 'default_secret_change_in_production';
const RAW_JWT_SECRET = process.env.JWT_SECRET;

// In production, require a secure, explicitly configured JWT secret
if (process.env.NODE_ENV === 'production') {
  if (!RAW_JWT_SECRET || RAW_JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable must be set to a secure value in production.');
  }
}

const JWT_SECRET = RAW_JWT_SECRET || DEFAULT_JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object from database
 * @returns {string} JWT token
 */
export function generateToken(user) {
  // WARNING: JWT payload is signed but NOT encrypted - data is publicly readable
  // Do not include sensitive information that shouldn't be client-accessible
  const payload = {
    userId: user.id,
    displayName: user.display_name,
    discriminator: user.discriminator,
    provider: user.oauth_provider,
    isGuest: user.is_guest,
    // Email and avatar are included for convenience but are not sensitive
    // Users should expect this data to be visible (it's their public profile data)
    email: user.email,
    avatarUrl: user.avatar_url
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from request (supports Authorization header and cookies)
 * @param {Object} req - Express request object
 * @returns {string|null} Token string or null if not found
 */
export function extractToken(req) {
  // Check Authorization header first (format: "Bearer <token>")
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }
  }

  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
}
