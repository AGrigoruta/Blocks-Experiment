# Account Management - Quick Setup Guide

## Overview

The Blocks 3D game now includes account management with:
- **OAuth Authentication** (Google, GitHub)
- **Guest Accounts** (temporary, no OAuth required)
- **Discord-style Discriminators** (#0001, #0002, etc.)
- **Secure Match Attribution** (user IDs instead of just names)
- **Authenticated Leaderboard** (no guest players)

## Local Development Setup

### 1. Install Dependencies

```bash
# Install both client and server dependencies
npm run install:all
```

### 2. Set Up OAuth Applications

#### Google OAuth

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID:
   - Type: Web application
   - JavaScript origins: `http://localhost:5173`
   - Redirect URIs: `http://localhost:3000/auth/google/callback`

#### GitHub OAuth

1. Visit [GitHub Developer Settings](https://github.com/settings/developers)
2. Create New OAuth App:
   - Homepage: `http://localhost:5173`
   - Callback: `http://localhost:3000/auth/github/callback`

### 3. Configure Environment Variables

#### Server (.env)

Create `server/.env`:

```bash
# Database
DATABASE_URL=postgresql://blocks_user:blocks_password@localhost:5432/blocks_db

# Server
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Authentication
JWT_SECRET=your_random_secret_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# URLs
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
```

#### Client (.env)

Create `client/.env`:

```bash
VITE_SERVER_URL=http://localhost:3000
```

### 4. Set Up Database

```bash
# Start PostgreSQL (if using Docker)
docker run --name blocks-postgres \
  -e POSTGRES_USER=blocks_user \
  -e POSTGRES_PASSWORD=blocks_password \
  -e POSTGRES_DB=blocks_db \
  -p 5432:5432 \
  -d postgres:15

# The tables will be created automatically when you start the server
```

### 5. Start Development Servers

```bash
# Start both client and server
npm run dev

# Or start individually:
npm run dev:server  # Runs on http://localhost:3000
npm run dev:client  # Runs on http://localhost:5173
```

### 6. Migrate Existing Data (Optional)

If you have existing match data with player names:

```bash
curl -X POST http://localhost:3000/admin/migrate-users
```

This converts all unique player names to guest accounts.

## Features

### Authentication

- **Sign in with Google**: One-click OAuth authentication
- **Sign in with GitHub**: One-click OAuth authentication
- **Play as Guest**: Create temporary account with display name

### User Profiles

- Display name with discriminator (e.g., "Player#0001")
- Profile picture from OAuth provider
- Account type badge (Google, GitHub, Guest)
- Logout functionality

### Game Features

- Matches automatically linked to user accounts
- Leaderboard shows only authenticated users
- Custom emojis attributed to uploaders
- Stats persist across sessions

### Security

- JWT token authentication
- HttpOnly cookies option
- Rate limiting on auth endpoints
- Input validation and sanitization
- HTTPS required in production

## Architecture

```
┌─────────────────────┐
│   React Client      │
│   (Vite + React)    │
│                     │
│   - LoginPage       │
│   - AuthContext     │
│   - UserProfile     │
└──────────┬──────────┘
           │ OAuth popup / JWT
           ↓
┌─────────────────────┐
│   Express Server    │
│   (Node.js)         │
│                     │
│   - Auth Routes     │
│   - JWT Middleware  │
│   - Socket.io Auth  │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   PostgreSQL        │
│                     │
│   - users           │
│   - matches         │
│   - custom_emojis   │
└─────────────────────┘
```

## Database Schema

### users table

```sql
- id (serial, PK)
- oauth_provider (varchar) - 'google', 'github', or 'guest'
- oauth_id (varchar) - external provider ID
- email (varchar, nullable)
- display_name (varchar) - user's chosen name
- discriminator (varchar) - 4-digit unique suffix
- avatar_url (text, nullable)
- is_guest (boolean)
- created_at, updated_at, last_login_at (timestamps)
```

### matches table (updated)

```sql
- id (serial, PK)
- whiteName, blackName (text) - kept for backward compatibility
- white_user_id, black_user_id (integer, FK to users)
- winner, matchTime, whiteNumberOfBlocks, blackNumberOfBlocks
- matchEndTimestamp, createdAt (timestamps)
```

### custom_emojis table (updated)

```sql
- id (serial, PK)
- emoji, label, uploadedBy (text)
- uploaded_by_user_id (integer, FK to users)
- isImage, emojiHash
- createdAt (timestamp)
```

## API Endpoints

### Authentication

- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - GitHub OAuth callback
- `POST /auth/guest` - Create guest account
- `GET /auth/verify` - Verify JWT token

### Game

- `GET /leaderboard` - Get top players (authenticated only)
- `POST /admin/migrate-users` - Migrate existing players to guests

### Socket.io Events

All existing events remain the same, but now support authenticated users:
- `create_room` - Creates room with user ID
- `join_room` - Joins with user ID
- `game_action` - Game moves
- `upload_custom_emoji` - With user attribution

## Testing

### Test OAuth Flows

1. Click "Sign in with Google" - verify popup and redirect
2. Click "Sign in with GitHub" - verify popup and redirect
3. Click "Play as Guest" - verify account creation

### Test Game Functions

1. Create a room as authenticated user
2. Have another user join
3. Play a match
4. Check match saved with user IDs:
   ```sql
   SELECT * FROM matches ORDER BY id DESC LIMIT 1;
   ```

### Test Leaderboard

1. Complete matches with authenticated accounts
2. Check leaderboard shows users with discriminators
3. Verify guest users don't appear

## Troubleshooting

### OAuth redirect doesn't work

- Check callback URLs match exactly
- Verify `SERVER_URL` and `CLIENT_URL` are correct
- Check browser console for CORS errors

### "Authentication required" error

- Check JWT_SECRET is set
- Verify token in localStorage
- Try clearing localStorage and re-login

### Socket connection fails

- Check token is being sent in socket handshake
- Verify server has `socketAuthenticate` middleware
- Check server logs for auth errors

### Matches not saving user IDs

- Verify socket.userId is set
- Check room has whiteUserId/blackUserId
- Verify database columns exist

## Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete production deployment instructions.

Quick checklist:
- [ ] Set up OAuth apps for production URLs
- [ ] Configure all environment variables
- [ ] Generate strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Set proper CORS origin
- [ ] Run migration script
- [ ] Test all auth flows
- [ ] Monitor logs

## Documentation

- [Complete Technical Proposal](./ACCOUNT_MANAGEMENT_PROPOSAL.md)
- [Executive Summary](./ACCOUNT_MANAGEMENT_SUMMARY.md)
- [UX Mockups](./ACCOUNT_MANAGEMENT_UX.md)
- [Documentation Index](./ACCOUNT_MANAGEMENT_README.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

## Support

For issues or questions:
1. Check server logs
2. Check browser console
3. Verify environment variables
4. Test in incognito mode
5. Check OAuth provider settings
