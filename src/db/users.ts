import { eq } from 'drizzle-orm';
import { db, pool } from './index.ts';
import { users, profiles } from './schema.ts';

const PRIMARY_ADMIN_EMAILS = ['princeabba96@gmail.com'];

// Cache synced users in memory for 90 seconds so concurrent API requests
// do not execute redundant DB writes/reads on every single HTTP call.
const syncedUserCache = new Map<
  string,
  { profile: typeof profiles.$inferSelect; syncedAt: number }
>();
const SYNC_TTL_MS = 90_000;

export function invalidateUserCache(uid: string) {
  syncedUserCache.delete(uid);
}

function isPrimaryAdminIdentity(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return PRIMARY_ADMIN_EMAILS.includes(normalizedEmail);
}

const FK_REFS: { table: string; col: string }[] = [
  { table: 'communities', col: 'creator_id' },
  { table: 'community_members', col: 'user_id' },
  { table: 'community_posts', col: 'user_id' },
  { table: 'content_feedback', col: 'user_id' },
  { table: 'creator_rewards', col: 'user_id' },
  { table: 'follows', col: 'follower_id' },
  { table: 'follows', col: 'following_id' },
  { table: 'friendships', col: 'requester_id' },
  { table: 'friendships', col: 'addressee_id' },
  { table: 'media_storage', col: 'user_id' },
  { table: 'messages', col: 'sender_id' },
  { table: 'messages', col: 'receiver_id' },
  { table: 'notifications', col: 'user_id' },
  { table: 'notifications', col: 'actor_id' },
  { table: 'post_comments', col: 'user_id' },
  { table: 'post_likes', col: 'user_id' },
  { table: 'post_shares', col: 'user_id' },
  { table: 'posts', col: 'user_id' },
  { table: 'saved_posts', col: 'user_id' },
  { table: 'stories', col: 'user_id' },
  { table: 'story_reactions', col: 'user_id' },
  { table: 'story_replies', col: 'user_id' },
  { table: 'story_views', col: 'viewer_id' },
  { table: 'user_badges', col: 'user_id' },
  { table: 'user_interests', col: 'user_id' },
  { table: 'user_missions', col: 'user_id' },
  { table: 'video_watch_history', col: 'user_id' },
  { table: 'push_subscriptions', col: 'user_id' },
  { table: 'gift_transactions', col: 'sender_id' },
  { table: 'gift_transactions', col: 'receiver_id' },
  { table: 'user_shop_inventory', col: 'user_id' },
];

/**
 * Atomically migrate an existing profile row and all referencing records
 * from an old identifier (e.g., seeded ID) to a new Firebase Auth UID.
 */
