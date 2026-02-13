# Account Management Architecture & Technical Proposal

## Executive Summary

This document outlines a comprehensive security-first approach to add account management to the Blocks-Experiment game. The current name-only system allows impersonation, stat manipulation, and creates data integrity issues. This proposal recommends an OAuth 2.0-based solution using third-party identity providers (Google, GitHub) with a hybrid approach that also supports guest play.

## Current State Analysis

### Existing Implementation
- **Authentication**: None - users simply type a name
- **User Identity**: String-based names stored in-memory and database
- **Data Storage**: PostgreSQL with tables for matches, custom_emojis, player stats
- **Architecture**: React frontend + Node.js/Socket.io backend
- **Deployment**: Client on Vercel, Server on Railway

### Security Vulnerabilities
1. **Impersonation**: Any user can claim to be any player
2. **Stat Manipulation**: Players can inflate stats by using different names
3. **Data Ownership**: No way to prove who uploaded custom emojis
4. **Leaderboard Integrity**: Rankings can be artificially manipulated
5. **No Privacy**: Names are public and tied to all actions
6. **GDPR Compliance**: No user consent or data deletion mechanisms

## Recommended Solution: OAuth 2.0 with Third-Party Identity Providers

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (React)                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Login Page │→ │ OAuth Popup  │→ │ Game Application │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ JWT Token
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Server (Node.js + Socket.io)                │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐ │
│  │ Auth Routes  │  │ JWT Middleware│  │ Socket.io Logic │ │
│  │ /auth/google │→ │ Verification  │→ │ (Game Server)   │ │
│  │ /auth/github │  └───────────────┘  └─────────────────┘ │
│  └──────────────┘                                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ users: id, oauth_provider, oauth_id, email,           │ │
│  │        display_name, avatar_url, created_at           │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ matches: ..., white_user_id, black_user_id (FK)      │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ custom_emojis: ..., uploaded_by_user_id (FK)         │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Backend Dependencies
```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-github2": "^0.1.12",
  "jsonwebtoken": "^9.0.2",
  "express": "^4.18.2",
  "cookie-parser": "^1.4.6",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5"
}
```

#### Environment Variables
```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# JWT Configuration
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=7d

# Application URLs
CLIENT_URL=https://your-frontend-url.vercel.app
SERVER_URL=https://your-backend-url.railway.app
```

## Implementation Plan

### Phase 1: Database Schema Migration (Week 1)

#### New Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  oauth_provider VARCHAR(50) NOT NULL,  -- 'google', 'github', 'guest'
  oauth_id VARCHAR(255),                -- External provider ID
  email VARCHAR(255),                   -- May be null for guests
  display_name VARCHAR(100) NOT NULL,   -- User's chosen display name
  avatar_url TEXT,                      -- Profile picture URL
  is_guest BOOLEAN DEFAULT FALSE,       -- True for guest accounts
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  UNIQUE(oauth_provider, oauth_id)
);

CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX idx_users_display_name ON users(display_name);
```

#### Migrate Existing Tables
```sql
-- Add user_id foreign keys to existing tables
ALTER TABLE matches 
  ADD COLUMN white_user_id INTEGER REFERENCES users(id),
  ADD COLUMN black_user_id INTEGER REFERENCES users(id);

-- Keep legacy name columns for backward compatibility during migration
-- whiteName and blackName remain but become secondary

ALTER TABLE custom_emojis
  ADD COLUMN uploaded_by_user_id INTEGER REFERENCES users(id);

-- Create migration script to convert existing names to guest users
-- This preserves existing leaderboard data
```

### Phase 2: Backend Authentication System (Week 2)

#### Express Server Integration
Since the current server uses Socket.io's HTTP server, we'll need to integrate Express properly:

```javascript
// server/server.js modifications
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { /* existing config */ });

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Auth routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

httpServer.listen(PORT);
```

#### Authentication Routes (server/routes/auth.js)
```javascript
// OAuth initiation endpoints
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  handleOAuthCallback
);

router.get('/github', passport.authenticate('github', {
  scope: ['user:email']
}));

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  handleOAuthCallback
);

// Guest account creation
router.post('/guest', createGuestAccount);

// Token refresh
router.post('/refresh', verifyRefreshToken, issueNewToken);

// Logout
router.post('/logout', revokeToken);
```

#### JWT Strategy
```javascript
// Payload structure
{
  userId: 123,
  displayName: "PlayerName",
  provider: "google",
  isGuest: false,
  iat: 1234567890,
  exp: 1234567890
}

