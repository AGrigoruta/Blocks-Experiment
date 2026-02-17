import pg from "pg";

const { Pool } = pg;

// PostgreSQL connection - requires DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL?.includes("localhost") ||
    process.env.DATABASE_URL?.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
});

// Create users table
pool
  .query(
    `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    oauth_provider VARCHAR(50) NOT NULL,
    oauth_id VARCHAR(255),
    email VARCHAR(255),
    display_name VARCHAR(100) NOT NULL,
    discriminator VARCHAR(10) NOT NULL,
    avatar_url TEXT,
    is_guest BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    UNIQUE(oauth_provider, oauth_id),
    UNIQUE(display_name, discriminator)
  )
`
  )
  .then(() => {
    console.log("Users table initialized");
    // Create indexes for performance
    return pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
      CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name, discriminator);
    `);
  })
  .then(() => {
    console.log("Users table indexes created");
    // Migration: Add custom_display_name column if it doesn't exist
    return pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='users' AND column_name='custom_display_name') THEN
          ALTER TABLE users ADD COLUMN custom_display_name VARCHAR(100);
        END IF;
      END $$;
    `);
  })
  .then(() => {
    console.log("Users table migrations completed");
  })
  .catch((err) => {
    console.error("Error initializing users table:", err);
  });

// Create matches table
pool
  .query(
    `
  CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    whiteName TEXT NOT NULL,
    blackName TEXT NOT NULL,
    winner TEXT NOT NULL,
    matchTime INTEGER NOT NULL,
    whiteNumberOfBlocks INTEGER NOT NULL,
    blackNumberOfBlocks INTEGER NOT NULL,
    matchEndTimestamp TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`
  )
  .then(() => {
    console.log("Matches table initialized");
    // Migration: Add user_id foreign keys if they don't exist
    return pool.query(`
      DO $$ 
      BEGIN
        -- Add white_user_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='matches' AND column_name='white_user_id') THEN
          ALTER TABLE matches ADD COLUMN white_user_id INTEGER REFERENCES users(id);
        END IF;
        
        -- Add black_user_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='matches' AND column_name='black_user_id') THEN
          ALTER TABLE matches ADD COLUMN black_user_id INTEGER REFERENCES users(id);
        END IF;
      END $$;
    `);
  })
  .then(() => {
    console.log("Matches table migrations completed");
  })
  .catch((err) => {
    console.error("Error initializing matches table:", err);
    console.error("Make sure DATABASE_URL environment variable is set");
  });

// Create custom_emojis table and handle migrations
pool
  .query(
    `
  CREATE TABLE IF NOT EXISTS custom_emojis (
    id SERIAL PRIMARY KEY,
    emoji TEXT NOT NULL,
    label TEXT NOT NULL CHECK (char_length(label) <= 50),
    uploadedBy TEXT NOT NULL CHECK (char_length(uploadedBy) <= 100),
    isImage BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emojiHash TEXT,
    UNIQUE(emojiHash)
  )
`
  )
  .then(() => {
    console.log("Custom emojis table initialized");
    // Migration: Add isImage column if it doesn't exist (for existing deployments)
    return pool.query(`
      DO $$ 
      BEGIN
        -- Add isImage column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='custom_emojis' AND column_name='isimage') THEN
          ALTER TABLE custom_emojis ADD COLUMN isImage BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Add emojiHash column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='custom_emojis' AND column_name='emojihash') THEN
          ALTER TABLE custom_emojis ADD COLUMN emojiHash TEXT;
        END IF;
        
        -- Drop old UNIQUE constraint on emoji if it exists
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_emojis_emoji_key') THEN
          ALTER TABLE custom_emojis DROP CONSTRAINT custom_emojis_emoji_key;
        END IF;
        
        -- Drop old CHECK constraint on emoji if it exists
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_emojis_emoji_check') THEN
          ALTER TABLE custom_emojis DROP CONSTRAINT custom_emojis_emoji_check;
        END IF;
        
        -- Add UNIQUE constraint on emojiHash if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_emojis_emojihash_key') THEN
          ALTER TABLE custom_emojis ADD CONSTRAINT custom_emojis_emojihash_key UNIQUE(emojiHash);
        END IF;
        
        -- Add uploaded_by_user_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='custom_emojis' AND column_name='uploaded_by_user_id') THEN
          ALTER TABLE custom_emojis ADD COLUMN uploaded_by_user_id INTEGER REFERENCES users(id);
        END IF;
      END $$;
    `);
  })
  .then(() => {
    console.log("Custom emojis table migrations completed");
  })
  .catch((err) => {
    console.error("Error initializing custom_emojis table:", err);
  });