async function migrateProfileId(oldId: string, newUid: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    const oldRes = await client.query('SELECT * FROM profiles WHERE id = $1', [oldId]);
    if (oldRes.rows.length === 0) {
      await client.query('ROLLBACK;');
      return;
    }
    const oldProfile = oldRes.rows[0];

    // Check if newUid profile already exists
    const newRes = await client.query('SELECT id FROM profiles WHERE id = $1', [newUid]);
    if (newRes.rows.length > 0) {
      // Both exist: re-point references from oldId to newUid
      for (const ref of FK_REFS) {
        try {
          await client.query(
            `UPDATE "${ref.table}" SET "${ref.col}" = $1 WHERE "${ref.col}" = $2`,
            [newUid, oldId]
          );
        } catch {
          // ignore individual FK if table or column doesn't match
        }
      }
      await client.query('DELETE FROM profiles WHERE id = $1', [oldId]);
      await client.query('DELETE FROM users WHERE uid = $1', [oldId]);
      await client.query('COMMIT;');
      return;
    }

    // Temporarily rename old username to avoid UNIQUE(username) conflict during swap
    const tempUsername = `_migrating_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await client.query('UPDATE profiles SET username = $1 WHERE id = $2', [tempUsername, oldId]);

    // Insert new profile under newUid with original username and attributes
    const cols = Object.keys(oldProfile).filter((k) => k !== 'id');
    const newValues = [
      newUid,
      ...cols.map((k) => (k === 'username' ? oldProfile.username : oldProfile[k])),
    ];
    const placeholders = newValues.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = ['id', ...cols].map((c) => `"${c}"`).join(', ');

    await client.query(
      `INSERT INTO profiles (${colNames}) VALUES (${placeholders}) ON CONFLICT ("id") DO NOTHING`,
      newValues
    );

    // Re-link all referencing tables
    for (const ref of FK_REFS) {
      try {
        await client.query(
          `UPDATE "${ref.table}" SET "${ref.col}" = $1 WHERE "${ref.col}" = $2`,
          [newUid, oldId]
        );
      } catch {
        // ignore non-critical FK errors
      }
    }

    // Remove obsolete profile and user records
    await client.query('DELETE FROM profiles WHERE id = $1', [oldId]);
    await client.query('DELETE FROM users WHERE uid = $1', [oldId]);

    await client.query('COMMIT;');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.warn('Profile migration notice:', err);
  } finally {
    client.release();
  }
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  avatarUrl?: string
) {
  const cached = syncedUserCache.get(uid);
  if (cached && Date.now() - cached.syncedAt < SYNC_TTL_MS && !displayName && !avatarUrl) {
    return cached.profile;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAdminUser = isPrimaryAdminIdentity(normalizedEmail);

  try {
    // 1. Sync users table record
    await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
        },
      });

    // 2. Look up profile by primary ID
    let existingProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, uid));

    // 3. If not found by UID, check if an existing profile row exists with this email
    if (existingProfiles.length === 0) {
      const profileByEmail = await db
        .select()
        .from(profiles)
        .where(eq(profiles.email, normalizedEmail));

      if (profileByEmail.length > 0) {
        const oldProfile = profileByEmail[0];
        if (oldProfile.id !== uid) {
          await migrateProfileId(oldProfile.id, uid);
          existingProfiles = await db
            .select()
            .from(profiles)
            .where(eq(profiles.id, uid));
        }
      }
    }

    // 4. Handle existing profile update
    if (existingProfiles.length > 0) {
      const existing = existingProfiles[0];
      if (
        isAdminUser &&
        (!existing.isAdmin ||
          existing.role !== 'admin' ||
          existing.displayName !== 'Prince Abba' ||
          existing.username !== 'Abba' ||
          existing.boostPoints < 999999999)
      ) {
        const updated = await db
          .update(profiles)
          .set({
            displayName: 'Prince Abba',
            username: 'Abba',
            isAdmin: true,
            role: 'admin',
            isVerified: true,
            boostPoints: 999999999,
            showcaseGifts:
              existing.showcaseGifts || 'crown,diamond,rocket,trophy',
            lastSeenAt: new Date(),
          })
          .where(eq(profiles.id, uid))
          .returning();
        syncedUserCache.set(uid, { profile: updated[0], syncedAt: Date.now() });
        return updated[0];
      }
      if (!isAdminUser && (existing.isAdmin || existing.role === 'admin')) {
        const updated = await db
          .update(profiles)
          .set({
            isAdmin: false,
            role: 'user',
            lastSeenAt: new Date(),
          })
          .where(eq(profiles.id, uid))
          .returning();
        syncedUserCache.set(uid, { profile: updated[0], syncedAt: Date.now() });
        return updated[0];
      }

      // Update lastSeenAt asynchronously
      db.update(profiles)
        .set({ lastSeenAt: new Date() })
        .where(eq(profiles.id, uid))
        .catch(() => {});

      syncedUserCache.set(uid, { profile: existing, syncedAt: Date.now() });
      return existing;
    }

    // 5. Generate collision-resistant unique username
    const emailPrefix =
      normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
    const uniqueSuffix = uid.slice(-4).replace(/[^a-zA-Z0-9]/g, 'x').toLowerCase();
    let candidateUsername = isAdminUser ? 'Abba' : `${emailPrefix}_${uniqueSuffix}`;

    // Verify username uniqueness
    const existingWithUsername = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.username, candidateUsername));

    if (existingWithUsername.length > 0 && existingWithUsername[0].id !== uid) {
      candidateUsername = isAdminUser
        ? 'Abba'
        : `${emailPrefix}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const resolvedDisplayName = isAdminUser
      ? 'Prince Abba'
      : displayName && displayName.trim().length > 0
        ? displayName.trim()
        : emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

    try {
      const inserted = await db
        .insert(profiles)
        .values({
          id: uid,
          email: normalizedEmail,
          username: candidateUsername,
          displayName: resolvedDisplayName,
          avatarUrl: avatarUrl || '',
          bio: isAdminUser ? 'Primary Administrator of BoostHub' : '',
          role: isAdminUser ? 'admin' : 'user',
          isAdmin: isAdminUser,
          isVerified: isAdminUser,
          boostPoints: isAdminUser ? 999999999 : 0,
          showcaseGifts: isAdminUser ? 'crown,diamond,rocket,trophy' : '',
          onboardingCompleted: false,
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: {
            email: normalizedEmail,
            lastSeenAt: new Date(),
          },
        })
        .returning();

      syncedUserCache.set(uid, { profile: inserted[0], syncedAt: Date.now() });
      return inserted[0];
    } catch (insertError) {
      // Resilient fallback in case of concurrency or race condition
      const fallback = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, uid));

      if (fallback.length > 0) {
        syncedUserCache.set(uid, { profile: fallback[0], syncedAt: Date.now() });
        return fallback[0];
      }

      const fallbackEmail = await db
        .select()
        .from(profiles)
        .where(eq(profiles.email, normalizedEmail));

      if (fallbackEmail.length > 0) {
        syncedUserCache.set(uid, { profile: fallbackEmail[0], syncedAt: Date.now() });
        return fallbackEmail[0];
      }

      throw insertError;
    }
  } catch (error) {
    console.warn('Notice in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function getProfileById(uid: string) {
  try {
    const rows = await db.select().from(profiles).where(eq(profiles.id, uid));
    return rows[0] || null;
  } catch (error) {
    console.warn('Notice in getProfileById:', error);
    throw new Error('Failed to load user profile.', { cause: error });
  }
}
