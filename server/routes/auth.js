import express from 'express';
import passport from '../utils/passport.js';
import { generateToken } from '../utils/jwt.js';
import { createUser } from '../db.js';

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Google OAuth - Initiate
 */
router.get('/google', passport.authenticate('google', {
  session: false,
  scope: ['profile', 'email']
}));

/**
 * Google OAuth - Callback
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_URL}?auth=failed` }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // Send token via postMessage to parent window (more secure than URL params)
      // This prevents token exposure in browser history and server logs
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Authentication Successful</title></head>
          <body>
            <script>
              window.opener.postMessage(
                { type: 'oauth-success', token: '${token}' },
                '${CLIENT_URL}'
              );
              window.close();
            </script>
            <p>Authentication successful. This window will close automatically...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect(`${CLIENT_URL}?auth=failed&error=${encodeURIComponent(error.message)}`);
    }
  }
);

/**
 * GitHub OAuth - Initiate
 */
router.get('/github', passport.authenticate('github', {
  session: false,
  scope: ['user:email']
}));

/**
 * GitHub OAuth - Callback
 */
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${CLIENT_URL}?auth=failed` }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // Send token via postMessage to parent window (more secure than URL params)
      // This prevents token exposure in browser history and server logs
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Authentication Successful</title></head>
          <body>
            <script>
              window.opener.postMessage(
                { type: 'oauth-success', token: '${token}' },
                '${CLIENT_URL}'
              );
              window.close();
            </script>
            <p>Authentication successful. This window will close automatically...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('GitHub auth callback error:', error);
      res.redirect(`${CLIENT_URL}?auth=failed&error=${encodeURIComponent(error.message)}`);
    }
  }
);

/**
 * Create guest account
 * POST /auth/guest
 * Body: { displayName: string }
 */
router.post('/guest', async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      return res.status(400).json({ error: 'Display name must be between 2 and 50 characters' });
    }

    // Validate display name format (alphanumeric, spaces, underscores, hyphens only)
    if (!/^[a-zA-Z0-9_\s-]+$/.test(displayName.trim())) {
      return res.status(400).json({ error: 'Display name contains invalid characters' });
    }

    // Check against reserved names
    const reserved = ['admin', 'moderator', 'system', 'bot', 'guest'];
    if (reserved.includes(displayName.trim().toLowerCase())) {
      return res.status(400).json({ error: 'This display name is reserved' });
    }

    // Create guest user
    const user = await createUser({
      oauthProvider: 'guest',
      oauthId: null,
      email: null,
      displayName: displayName.trim(),
      avatarUrl: null,
      isGuest: true
    });

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        displayName: user.display_name,
        discriminator: user.discriminator,
        isGuest: user.is_guest,
        avatarUrl: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Guest account creation error:', error);
    res.status(500).json({ error: 'Failed to create guest account' });
  }
});

/**
 * Verify token endpoint
 * GET /auth/verify
 * Headers: Authorization: Bearer <token>
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { verifyToken } = await import('../utils/jwt.js');
    const decoded = verifyToken(token);

    const { getUserById } = await import('../db.js');
    const user = await getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        displayName: user.display_name,
        discriminator: user.discriminator,
        email: user.email,
        avatarUrl: user.avatar_url,
        isGuest: user.is_guest,
        provider: user.oauth_provider
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
