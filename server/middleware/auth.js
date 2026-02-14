import { verifyToken, extractToken } from '../utils/jwt.js';
import { getUserById } from '../db.js';

/**
 * Middleware to verify JWT token and attach user to request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware function
 */
export async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    
    // Fetch fresh user data from database
    const user = await getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token
 * Useful for endpoints that work both authenticated and unauthenticated
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyToken(token);
      const user = await getUserById(decoded.userId);
      
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }
  
  next();
}

/**
 * Socket.io authentication middleware
 * @param {Object} socket - Socket.io socket
 * @param {Function} next - Next middleware function
 */
export async function socketAuthenticate(socket, next) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.userId);

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user info to socket
    socket.userId = user.id;
    socket.displayName = user.display_name;
    socket.discriminator = user.discriminator;
    socket.isGuest = user.is_guest;
    socket.user = user;

    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
}
