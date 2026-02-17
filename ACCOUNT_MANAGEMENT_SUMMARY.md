# Account Management - Quick Summary

## Current Problem

❌ **Users just type their name** → Anyone can impersonate anyone  
❌ **No verification** → Stats and leaderboard can be manipulated  
❌ **No data ownership** → Can't prove who uploaded what  
❌ **Typos cause issues** → "John" vs "Jhon" counted as different players  

## Proposed Solution

### 🔐 OAuth 2.0 Authentication (RECOMMENDED)

**Sign in with Google or GitHub** - Let trusted platforms handle security.

```
┌─────────────────────────────────────┐
│  User clicks "Sign in with Google"  │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Google verifies identity           │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  App receives verified user info    │
│  Creates secure JWT token           │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  User plays with verified identity  │
│  Stats tracked to real account      │
└─────────────────────────────────────┘
```

### 🎮 Guest Mode (Optional)

For casual play without creating an account:
- Quick "Play as Guest" button
- Choose display name
- Stats saved to temporary guest account
- Can upgrade to full account later to keep stats

## Key Benefits

### Security ✅
- **No impersonation** - Identity verified by Google/GitHub
- **No password storage** - Google handles that (less liability)
- **Trusted login** - Users already trust these platforms
- **2FA support** - Inherited from provider

### User Experience ✅
- **One-click login** - Fast and familiar
- **No new passwords** - Use existing accounts
- **Profile pictures** - From OAuth provider
- **Persistent identity** - Same name across devices

### Data Integrity ✅
- **Accurate leaderboards** - No duplicate/fake accounts
- **Stat ownership** - Tied to verified accounts
- **Content attribution** - Know who uploaded emojis
- **GDPR compliant** - Proper data management

## What Changes for Users?

### Before
```
1. Open game
2. Type any name
3. Start playing
```

### After (With Guest Mode)
```
1. Open game
2. Choose:
   - "Sign in with Google" → Verified account
   - "Sign in with GitHub" → Verified account  
   - "Play as Guest" → Temporary account
3. Start playing
```

### After (Authentication Required)
```
1. Open game
2. Sign in with Google or GitHub
3. Start playing
```

## Implementation Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Database & Schema | New users table, migrations |
| **Week 2** | Backend Auth | OAuth setup, JWT tokens, API routes |
| **Week 3** | Frontend & Socket.io | Login UI, auth flows, secure connections |
| **Week 4** | Security & Testing | Rate limiting, testing, deployment |

**Total: ~4 weeks for full implementation**

## Database Changes

### New Table: `users`
```sql
users
├── id (unique user ID)
├── oauth_provider (google/github/guest)
├── oauth_id (external ID)
├── email
├── display_name (what others see)
├── avatar_url (profile pic)
└── created_at
```

### Updated Tables
- `matches` → Add `white_user_id` and `black_user_id` (links to users)
- `custom_emojis` → Add `uploaded_by_user_id` (links to users)

### Migration Strategy
- Convert existing player names to guest accounts
- Preserve all historical data
- 30-day transition period

## Security Features

1. **JWT Tokens** - Secure, stateless authentication
2. **HttpOnly Cookies** - Protection against XSS attacks
3. **Rate Limiting** - Prevent brute force attacks
4. **Input Validation** - Prevent injection attacks
5. **HTTPS Only** - Encrypted communication
6. **Token Expiration** - Auto-logout after inactivity
7. **CORS Protection** - Whitelist allowed origins
8. **Helmet.js** - Security headers

## Cost Impact

💰 **Almost Zero Additional Cost**
- OAuth is free (Google/GitHub)
- Minimal database increase (<1GB for thousands of users)
- No email service needed (unless custom auth)
- Negligible compute overhead

## Questions to Decide

Before implementation, please clarify:

1. **OAuth Providers**: Google + GitHub, or just one to start?
2. **Guest Play**: Allow guests, or require authentication?
3. **Display Names**: Unique names, or allow duplicates?
4. **Existing Data**: Convert to guest accounts, or start fresh?
5. **Timeline**: Is 4 weeks acceptable?
6. **Privacy**: Need privacy policy/terms of service?
7. **Custom Auth**: Want email/password option too?

## Alternative: Custom Email/Password

If you prefer not to use OAuth:

### Pros
- ✅ Full control over user experience
- ✅ No third-party dependencies
- ✅ Custom registration fields

### Cons
- ❌ Must store and secure passwords
- ❌ Must implement email verification
- ❌ Must handle password resets
- ❌ More complex, more liability
- ❌ Requires email service ($10-20/month)
- ❌ Takes longer to implement (6-8 weeks)

**Not recommended** unless there's a specific reason to avoid OAuth.

## Recommended Approach

🎯 **Start with OAuth (Google + GitHub) + Guest Mode**

Why?
- Fastest to implement (4 weeks)
- Most secure (outsource to experts)
- Best user experience (one-click login)
- Lowest maintenance burden
- Still accessible (guest mode for casual play)

## Next Steps

1. **Review this proposal** - Any questions or concerns?
2. **Answer clarification questions** - See list above
3. **Approve approach** - OAuth + Guest vs. Custom vs. OAuth only
4. **Begin implementation** - Start with database migrations

---

📄 **Full Technical Details**: See `ACCOUNT_MANAGEMENT_PROPOSAL.md` for complete architecture, code examples, and implementation details.

---

## Questions?

Feel free to ask for:
- Clarification on any technical aspects
- Alternative approaches
- Specific implementation details
- Security considerations
- User experience mockups
- Testing strategies
- Deployment procedures

I'm ready to begin implementation once you provide feedback and approve the approach! 🚀
