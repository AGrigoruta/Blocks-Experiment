# Account Management Deployment Guide

This guide walks through deploying the account management system to production.

## Prerequisites

- Google OAuth 2.0 Client ID and Secret
- GitHub OAuth App Client ID and Secret
- PostgreSQL database (already configured)
- Server deployed on Railway (or similar)
- Client deployed on Vercel (or similar)

## Step 1: Set Up OAuth Providers

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-client-domain.vercel.app` (production)
7. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://your-server-domain.railway.app/auth/google/callback` (production)
8. Copy the Client ID and Client Secret

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in details:
   - Application name: "Blocks 3D"
   - Homepage URL: `https://your-client-domain.vercel.app`
   - Authorization callback URL: `https://your-server-domain.railway.app/auth/github/callback`
4. Register application
5. Copy the Client ID
6. Generate a new Client Secret and copy it

## Step 2: Configure Server Environment Variables

On Railway (or your server hosting platform), add these environment variables:

```bash
# Authentication
JWT_SECRET=<generate-a-random-64-character-string>
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# GitHub OAuth
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>

# URLs
CLIENT_URL=https://your-client-domain.vercel.app
SERVER_URL=https://your-server-domain.railway.app

# Existing variables
PORT=3000
CORS_ORIGIN=https://your-client-domain.vercel.app
DATABASE_URL=<your-postgres-connection-string>
```

### Generate JWT Secret

Use a secure random string generator:

```bash
# On Linux/Mac
openssl rand -hex 32

# Or Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Configure Client Environment Variables

On Vercel (or your client hosting platform), add:

```bash
VITE_SERVER_URL=https://your-server-domain.railway.app
```

## Step 4: Deploy Server

1. Push code to your repository
2. Railway will automatically deploy
3. Check logs for any errors:
   ```
   Users table initialized
   Matches table migrations completed
   Custom emojis table migrations completed
   HTTP and WebSocket server listening on port 3000
   ```

## Step 5: Deploy Client

1. Push code to your repository
2. Vercel will automatically build and deploy
3. Verify build succeeded

## Step 6: Run Database Migrations

### Migrate Existing Players to Guest Accounts

This is a one-time operation to convert existing player names to guest accounts:

1. Make a POST request to your server's migration endpoint:

```bash
curl -X POST https://your-server-domain.railway.app/admin/migrate-users
```

2. Response will show migration statistics:
```json
{
  "success": true,
  "created": 25,
  "skipped": 0,
  "total": 25
}
```

**Important**: In production, you should protect this endpoint. Consider:
- Adding authentication
- Removing the endpoint after migration
- Running it manually via database script

## Step 7: Verify Deployment

### Test OAuth Flows

1. **Google Login**:
   - Visit your client URL
   - Click "Sign in with Google"
   - Verify popup opens and you can authenticate
   - Check that you're redirected back with your profile

2. **GitHub Login**:
   - Click "Sign in with GitHub"
   - Verify authentication works
   - Check profile display

3. **Guest Login**:
   - Click "Play as Guest"
   - Enter a display name
   - Verify account creation

### Test Game Functionality

1. Create a game room
2. Have another user join
3. Play a match to completion
4. Verify match is saved to database with user IDs:

```sql
SELECT 
  id, 
  whiteName, 
  white_user_id, 
  blackName, 
  black_user_id, 
  winner 
FROM matches 
ORDER BY id DESC 
LIMIT 5;
```

5. Check leaderboard shows authenticated users only
6. Test custom emoji upload with user attribution

## Step 8: Monitor

### Check Server Logs

Watch for:
- OAuth callback successes/failures
- Database connection issues
- JWT token errors
- Match save errors

### Database Monitoring

Monitor:
- User table growth
- Match records with user IDs
- Custom emoji uploads

### Client Monitoring

Check browser console for:
- Authentication errors
- Token expiration issues
- Socket connection failures

## Troubleshooting

### "Authentication failed" after OAuth

- **Check redirect URIs**: Must match exactly in OAuth provider settings
- **Check CORS**: Ensure `CLIENT_URL` is in `CORS_ORIGIN`
- **Check URLs**: Ensure `SERVER_URL` and `CLIENT_URL` are correct

### "Invalid or expired token"

- **Check JWT_SECRET**: Must be the same across all server instances
- **Check token in localStorage**: May need to clear and re-login
- **Check token expiration**: Default is 7 days

### Socket connection fails

- **Check auth token**: Socket needs valid token
- **Check server logs**: May show authentication errors
- **Try without auth**: Comment out `io.use(socketAuthenticate)` for testing

### Matches not saving with user IDs

- **Check socket.userId**: May be undefined if auth middleware not working
- **Check room data**: Verify whiteUserId and blackUserId are set
- **Check database**: Verify columns exist

## Security Checklist

- [ ] JWT_SECRET is strong and secret
- [ ] HTTPS only in production
- [ ] OAuth callback URLs use HTTPS
- [ ] CORS limited to your domain (not `*`)
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled
- [ ] Migration endpoint protected or removed
- [ ] Database has proper indexes
- [ ] No sensitive data in logs
- [ ] Environment variables not in code

## Rollback Plan

If issues occur:

1. **Revert authentication requirement**:
   ```javascript
   // server/server.js
   // Comment this line:
   // io.use(socketAuthenticate);
   ```

2. **Keep new database columns**: They're nullable and won't break existing functionality

3. **Allow unauthenticated play**: The system is designed to work with or without auth

4. **Fix and redeploy**: Users can continue playing while you fix issues

## Next Steps

After successful deployment:

1. **Monitor for 24 hours**: Check for errors and user feedback
2. **Announce to users**: Let them know about new authentication
3. **Encourage account creation**: Explain benefits of authenticated accounts
4. **Cleanup guest accounts**: After 30 days, can cleanup inactive guests

## Support

If you encounter issues:
- Check server logs on Railway
- Check client logs in browser console
- Verify all environment variables are set
- Test OAuth flows in incognito mode
- Check database for user records and FK constraints