/**
 * Save a match result to the database
 * @param {Object} match - Match data
 * @param {string} match.whiteName - Name of the white player
 * @param {string} match.blackName - Name of the black player
 * @param {number} match.whiteUserId - User ID of white player (optional, for authenticated users)
 * @param {number} match.blackUserId - User ID of black player (optional, for authenticated users)
 * @param {string} match.winner - Winner ('white', 'black', or 'draw')
 * @param {number} match.matchTime - Duration of the match in seconds
 * @param {number} match.whiteNumberOfBlocks - Number of blocks white player had
 * @param {number} match.blackNumberOfBlocks - Number of blocks black player had
 * @param {string} match.matchEndTimestamp - ISO timestamp string when the match ended
 * @returns {Object} The inserted match with its ID
 */
export async function saveMatch(match) {
  const query = `
    INSERT INTO matches (
      whiteName, 
      blackName,
      white_user_id,
      black_user_id,
      winner, 
      matchTime, 
      whiteNumberOfBlocks, 
      blackNumberOfBlocks, 
      matchEndTimestamp
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const values = [
    match.whiteName,
    match.blackName,
    match.whiteUserId || null,
    match.blackUserId || null,
    match.winner,
    match.matchTime,
    match.whiteNumberOfBlocks,
    match.blackNumberOfBlocks,
    match.matchEndTimestamp,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get all matches from the database
 * @param {number} limit - Maximum number of matches to return (default: 100)
 * @returns {Array} Array of match objects
 */
export async function getAllMatches(limit = 100) {
  const query = `
    SELECT * FROM matches 
    ORDER BY matchEndTimestamp DESC 
    LIMIT $1
  `;
  const result = await pool.query(query, [limit]);
  return result.rows;
}

/**
 * Get matches by player name
 * @param {string} playerName - Name of the player
 * @param {number} limit - Maximum number of matches to return (default: 50)
 * @returns {Array} Array of match objects
 */
export async function getMatchesByPlayer(playerName, limit = 50) {
  const query = `
    SELECT * FROM matches 
    WHERE whiteName = $1 OR blackName = $1
    ORDER BY matchEndTimestamp DESC 
    LIMIT $2
  `;
  const result = await pool.query(query, [playerName, limit]);
  return result.rows;
}

/**
 * Get match statistics for a player
 * @param {string} playerName - Name of the player
 * @returns {Object} Statistics object with wins, losses, draws, averages
 */
export async function getPlayerStats(playerName) {
  const query = `
    SELECT 
      COUNT(*)::int as "totalMatches",
      SUM(CASE WHEN winner = 'white' AND whiteName = $1 THEN 1 
               WHEN winner = 'black' AND blackName = $1 THEN 1 
               ELSE 0 END)::int as wins,
      SUM(CASE WHEN winner = 'draw' THEN 1 ELSE 0 END)::int as draws,
      SUM(CASE WHEN winner = 'white' AND blackName = $1 THEN 1 
               WHEN winner = 'black' AND whiteName = $1 THEN 1 
               ELSE 0 END)::int as losses,
      COALESCE(AVG(matchTime), 0)::float as "avgMatchTime",
      COALESCE(AVG(CASE 
        WHEN whiteName = $1 THEN whiteNumberOfBlocks 
        ELSE blackNumberOfBlocks 
      END), 0)::float as "avgBlocks"
    FROM matches
    WHERE whiteName = $1 OR blackName = $1
  `;
  const result = await pool.query(query, [playerName]);
  return result.rows[0];
}

/**
 * Get leaderboard with top players by wins (authenticated users only)
 * @param {number} limit - Maximum number of players to return (default: 10)
 * @returns {Array} Array of player objects with stats
 */
export async function getLeaderboard(limit = 10) {
  const query = `
    WITH user_stats AS (
      SELECT 
        u.id,
        u.display_name,
        u.discriminator,
        u.avatar_url,
        u.oauth_provider,
        u.is_guest,
        u.custom_display_name,
        COUNT(m.id)::int as "totalMatches",
        SUM(CASE 
          WHEN m.winner = 'white' AND m.white_user_id = u.id THEN 1 
          WHEN m.winner = 'black' AND m.black_user_id = u.id THEN 1 
          ELSE 0 
        END)::int as wins,
        SUM(CASE WHEN m.winner = 'draw' THEN 1 ELSE 0 END)::int as draws,
        SUM(CASE 
          WHEN m.winner = 'white' AND m.black_user_id = u.id THEN 1 
          WHEN m.winner = 'black' AND m.white_user_id = u.id THEN 1 
          ELSE 0 
        END)::int as losses
      FROM users u
      LEFT JOIN matches m ON (m.white_user_id = u.id OR m.black_user_id = u.id)
      GROUP BY u.id, u.display_name, u.discriminator, u.avatar_url, u.oauth_provider, u.is_guest, u.custom_display_name
    )
    SELECT 
      display_name as "displayName",
      discriminator,
      avatar_url as "avatarUrl",
      oauth_provider as "oauthProvider",
      custom_display_name as "customDisplayName",
      is_guest as "isGuest",
      "totalMatches",
      wins,
      draws,
      losses,
      CASE 
        WHEN "totalMatches" > 0 THEN ROUND(((wins::float / "totalMatches"::float) * 100)::numeric, 1)
        ELSE 0 
      END as "winRate"
    FROM user_stats
    WHERE "totalMatches" > 0
    ORDER BY wins DESC, "winRate" DESC, "totalMatches" DESC
    LIMIT $1
  `;
  const result = await pool.query(query, [limit]);
  return result.rows;
}

/**
 * Save a custom emoji to the database
 * @param {Object} emoji - Emoji data
 * @param {string} emoji.emoji - The emoji character(s) or image data URL
 * @param {string} emoji.label - Label/description for the emoji
 * @param {string} emoji.uploadedBy - Name of the user who uploaded it (for display)
 * @param {number} emoji.uploadedByUserId - User ID who uploaded it (optional, for authenticated users)
 * @param {boolean} emoji.isImage - Whether this is an image (true) or emoji unicode (false)
 * @returns {Object|null} The inserted emoji object or null if emoji already exists
 */
export async function saveCustomEmoji(emoji) {
  const crypto = await import("crypto");
  
  // Ensure fields are trimmed before saving to the database
  const trimmedEmoji = typeof emoji.emoji === "string" ? emoji.emoji.trim() : emoji.emoji;
  const trimmedLabel = typeof emoji.label === "string" ? emoji.label.trim() : emoji.label;
  const trimmedUploadedBy = typeof emoji.uploadedBy === "string" ? emoji.uploadedBy.trim() : emoji.uploadedBy;
  const isImage = emoji.isImage || false;
  const uploadedByUserId = emoji.uploadedByUserId || null;

  // Generate hash for uniqueness checking (avoids btree index size limits with large data URLs)
  const emojiHash = crypto.createHash("sha256").update(trimmedEmoji).digest("hex");

  // Insert new emoji atomically; if hash already exists, do nothing
  const insertQuery = `
    INSERT INTO custom_emojis (emoji, label, uploadedBy, uploaded_by_user_id, isImage, emojiHash)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (emojiHash) DO NOTHING
    RETURNING *
  `;

  const values = [trimmedEmoji, trimmedLabel, trimmedUploadedBy, uploadedByUserId, isImage, emojiHash];
  const result = await pool.query(insertQuery, values);

  // If no row was returned, the emoji already existed
  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Get all custom emojis from the database
 * @returns {Array} Array of custom emoji objects
 */
export async function getAllCustomEmojis() {
  const query = `
    SELECT id, emoji, label, uploadedBy, isImage, createdAt
    FROM custom_emojis
    ORDER BY createdAt ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Create a new user (OAuth or Guest)
 * @param {Object} userData - User data
 * @param {string} userData.oauthProvider - 'google', 'github', or 'guest'
 * @param {string} userData.oauthId - OAuth provider's user ID (null for guests)
 * @param {string} userData.email - User email (null for guests)
 * @param {string} userData.displayName - User's chosen display name
 * @param {string} userData.avatarUrl - Profile picture URL (optional)
 * @param {boolean} userData.isGuest - Whether this is a guest account
 * @returns {Object} The created user with discriminator
 */
export async function createUser(userData) {
  const { oauthProvider, oauthId, email, displayName, avatarUrl, isGuest } = userData;
  
  // For OAuth users, check if they already exist
  if (!isGuest && oauthId) {
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
      [oauthProvider, oauthId]
    );
    
    if (existingUser.rows.length > 0) {
      // Update last login time
      const updatedUser = await pool.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [existingUser.rows[0].id]
      );
      return updatedUser.rows[0];
    }
  }
  
  // Try to create user with retry logic for race conditions
  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Generate discriminator for display name uniqueness
      const discriminator = await generateDiscriminator(displayName);
      
      const query = `
        INSERT INTO users (
          oauth_provider,
          oauth_id,
          email,
          display_name,
          discriminator,
          avatar_url,
          is_guest,
          last_login_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [
        oauthProvider,
        oauthId,
        email,
        displayName,
        discriminator,
        avatarUrl || null,
        isGuest || false
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      // If unique constraint violation on (display_name, discriminator), retry
      if (error.code === '23505' && error.constraint === 'users_display_name_discriminator_key') {
        if (attempt === maxRetries - 1) {
          throw new Error('Failed to generate unique discriminator after multiple attempts');
        }
        // Retry with a small delay
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        continue;
      }
      // For other errors, throw immediately
      throw error;
    }
  }
}

/**
 * Generate a unique discriminator for a display name (Discord-style)
 * Uses retry logic to handle race conditions when multiple users register simultaneously
 * @param {string} displayName - The display name
 * @param {number} maxRetries - Maximum number of retries (default: 5)
 * @returns {string} A 4-digit discriminator (e.g., "0001")
 */
async function generateDiscriminator(displayName, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Get all existing discriminators for this display name
    const result = await pool.query(
      'SELECT discriminator FROM users WHERE display_name = $1 ORDER BY discriminator',
      [displayName]
    );
    
    const existingDiscriminators = new Set(result.rows.map(row => row.discriminator));
    
    // Find the first available discriminator from 0001 to 9999
    for (let i = 1; i <= 9999; i++) {
      const discriminator = i.toString().padStart(4, '0');
      if (!existingDiscriminators.has(discriminator)) {
        // Try to use this discriminator
        // The UNIQUE constraint on (display_name, discriminator) will prevent duplicates
        // If another process grabbed it, we'll get a constraint violation and retry
        return discriminator;
      }
    }
  }
  
  // If all discriminators are taken (very unlikely), throw error
  throw new Error(`All discriminators for display name "${displayName}" are taken`);
}

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Object|null} User object or null if not found
 */
export async function getUserById(userId) {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Update user's custom display name
 * @param {number} userId - User ID
 * @param {string} customDisplayName - New custom display name (or null to use OAuth name)
 * @returns {Object} Updated user object
 */
export async function updateUserDisplayName(userId, customDisplayName) {
  // Validate display name
  if (customDisplayName !== null) {
    if (typeof customDisplayName !== 'string' || customDisplayName.trim().length === 0) {
      throw new Error('Display name cannot be empty');
    }
    
    if (customDisplayName.trim().length > 100) {
      throw new Error('Display name cannot exceed 100 characters');
    }
    
    // Trim and normalize
    customDisplayName = customDisplayName.trim();
  }
  
  const query = `
    UPDATE users 
    SET custom_display_name = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $2 
    RETURNING *
  `;
  
  const result = await pool.query(query, [customDisplayName, userId]);
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0];
}

/**
 * Get user by OAuth provider and ID
 * @param {string} oauthProvider - OAuth provider ('google' or 'github')
 * @param {string} oauthId - OAuth provider's user ID
 * @returns {Object|null} User object or null if not found
 */
export async function getUserByOAuth(oauthProvider, oauthId) {
  const query = 'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2';
  const result = await pool.query(query, [oauthProvider, oauthId]);
  return result.rows[0] || null;
}

/**
 * Update user's display name
 * @param {number} userId - User ID
 * @param {string} newDisplayName - New display name
 * @returns {Object} Updated user object
 */
export async function updateDisplayName(userId, newDisplayName) {
  // Generate new discriminator for the new name
  const discriminator = await generateDiscriminator(newDisplayName);
  
  const query = `
    UPDATE users 
    SET display_name = $1, discriminator = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await pool.query(query, [newDisplayName, discriminator, userId]);
  return result.rows[0];
}

