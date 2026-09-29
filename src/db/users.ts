import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users, profiles } from './schema.ts';

const PRIMARY_ADMIN_EMAILS = ['princeabba96@gmail.com'];

// Cache synced users in memory for 90 seconds so concurrent API requests
// do not execute 3 redundant DB writes/reads on every single HTTP call.
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

  try {
    await db
      .insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      });

    const existingProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, uid));

    const isAdminUser = isPrimaryAdminIdentity(email);

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
      // Update lastSeenAt asynchronously in background so it doesn't block the request
      db.update(profiles)
        .set({ lastSeenAt: new Date() })
        .where(eq(profiles.id, uid))
        .catch(() => {});

      syncedUserCache.set(uid, { profile: existing, syncedAt: Date.now() });
      return existing;
    }

    const emailPrefix =
      email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
    const uniqueSuffix = uid.slice(-4).replace(/[^a-zA-Z0-9]/g, 'x').toLowerCase();
    const generatedUsername = isAdminUser ? 'Abba' : `${emailPrefix}_${uniqueSuffix}`;
    const resolvedDisplayName = isAdminUser
      ? 'Prince Abba'
      : displayName && displayName.trim().length > 0
        ? displayName.trim()
        : emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

    const inserted = await db
      .insert(profiles)
      .values({
        id: uid,
        email,
        username: generatedUsername,
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
          email,
          lastSeenAt: new Date(),
        },
      })
      .returning();

    syncedUserCache.set(uid, { profile: inserted[0], syncedAt: Date.now() });
    return inserted[0];
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