// Token stored in:
// 1. HttpOnly cookie (primary, most secure)
// 2. LocalStorage (fallback for WebSocket auth)
```

### Phase 3: Frontend Integration (Week 2-3)

#### New Components
```
client/components/
├── auth/
│   ├── LoginPage.tsx          -- Initial login screen
│   ├── AccountMenu.tsx        -- User profile dropdown
│   ├── GuestPrompt.tsx        -- Guest account creation
│   └── ProtectedRoute.tsx     -- Auth wrapper
```

#### Authentication Flow
```typescript
// client/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = getTokenFromStorage();
    if (token) {
      verifyAndSetUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = (provider: 'google' | 'github') => {
    // Open OAuth popup
    const popup = window.open(
      `${SERVER_URL}/auth/${provider}`,
      'oauth',
      'width=500,height=600'
    );
    
    // Listen for callback
    window.addEventListener('message', handleOAuthCallback);
  };

  const loginAsGuest = async (displayName: string) => {
    const response = await fetch(`${SERVER_URL}/auth/guest`, {
      method: 'POST',
      body: JSON.stringify({ displayName })
    });
    const { token, user } = await response.json();
    setUser(user);
    storeToken(token);
  };

  const logout = async () => {
    await fetch(`${SERVER_URL}/auth/logout`, { method: 'POST' });
    clearToken();
    setUser(null);
  };

  return { user, loading, login, loginAsGuest, logout };
}
```

### Phase 4: Socket.io Authentication (Week 3)

#### Connection Authentication
```javascript
// server/middleware/socketAuth.js
export const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.displayName = decoded.displayName;
    socket.isGuest = decoded.isGuest;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};

io.use(socketAuthMiddleware);
```

#### Modified Socket Events
```javascript
// All events now use socket.userId instead of client-provided names
socket.on('create_room', async (data) => {
  const user = await getUserById(socket.userId);
  const room = {
    white: socket.id,
    whiteName: user.display_name,
    whiteUserId: user.id,  // NEW
    // ...
  };
});

socket.on('upload_custom_emoji', async (data) => {
  await saveCustomEmoji({
    emoji: data.emoji,
    label: data.label,
    uploadedByUserId: socket.userId,  // Server-side, trusted
    // uploadedBy removed or kept for display only
  });
});
```

### Phase 5: Security Enhancements (Week 4)

#### Rate Limiting
```javascript
// server/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts'
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100
});
```

#### Input Validation & Sanitization
```javascript
// server/middleware/validation.js
import validator from 'validator';

export const validateDisplayName = (name) => {
  // Prevent XSS, SQL injection, impersonation
  if (!name || name.length < 2 || name.length > 50) {
    throw new Error('Invalid display name length');
  }
  
  // Block special characters that could be used for impersonation
  if (!/^[a-zA-Z0-9_\s-]+$/.test(name)) {
    throw new Error('Display name contains invalid characters');
  }
  
  // Check against reserved names
  const reserved = ['admin', 'moderator', 'system', 'bot'];
  if (reserved.includes(name.toLowerCase())) {
    throw new Error('Display name is reserved');
  }
  
  return validator.escape(name.trim());
};
```

#### CSRF Protection
```javascript
// server/middleware/csrf.js
import csrf from 'csurf';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});
```

## Alternative Approach: Custom Authentication

If OAuth integration is deemed too complex or you want more control:

### Custom Email/Password System

#### Additional Dependencies
```json
{
  "bcrypt": "^5.1.1",
  "nodemailer": "^6.9.7",
  "@node-rs/argon2": "^1.8.0"  // More secure than bcrypt
}
```

#### Users Table (Modified)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
```

#### Authentication Flow
```javascript
// Registration
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  
  // Validate input
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  // Hash password with Argon2
  const hash = await argon2.hash(password);
  
  // Create user
  const user = await createUser({ email, passwordHash: hash, displayName });
  
  // Send verification email
  await sendVerificationEmail(user.email, user.verificationToken);
  
  res.json({ message: 'Registration successful. Please verify your email.' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (!user.emailVerified) {
    return res.status(401).json({ error: 'Please verify your email first' });
  }
  
  const token = generateJWT(user);
  res.json({ token, user: sanitizeUser(user) });
});
```

### Pros of OAuth vs Custom:

**OAuth (Recommended)**
- ✅ No password storage = less security liability
- ✅ Users trust Google/GitHub for security
- ✅ Faster implementation (no email server needed)
- ✅ Multi-factor auth handled by provider
- ✅ Less maintenance overhead
- ✅ Better UX (one-click login)

**Custom Email/Password**
- ✅ Full control over user experience
- ✅ No dependency on third parties
- ✅ Can add custom fields
- ❌ Must implement password reset, email verification
- ❌ Must secure password storage
- ❌ More vulnerable to attacks
- ❌ Requires email service (cost)

## Security Considerations

### 1. Token Security
- Use HttpOnly cookies for web clients
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days) stored securely
- Token rotation on refresh
- Blacklist tokens on logout

### 2. Guest Account Security
- Generate cryptographically secure random IDs
- Allow conversion to full account
- Automatic cleanup of inactive guests (30 days)
- Rate limit guest creation per IP