/**
 * Migrate existing player names to guest accounts
 * This should be run once during deployment
 * @returns {Object} Migration statistics
 */
export async function migrateExistingPlayersToGuests() {
  try {
    // Get all unique player names from matches
    const playerNames = await pool.query(`
      SELECT DISTINCT name FROM (
        SELECT whiteName as name FROM matches
        UNION
        SELECT blackName as name FROM matches
      ) AS all_names
      WHERE name IS NOT NULL AND name != ''
      ORDER BY name
    `);
    
    let created = 0;
    let skipped = 0;
    
    for (const { name } of playerNames.rows) {
      try {
        // Check if a guest with this display name already exists
        const existing = await pool.query(
          'SELECT id FROM users WHERE display_name = $1 AND is_guest = true LIMIT 1',
          [name]
        );
        
        if (existing.rows.length === 0) {
          // Create guest account for this player
          const user = await createUser({
            oauthProvider: 'guest',
            oauthId: null,
            email: null,
            displayName: name,
            avatarUrl: null,
            isGuest: true
          });
          
          // Update matches with this user_id
          await pool.query(`
            UPDATE matches
            SET white_user_id = $1
            WHERE whiteName = $2 AND white_user_id IS NULL
          `, [user.id, name]);
          
          await pool.query(`
            UPDATE matches
            SET black_user_id = $1
            WHERE blackName = $2 AND black_user_id IS NULL
          `, [user.id, name]);
          
          created++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`Error migrating player "${name}":`, err.message);
      }
    }
    
    return {
      success: true,
      created,
      skipped,
      total: playerNames.rows.length
    };
  } catch (err) {
    console.error('Error in migrateExistingPlayersToGuests:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Get user stats by user ID (replaces getPlayerStats for authenticated users)
 * @param {number} userId - User ID
 * @returns {Object} Statistics object
 */
export async function getUserStats(userId) {
  const query = `
    SELECT 
      COUNT(*)::int as "totalMatches",
      SUM(CASE WHEN winner = 'white' AND white_user_id = $1 THEN 1 
               WHEN winner = 'black' AND black_user_id = $1 THEN 1 
               ELSE 0 END)::int as wins,
      SUM(CASE WHEN winner = 'draw' THEN 1 ELSE 0 END)::int as draws,
      SUM(CASE WHEN winner = 'white' AND black_user_id = $1 THEN 1 
               WHEN winner = 'black' AND white_user_id = $1 THEN 1 
               ELSE 0 END)::int as losses,
      COALESCE(AVG(matchTime), 0)::float as "avgMatchTime",
      COALESCE(AVG(CASE 
        WHEN white_user_id = $1 THEN whiteNumberOfBlocks 
        ELSE blackNumberOfBlocks 
      END), 0)::float as "avgBlocks"
    FROM matches
    WHERE white_user_id = $1 OR black_user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

export default pool;
