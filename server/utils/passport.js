import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { createUser, getUserByOAuth } from '../db.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

/**
 * Configure Google OAuth strategy
 */
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${SERVER_URL}/auth/google/callback`,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await getUserByOAuth('google', profile.id);

          if (!user) {
            // Create new user
            const displayName = profile.displayName || profile.emails?.[0]?.value?.split('@')[0] || 'User';
            const email = profile.emails?.[0]?.value || null;
            const avatarUrl = profile.photos?.[0]?.value || null;

            user = await createUser({
              oauthProvider: 'google',
              oauthId: profile.id,
              email,
              displayName,
              avatarUrl,
              isGuest: false
            });
          }

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

/**
 * Configure GitHub OAuth strategy
 */
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: `${SERVER_URL}/auth/github/callback`,
        scope: ['user:email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await getUserByOAuth('github', profile.id);

          if (!user) {
            // Create new user
            const displayName = profile.displayName || profile.username || 'User';
            const email = profile.emails?.[0]?.value || null;
            const avatarUrl = profile.photos?.[0]?.value || profile.avatar_url || null;

            user = await createUser({
              oauthProvider: 'github',
              oauthId: profile.id,
              email,
              displayName,
              avatarUrl,
              isGuest: false
            });
          }

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
} else {
  console.warn('GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
}

// Passport serialization (not used for JWT strategy but required by passport)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // Not needed for JWT-only auth
  done(null, { id });
});

export default passport;