### 3. Data Privacy
- GDPR-compliant data deletion
- User consent for data collection
- Privacy policy and terms of service
- Anonymization of deleted user data in historical records

### 4. Additional Protections
- Helmet.js for HTTP headers
- CORS with whitelist
- Rate limiting on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- HTTPS required in production

## Migration Strategy

### Backward Compatibility
To avoid breaking existing functionality:

1. **Dual-mode operation**: Support both authenticated and legacy name-based play during transition
2. **Data migration**: Convert existing player names to guest accounts
3. **Gradual rollout**: Optional authentication first, then mandatory
4. **Grace period**: 30 days for users to claim their stats by creating accounts

### Migration Script Example
```javascript
// server/scripts/migrateUsers.js
async function migrateExistingPlayers() {
  // Get all unique player names from matches
  const players = await pool.query(`
    SELECT DISTINCT name FROM (
      SELECT whiteName as name FROM matches
      UNION
      SELECT blackName as name FROM matches
    ) AS all_names
  `);

  // Create guest accounts for each
  for (const { name } of players.rows) {
    const user = await pool.query(`
      INSERT INTO users (oauth_provider, display_name, is_guest)
      VALUES ('guest', $1, true)
      RETURNING id
    `, [name]);

    // Update matches with user_id
    await pool.query(`
      UPDATE matches
      SET white_user_id = $1
      WHERE whiteName = $2
    `, [user.rows[0].id, name]);

    await pool.query(`
      UPDATE matches
      SET black_user_id = $1
      WHERE blackName = $2
    `, [user.rows[0].id, name]);
  }
}
```

## Testing Strategy

### Unit Tests
- JWT generation and verification
- Password hashing and verification (if custom auth)
- Input validation and sanitization
- Token blacklisting

### Integration Tests
- OAuth flow end-to-end
- Guest account creation
- Socket.io authentication
- Database migrations

### Security Tests
- Penetration testing
- Rate limit effectiveness
- Token expiration handling
- CSRF protection
- XSS prevention

## Deployment Checklist

- [ ] Register OAuth apps with Google/GitHub
- [ ] Configure environment variables on Railway
- [ ] Update CORS settings
- [ ] Set up SSL certificates
- [ ] Configure JWT secrets (rotate regularly)
- [ ] Test OAuth callback URLs
- [ ] Run database migrations
- [ ] Deploy backend first (backward compatible)
- [ ] Deploy frontend with feature flag
- [ ] Monitor for errors
- [ ] Gradual rollout to users

## Cost & Performance Considerations

### Additional Costs
- OAuth is free up to reasonable limits
- Email service if using custom auth (~$10-20/month)
- Minimal database storage increase (<1GB for thousands of users)
- Negligible compute overhead

### Performance Impact
- JWT verification: <1ms per request
- OAuth callback: ~200-500ms (user-initiated)
- Minimal impact on game performance
- Consider Redis for token blacklist at scale

## Monitoring & Maintenance

### Metrics to Track
- Authentication success/failure rate
- Token expiration and refresh patterns
- Guest vs authenticated user ratio
- OAuth provider availability
- Average login time

### Ongoing Maintenance
- Rotate JWT secrets quarterly
- Review and update rate limits
- Monitor for suspicious activity
- Keep OAuth dependencies updated
- Regular security audits

## Questions for Stakeholder Review

1. **OAuth Providers**: Should we support both Google and GitHub, or start with just one? Any other providers desired (Discord, Twitter)?

2. **Guest Accounts**: Should guest play be allowed, or should authentication be mandatory?

3. **Display Names**: Should display names be unique, or allow duplicates with discriminators (like Discord's #1234)?

4. **Data Migration**: Are you okay with converting existing player names to guest accounts, or should we start fresh?

5. **Privacy Policy**: Do we need to draft a privacy policy and terms of service?

6. **Feature Scope**: Should we implement account features beyond authentication (e.g., friends list, private messaging, account settings)?

7. **Timeline**: Is the proposed 4-week timeline acceptable, or do we need to prioritize certain phases?

8. **Budget**: Are there budget constraints for third-party services (email, monitoring, etc.)?

9. **Custom Auth**: Would you prefer OAuth-only, or want a custom email/password option as well?

10. **Account Linking**: Should users be able to link multiple OAuth providers to one account?

## Recommendation Summary

**Primary Recommendation**: Implement OAuth 2.0 with Google and GitHub providers, plus guest account support.

**Rationale**:
- Security-first approach with minimal liability
- Fast implementation (2-3 weeks realistic)
- Great user experience
- Industry-standard solution
- Lower maintenance burden

**Hybrid Approach**: Allow guest play to preserve accessibility while offering authenticated accounts for users who want persistent identity and stat tracking.

**Next Steps**: Please review this proposal and provide feedback on the questions listed above. Once clarifications are received, I can begin implementation.
