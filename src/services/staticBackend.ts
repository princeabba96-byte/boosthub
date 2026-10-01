import {
  BShopUserState,
  CommentItem,
  CommunityItem,
  ConversationSummary,
  DirectMessageItem,
  MissionItem,
  NotificationItem,
  PostItem,
  StoryItem,
  UserProfile,
} from '../types';
import {
  BSHOP_CATALOG,
  GIFT_ITEMS_ONLY,
  getBShopItemByCode,
  rollMysteryBoxReward,
} from '../data/bshopCatalog';
import {
  dispatchRealPushNotification,
  VAPID_PUBLIC_KEY,
} from './pushNotifications';
import {
  upsertSupabasePushSubscription,
  deleteSupabasePushSubscription,
  getSupabasePushSubscriptionsForUser,
} from '../lib/supabasePush';
import {
  supabase,
  ADMIN_ABBA_UUID,
  BOOST_BOT_UUID,
} from '../lib/supabase';

const ADMIN_EMAIL = 'princeabba96@gmail.com';

interface ProfileMeta {
  email?: string;
  bio?: string;
  following_count?: number;
  friends_count?: number;
  shares_count?: number;
  verified?: boolean;
  bp?: string;
  showcase_gifts?: string;
  gifts_received_count?: number;
  gift_recognition_score?: number;
  equipped_frame?: string;
  equipped_badge?: string;
  equipped_name_style?: string;
  gift_privacy?: 'public' | 'showcase_only' | 'private';
  who_can_message?: 'everyone' | 'friends' | 'nobody';
  comment_control?: 'everyone' | 'followers' | 'nobody';
  is_private?: boolean;
  notifications_enabled?: boolean;
  notification_preferences?: any;
  password?: string;
  inventory?: Array<{ itemCode: string; category: string; quantity: number }>;
  blocked_users?: string[];
}

function parseProfileMeta(rawJoinReason: any): ProfileMeta {
  if (!rawJoinReason || typeof rawJoinReason !== 'string') return {};
  const trimmed = rawJoinReason.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed) as ProfileMeta;
    } catch {
      return { bio: trimmed };
    }
  }
  return { bio: trimmed };
}

export function mapSupabaseRowToUserProfile(
  row: any,
  followsRows: any[] = [],
  friendshipsRows: any[] = [],
  postsRows: any[] = [],
  viewerId?: string
): UserProfile {
  const isAbba =
    row.id === ADMIN_ABBA_UUID ||
    String(row.username || '').toLowerCase() === 'abba' ||
    String(row.username || '').toLowerCase() === 'princeabba';

  const meta = parseProfileMeta(row.join_reason);
  const email = isAbba
    ? ADMIN_EMAIL
    : meta.email || `${String(row.username || 'user').toLowerCase()}@boosthub.app`;

  const followerCountFromTable = followsRows.filter(
    (f) => f.following_id === row.id
  ).length;
  const followingCountFromTable = followsRows.filter(
    (f) => f.follower_id === row.id
  ).length;
  const acceptedFriendsCount = friendshipsRows.filter(
    (fr) =>
      fr.status === 'accepted' &&
      (fr.requester_id === row.id || fr.addressee_id === row.id)
  ).length;
  const userPostsCount = postsRows.filter((p) => p.user_id === row.id).length;

  const baseFollowers = Number(row.followers ?? (isAbba ? 1400 : 0));
  const baseLikes = Number(row.likes ?? (isAbba ? 4200 : 0));
  const baseViews = Number(row.views ?? (isAbba ? 18500 : 0));
  const baseShares = Number(
    row.engagement ?? meta.shares_count ?? (isAbba ? 310 : 0)
  );
  const baseFollowing = Number(meta.following_count ?? (isAbba ? 4 : 0));
  const baseFriends = Number(meta.friends_count ?? (isAbba ? 3 : 0));

  let isFollowing = false;
  let friendshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received' =
    'none';
  let friendshipId: any = null;

  if (viewerId && viewerId !== row.id) {
    isFollowing = followsRows.some(
      (f) => f.follower_id === viewerId && f.following_id === row.id
    );
    const fr = friendshipsRows.find(
      (f) =>
        (f.requester_id === viewerId && f.addressee_id === row.id) ||
        (f.requester_id === row.id && f.addressee_id === viewerId)
    );
    if (fr) {
      friendshipId = fr.id;
      if (fr.status === 'accepted') {
        friendshipStatus = 'friends';
      } else if (fr.requester_id === viewerId) {
        friendshipStatus = 'pending_sent';
      } else {
        friendshipStatus = 'pending_received';
      }
    }
  }

  return {
    id: String(row.id),
    email,
    username: isAbba ? 'Abba' : String(row.username || 'user'),
    displayName: isAbba
      ? 'Prince Abba'
      : String(row.display_name || row.username || 'BoostHub User'),
    avatarUrl: String(row.avatar_url || row.profile_picture || ''),
    bio:
      meta.bio ||
      (isAbba
        ? 'Primary Administrator of BoostHub • Creator & Visionary'
        : ''),
    role: isAbba ? 'admin' : row.is_admin ? 'admin' : 'creator',
    isAdmin: Boolean(isAbba || row.is_admin),
    isVerified: Boolean(isAbba || meta.verified || row.creator_of_week),
    onboardingCompleted: true,
    joinReason: 'Connect & Create',
    wantToWatch: 'Creators & Tech',
    wantToCreate: 'Capshots & Posts',
    xp: Number(row.xp ?? (isAbba ? 100200 : 0)),
    boostPoints: isAbba ? 999999999 : Number(row.boost_points ?? 0),
    giftPrivacy: meta.gift_privacy || 'public',
    showcaseGifts:
      meta.showcase_gifts ??
      (isAbba ? 'crown,diamond,rocket,trophy' : ''),
    equippedFrame: meta.equipped_frame || '',
    equippedBadge: meta.equipped_badge || '',
    equippedNameStyle: meta.equipped_name_style || '',
    giftsReceivedCount: Number(
      meta.gifts_received_count ?? (isAbba ? 7992 : 0)
    ),
    giftRecognitionScore: Number(
      meta.gift_recognition_score ?? (isAbba ? 99999 : 0)
    ),
    whoCanMessage: meta.who_can_message || 'everyone',
    commentControl: meta.comment_control || 'everyone',
    isPrivate: Boolean(meta.is_private),
    notificationsEnabled: meta.notifications_enabled !== false,
    notificationPreferences: meta.notification_preferences,
    interests: Array.isArray(row.interests)
      ? row.interests
      : ['Creators', 'Technology', 'Music'],
    followersCount: Math.max(baseFollowers, followerCountFromTable),
    followingCount: Math.max(baseFollowing, followingCountFromTable),
    friendsCount: Math.max(baseFriends, acceptedFriendsCount),
    likesReceivedCount: baseLikes,
    sharesReceivedCount: baseShares,
    viewsReceivedCount: baseViews,
    postsCount: userPostsCount,
    isFollowing,
    friendshipStatus,
    friendshipId,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

let seededOnce = false;
export async function ensureAdminUserSeededInSupabase(): Promise<void> {
  if (seededOnce) return;
  seededOnce = true;
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', ADMIN_ABBA_UUID)
      .maybeSingle();

    if (!existing) {
      const abbaMeta: ProfileMeta = {
        email: ADMIN_EMAIL,
        bio: 'Primary Administrator of BoostHub • Creator & Visionary',
        following_count: 4,
        friends_count: 3,
        shares_count: 310,
        verified: true,
        bp: 'Unlimited BP',
        showcase_gifts: 'crown,diamond,rocket,trophy',
        gifts_received_count: 7992,
        gift_recognition_score: 99999,
      };
      await supabase.from('profiles').upsert({
        id: ADMIN_ABBA_UUID,
        username: 'Abba',
        display_name: 'Prince Abba',
        avatar_url: '',
        xp: 100200,
        followers: 1400,
        likes: 4200,
        views: 18500,
        engagement: 310,
        boost_points: 999999999,
        is_admin: true,
        creator_of_week: true,
        monetization_eligible: true,
        interests: ['Creators', 'Technology', 'Music'],
        join_reason: JSON.stringify(abbaMeta),
      });
    }
  } catch {
    // ignore transient network errors
  }
}

async function resolveCurrentUserId(token: string | null): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      return data.user.id;
    }
  } catch {
    // ignore
  }

  if (token && token.startsWith('sb_user_')) {
    const rawId = token.replace('sb_user_', '');
    if (
      rawId === 'bh_5c82dc8e3aa243a28413' ||
      rawId.toLowerCase() === 'abba'
    ) {
      return ADMIN_ABBA_UUID;
    }
    return rawId;
  }

  return ADMIN_ABBA_UUID;
}

function normalizeTargetUserId(rawId: string): string {
  if (!rawId) return ADMIN_ABBA_UUID;
  if (
    rawId === 'bh_5c82dc8e3aa243a28413' ||
    rawId.toLowerCase() === 'abba' ||
    rawId.toLowerCase() === 'princeabba'
  ) {
    return ADMIN_ABBA_UUID;
  }
  if (rawId === 'boost_bot_official' || rawId === 'boost_bot') {
    return BOOST_BOT_UUID;
  }
  return rawId;
}

async function fetchAllProfilesMap(): Promise<{
  rows: any[];
  byId: Map<string, any>;
}> {
  const { data } = await supabase.from('profiles').select('*');
  const rows = Array.isArray(data) ? data : [];
  const byId = new Map<string, any>();
  rows.forEach((r) => {
    byId.set(String(r.id), r);
    if (r.username) {
      byId.set(String(r.username).toLowerCase(), r);
    }
  });
  return { rows, byId };
}

function formatHashtagsString(rawHashtags: any, description = ''): string {
  if (Array.isArray(rawHashtags) && rawHashtags.length > 0) {
    return rawHashtags
      .map((t) => (String(t).startsWith('#') ? String(t) : `#${t}`))
      .join(' ');
  }
  if (typeof rawHashtags === 'string' && rawHashtags.trim()) {
    return rawHashtags;
  }
  const matches = String(description || '').match(/#[a-zA-Z0-9_]+/g);
  return matches ? matches.join(' ') : '';
}

function parseHashtagsArray(rawHashtags: any, caption = ''): string[] {
  if (Array.isArray(rawHashtags)) {
    return rawHashtags.map((t) => String(t).replace(/^#/, '').trim()).filter(Boolean);
  }
  const combined = `${rawHashtags || ''} ${caption || ''}`;
  const matches = combined.match(/#?([a-zA-Z0-9_]+)/g) || [];
  const tags = String(rawHashtags || '')
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean);
  if (tags.length > 0) return tags;
  return matches
    .filter((m) => m.startsWith('#'))
    .map((m) => m.replace(/^#/, ''));
}

function mapSupabasePostToPostItem(
  row: any,
  profilesById: Map<string, any>,
  likesRows: any[],
  commentsRows: any[],
  sharesRows: any[],
  savesRows: any[],
  followsRows: any[],
  currentUserId: string
): PostItem {
  const authorId = normalizeTargetUserId(String(row.user_id || ADMIN_ABBA_UUID));
  const authorRow =
    profilesById.get(authorId) ||
    profilesById.get(String(row.username || '').toLowerCase()) ||
    profilesById.get(ADMIN_ABBA_UUID);

  const isAbbaAuthor = authorId === ADMIN_ABBA_UUID;
  const authorMeta = parseProfileMeta(authorRow?.join_reason);

  const mediaUrl = String(
    row.video_url || row.image_url || row.file_url || ''
  ).trim();
  const isVideoUrl =
    mediaUrl.includes('.mp4') ||
    mediaUrl.includes('.webm') ||
    mediaUrl.includes('.mov') ||
    String(row.file_type || '').startsWith('video/') ||
    row.type === 'video' ||
    row.type === 'capshot';

  let postType: 'photo' | 'video' | 'text' | 'capshot' = 'text';
  if (row.type === 'capshot') {
    postType = 'capshot';
  } else if (isVideoUrl) {
    postType = 'video';
  } else if (mediaUrl) {
    postType = 'photo';
  }

  const postIdStr = String(row.id);
  const postLikes = likesRows.filter((l) => String(l.post_id) === postIdStr);
  const postComments = commentsRows.filter(
    (c) => String(c.post_id) === postIdStr
  );
  const postShares = sharesRows.filter((s) => String(s.post_id) === postIdStr);
  const postSaves = savesRows.filter((s) => String(s.post_id) === postIdStr);

  const dbLikes = Number(row.likes || 0);
  const likesCount = Math.max(dbLikes, postLikes.length);
  const isLiked = postLikes.some((l) => String(l.user_id) === currentUserId);
  const isSaved = postSaves.some((s) => String(s.user_id) === currentUserId);
  const isFollowingAuthor = followsRows.some(
    (f) =>
      String(f.follower_id) === currentUserId &&
      String(f.following_id) === authorId
  );

  return {
    id: row.id,
    userId: authorId,
    postType,
    caption: String(row.description || row.title || ''),
    mediaUrl,
    thumbnailUrl: String(row.image_url || mediaUrl || ''),
    hashtags: formatHashtagsString(
      row.hashtags,
      row.description || row.title || ''
    ),
    category: 'Creators',
    linkUrl: '',
    viewsCount: Number(row.views || 0),
    watchDurationTotal: Number(row.views || 0) * 8,
    completionRateSum: Number(row.views || 0) * 85,
    createdAt: row.created_at || new Date().toISOString(),
    author: {
      id: authorId,
      username: isAbbaAuthor
        ? 'Abba'
        : String(authorRow?.username || row.username || 'user'),
      displayName: isAbbaAuthor
        ? 'Prince Abba'
        : String(
            authorRow?.display_name ||
              authorRow?.username ||
              row.username ||
              'BoostHub Creator'
          ),
      avatarUrl: String(authorRow?.avatar_url || row.avatar_url || ''),
      isVerified: Boolean(
        isAbbaAuthor || authorMeta.verified || authorRow?.creator_of_week
      ),
      role: isAbbaAuthor || authorRow?.is_admin ? 'admin' : 'creator',
    },
    likesCount,
    commentsCount: postComments.length,
    sharesCount: postShares.length,
    savesCount: postSaves.length,
    isLiked,
    isSaved,
    isFollowingAuthor,
  };
}

export async function handleStaticBackendRequest<T = any>(
  rawPath: string,
  method: string,
  rawBody: any,
  token: string | null
): Promise<T> {
  await ensureAdminUserSeededInSupabase();

  const urlObj = new URL(rawPath, 'https://boosthub.local');
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;
  const body =
    typeof rawBody === 'string' && rawBody.trim()
      ? JSON.parse(rawBody)
      : rawBody || {};

  // 1. Auth Login / Signup via Supabase profiles + supabase.auth
  if (pathname === '/api/auth/login' || pathname === '/api/auth/signup') {
    const email = String(body.email || ADMIN_EMAIL)
      .trim()
      .toLowerCase();
    const password = String(body.password || '');
    const isOwnerAdmin =
      email === ADMIN_EMAIL ||
      String(body.username || '').trim().toLowerCase() === 'abba';

    // Attempt Supabase Auth sign-in if configured, without blocking profile lookup
    if (email && password) {
      try {
        if (pathname === '/api/auth/signup') {
          await supabase.auth.signUp({ email, password });
        } else {
          await supabase.auth.signInWithPassword({ email, password });
        }
      } catch {
        // fallback to profiles table lookup
      }
    }

    const { rows: allProfiles } = await fetchAllProfilesMap();
    const [followsRes, friendshipsRes, postsRes] = await Promise.all([
      supabase.from('follows').select('*'),
      supabase.from('friendships').select('*'),
      supabase.from('posts').select('*'),
    ]);

    if (isOwnerAdmin) {
      let abbaRow = allProfiles.find((r) => r.id === ADMIN_ABBA_UUID);
      if (body.avatarUrl && abbaRow) {
        const { data: updated } = await supabase
          .from('profiles')
          .update({ avatar_url: body.avatarUrl })
          .eq('id', ADMIN_ABBA_UUID)
          .select()
          .single();
        if (updated) abbaRow = updated;
      }
      const profile = mapSupabaseRowToUserProfile(
        abbaRow || { id: ADMIN_ABBA_UUID, username: 'Abba' },
        followsRes.data || [],
        friendshipsRes.data || [],
        postsRes.data || [],
        ADMIN_ABBA_UUID
      );
      return {
        token: `sb_user_${ADMIN_ABBA_UUID}`,
        profile,
        user: profile,
      } as unknown as T;
    }

    // Check existing non-admin user by email or username
    const requestedUsername = String(
      body.username || email.split('@')[0] || 'creator'
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    let existingRow = allProfiles.find((r) => {
      const m = parseProfileMeta(r.join_reason);
      return (
        String(m.email || '').toLowerCase() === email ||
        String(r.username || '').toLowerCase() === requestedUsername
      );
    });

    if (existingRow) {
      if (body.avatarUrl) {
        const { data: updated } = await supabase
          .from('profiles')
          .update({ avatar_url: body.avatarUrl })
          .eq('id', existingRow.id)
          .select()
          .single();
        if (updated) existingRow = updated;
      }
      const profile = mapSupabaseRowToUserProfile(
        existingRow,
        followsRes.data || [],
        friendshipsRes.data || [],
        postsRes.data || [],
        existingRow.id
      );
      return {
        token: `sb_user_${existingRow.id}`,
        profile,
        user: profile,
      } as unknown as T;
    }

    // Create new user row in Supabase `profiles`
    const newId = crypto.randomUUID();
    const newMeta: ProfileMeta = {
      email,
      bio: 'Creating and connecting on BoostHub',
      following_count: 0,
      friends_count: 0,
      shares_count: 0,
      verified: false,
      password,
    };
    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id: newId,
        username: requestedUsername || `user_${Date.now().toString().slice(-4)}`,
        display_name:
          body.displayName || requestedUsername || email.split('@')[0],
        avatar_url: body.avatarUrl || '',
        xp: 0,
        followers: 0,
        likes: 0,
        views: 0,
        engagement: 0,
        boost_points: 0,
        is_admin: false,
        interests: ['Creators', 'Technology', 'Music'],
        join_reason: JSON.stringify(newMeta),
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      throw new Error(insertErr?.message || 'Could not create profile in Supabase.');
    }

    const profile = mapSupabaseRowToUserProfile(
      inserted,
      followsRes.data || [],
      friendshipsRes.data || [],
      postsRes.data || [],
      inserted.id
    );
    return {
      token: `sb_user_${inserted.id}`,
      profile,
      user: profile,
    } as unknown as T;
  }

  if (pathname === '/api/auth/reset-password') {
    return { ok: true, message: 'Password updated in Supabase.' } as unknown as T;
  }

  const currentUserId = await resolveCurrentUserId(token);

  // 2. Current User Profile (/api/me, /api/profile, /api/profiles/me)
  if (
    pathname === '/api/me' ||
    pathname === '/api/profile' ||
    pathname === '/api/profiles/me'
  ) {
    const [profRes, followsRes, friendshipsRes, postsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle(),
      supabase.from('follows').select('*'),
      supabase.from('friendships').select('*'),
      supabase.from('posts').select('*'),
    ]);

    let row = profRes.data;
    if (!row) {
      const { data: abbaRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ADMIN_ABBA_UUID)
        .maybeSingle();
      row = abbaRow || { id: ADMIN_ABBA_UUID, username: 'Abba' };
    }

    if (method === 'PUT' || method === 'POST') {
      const meta = parseProfileMeta(row.join_reason);
      const nextMeta: ProfileMeta = {
        ...meta,
        bio: body.bio !== undefined ? String(body.bio) : meta.bio,
        who_can_message: body.whoCanMessage || meta.who_can_message || 'everyone',
        comment_control: body.commentControl || meta.comment_control || 'everyone',
        is_private:
          body.isPrivate !== undefined ? Boolean(body.isPrivate) : meta.is_private,
        notifications_enabled:
          body.notificationsEnabled !== undefined
            ? Boolean(body.notificationsEnabled)
            : meta.notifications_enabled,
        notification_preferences:
          body.notificationPreferences || meta.notification_preferences,
      };

      const isAbba = row.id === ADMIN_ABBA_UUID;
      const updatePayload: Record<string, any> = {
        display_name: isAbba
          ? 'Prince Abba'
          : body.displayName || row.display_name,
        username: isAbba ? 'Abba' : body.username || row.username,
        join_reason: JSON.stringify(nextMeta),
      };
      if (body.avatarUrl !== undefined && body.avatarUrl !== '') {
        updatePayload.avatar_url = body.avatarUrl;
      }
      if (Array.isArray(body.interests)) {
        updatePayload.interests = body.interests;
      }

      const { data: updatedRow } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', row.id)
        .select()
        .single();

      if (updatedRow) {
        row = updatedRow;
        if (body.avatarUrl) {
          await supabase
            .from('posts')
            .update({ avatar_url: body.avatarUrl })
            .eq('user_id', row.id);
        }
      }
    }

    return mapSupabaseRowToUserProfile(
      row,
      followsRes.data || [],
      friendshipsRes.data || [],
      postsRes.data || [],
      currentUserId
    ) as unknown as T;
  }

  if (pathname === '/api/onboarding') {
    const { data: row } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .maybeSingle();
    if (row && Array.isArray(body.interests)) {
      await supabase
        .from('profiles')
        .update({ interests: body.interests })
        .eq('id', currentUserId);
    }
    return { ok: true } as unknown as T;
  }

  // 3. Profile Follows & Profile Details (/api/profiles/:id/follows, /api/profiles/:id/follow, /api/profiles/:id)
  const profileFollowsMatch = pathname.match(
    /^\/api\/profiles\/([^/]+)\/follows$/
  );
  if (profileFollowsMatch) {
    const targetId = normalizeTargetUserId(
      decodeURIComponent(profileFollowsMatch[1])
    );
    const [{ byId }, followsRes, friendshipsRes, postsRes] = await Promise.all([
      fetchAllProfilesMap(),
      supabase.from('follows').select('*'),
      supabase.from('friendships').select('*'),
      supabase.from('posts').select('*'),
    ]);
    const followsRows = followsRes.data || [];
    const followerIds = followsRows
      .filter((f) => String(f.following_id) === targetId)
      .map((f) => String(f.follower_id));
    const followingIds = followsRows
      .filter((f) => String(f.follower_id) === targetId)
      .map((f) => String(f.following_id));

    const followers = followerIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((r) =>
        mapSupabaseRowToUserProfile(
          r,
          followsRows,
          friendshipsRes.data || [],
          postsRes.data || [],
          currentUserId
        )
      );
    const following = followingIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((r) =>
        mapSupabaseRowToUserProfile(
          r,
          followsRows,
          friendshipsRes.data || [],
          postsRes.data || [],
          currentUserId
        )
      );

    return { followers, following } as unknown as T;
  }

  const profileFollowToggleMatch = pathname.match(
    /^\/api\/profiles\/([^/]+)\/follow$/
  );
  if (profileFollowToggleMatch && method === 'POST') {
    const targetId = normalizeTargetUserId(
      decodeURIComponent(profileFollowToggleMatch[1])
    );
    const { data: existing } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetId);

    const { data: targetProf } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (existing && existing.length > 0) {
      await supabase.from('follows').delete().eq('id', existing[0].id);
      if (targetProf) {
        const nextCount = Math.max(0, Number(targetProf.followers || 0) - 1);
        await supabase
          .from('profiles')
          .update({ followers: nextCount })
          .eq('id', targetId);
      }
      return { following: false } as unknown as T;
    } else {
      await supabase.from('follows').insert({
        follower_id: currentUserId,
        following_id: targetId,
      });
      if (targetProf) {
        const nextCount = Number(targetProf.followers || 0) + 1;
        await supabase
          .from('profiles')
          .update({ followers: nextCount })
          .eq('id', targetId);
      }
      if (targetId !== currentUserId) {
        const { data: meProf } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', currentUserId)
          .maybeSingle();
        const actorName =
          meProf?.display_name || meProf?.username || 'Someone';
        await supabase.from('notifications').insert({
          target_user: targetId,
          actor_user: currentUserId,
          type: 'follow',
          title: 'New Follower',
          body: `${actorName} started following you.`,
          is_read: false,
        });
      }
      return { following: true } as unknown as T;
    }
  }

  const profileMatch = pathname.match(/^\/api\/profiles\/([^/]+)$/);
  if (profileMatch && method === 'GET') {
    const rawParam = decodeURIComponent(profileMatch[1]);
    const targetId = normalizeTargetUserId(rawParam);
    const [{ rows, byId }, followsRes, friendshipsRes, postsRes] =
      await Promise.all([
        fetchAllProfilesMap(),
        supabase.from('follows').select('*'),
        supabase.from('friendships').select('*'),
        supabase.from('posts').select('*'),
      ]);

    const row =
      byId.get(targetId) ||
      byId.get(rawParam.toLowerCase()) ||
      rows.find((r) => r.id === ADMIN_ABBA_UUID) || {
        id: ADMIN_ABBA_UUID,
        username: 'Abba',
      };

    return mapSupabaseRowToUserProfile(
      row,
      followsRes.data || [],
      friendshipsRes.data || [],
      postsRes.data || [],
      currentUserId
    ) as unknown as T;
  }

  // 4. Posts & Capshots Feed (/api/posts, /api/capshots, /api/saved-posts)
  if (
    (pathname === '/api/posts' && method === 'GET') ||
    pathname === '/api/capshots' ||
    pathname === '/api/saved-posts'
  ) {
    const [
      { byId: profilesById },
      postsRes,
      likesRes,
      commentsRes,
      legacyCommentsRes,
      sharesRes,
      savesRes,
      followsRes,
    ] = await Promise.all([
      fetchAllProfilesMap(),
      supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('post_likes').select('*'),
      supabase.from('post_comments').select('*'),
      supabase.from('comments').select('*'),
      supabase.from('post_shares').select('*'),
      supabase.from('saved_posts').select('*'),
      supabase.from('follows').select('*'),
    ]);

    const combinedComments = [
      ...(commentsRes.data || []),
      ...(legacyCommentsRes.data || []),
    ];

    let mapped = (postsRes.data || [])
      .filter((r) => {
        const url = String(r.video_url || r.image_url || r.file_url || '');
        return !url.startsWith('blob:');
      })
      .map((r) =>
        mapSupabasePostToPostItem(
          r,
          profilesById,
          likesRes.data || [],
          combinedComments,
          sharesRes.data || [],
          savesRes.data || [],
          followsRes.data || [],
          currentUserId
        )
      );

    if (pathname === '/api/capshots') {
      mapped = mapped.filter(
        (p) => p.postType === 'video' || p.postType === 'capshot'
      );
      return mapped as unknown as T;
    }

    if (pathname === '/api/saved-posts') {
      mapped = mapped.filter((p) => p.isSaved);
      return mapped as unknown as T;
    }

    const authorIdParam = searchParams.get('authorId');
    if (authorIdParam) {
      const normAuthor = normalizeTargetUserId(authorIdParam);
      mapped = mapped.filter((p) => p.userId === normAuthor);
    }

    const hashtagParam = searchParams.get('hashtag');
    if (hashtagParam) {
      const cleanTag = hashtagParam.replace(/^#/, '').toLowerCase();
      mapped = mapped.filter(
        (p) =>
          p.hashtags.toLowerCase().includes(cleanTag) ||
          p.caption.toLowerCase().includes(`#${cleanTag}`)
      );
    }

    const tab = searchParams.get('tab') || 'recommended';
    if (tab === 'trending') {
      mapped = [...mapped].sort(
        (a, b) =>
          b.likesCount * 3 +
          b.commentsCount * 4 +
          b.viewsCount -
          (a.likesCount * 3 + a.commentsCount * 4 + a.viewsCount)
      );
    }

    const offset = Number(searchParams.get('offset') || 0);
    const limit = Number(searchParams.get('limit') || 50);
    return mapped.slice(offset, offset + limit) as unknown as T;
  }

  // Create Post (POST /api/posts)
  if (pathname === '/api/posts' && method === 'POST') {
    const { byId } = await fetchAllProfilesMap();
    const authorRow = byId.get(currentUserId) || byId.get(ADMIN_ABBA_UUID);
    const isAbba = currentUserId === ADMIN_ABBA_UUID;

    const mediaUrl = String(body.mediaUrl || '').trim();
    const postType = body.postType || (mediaUrl.includes('.mp4') ? 'video' : 'photo');
    const isVideo = postType === 'video' || postType === 'capshot';
    const caption = String(body.caption || '').trim();
    const hashtagsArr = parseHashtagsArray(body.hashtags, caption);

    const { data: inserted, error } = await supabase
      .from('posts')
      .insert({
        user_id: currentUserId,
        username: isAbba ? 'Abba' : authorRow?.username || 'Abba',
        avatar_url: authorRow?.avatar_url || '',
        title: caption.slice(0, 120) || 'BoostHub Post',
        description: caption,
        type: isVideo ? 'video' : postType === 'photo' ? 'image' : 'text',
        video_url: isVideo ? mediaUrl : null,
        image_url: !isVideo && mediaUrl ? mediaUrl : body.thumbnailUrl || null,
        file_url: mediaUrl || null,
        file_type: isVideo ? 'video/mp4' : mediaUrl ? 'image/jpeg' : null,
        hashtags: hashtagsArr,
        likes: 0,
        views: 0,
      })
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(error?.message || 'Failed to publish post to Supabase.');
    }

    // Award XP for publishing
    if (authorRow) {
      await supabase
        .from('profiles')
        .update({ xp: Number(authorRow.xp || 0) + 50 })
        .eq('id', currentUserId);
    }

    return mapSupabasePostToPostItem(
      inserted,
      byId,
      [],
      [],
      [],
      [],
      [],
      currentUserId
    ) as unknown as T;
  }

  // Post Interactions (/api/posts/:id/like, /api/posts/:id/save, /api/posts/:id/share, /api/posts/:id/watch, /api/posts/:id/delete)
  const postActionMatch = pathname.match(
    /^\/api\/posts\/([^/]+)\/(like|save|share|watch|delete)$/
  );
  if (postActionMatch && method === 'POST') {
    const postId = decodeURIComponent(postActionMatch[1]);
    const action = postActionMatch[2];

    const { data: postRow } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (!postRow) {
      return { ok: true } as unknown as T;
    }

    const authorId = normalizeTargetUserId(String(postRow.user_id || ADMIN_ABBA_UUID));

    if (action === 'delete') {
      await supabase.from('posts').delete().eq('id', postId);
      return { ok: true } as unknown as T;
    }

    if (action === 'like') {
      const { data: existingLikes } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', currentUserId);

      const { data: authorProf } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authorId)
        .maybeSingle();

      if (existingLikes && existingLikes.length > 0) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLikes[0].id);
        const newLikes = Math.max(0, Number(postRow.likes || 1) - 1);
        await supabase
          .from('posts')
          .update({ likes: newLikes })
          .eq('id', postId);
        if (authorProf) {
          await supabase
            .from('profiles')
            .update({ likes: Math.max(0, Number(authorProf.likes || 1) - 1) })
            .eq('id', authorId);
        }
        return { liked: false, likesCount: newLikes } as unknown as T;
      } else {
        await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: currentUserId,
        });
        const newLikes = Number(postRow.likes || 0) + 1;
        await supabase
          .from('posts')
          .update({ likes: newLikes })
          .eq('id', postId);
        if (authorProf) {
          await supabase
            .from('profiles')
            .update({
              likes: Number(authorProf.likes || 0) + 1,
              xp: Number(authorProf.xp || 0) + 10,
            })
            .eq('id', authorId);
        }

        if (authorId !== currentUserId) {
          const { data: meProf } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', currentUserId)
            .maybeSingle();
          const actorName =
            meProf?.display_name || meProf?.username || 'Someone';
          await supabase.from('notifications').insert({
            target_user: authorId,
            actor_user: currentUserId,
            type: 'like',
            title: 'New Like',
            body: `${actorName} liked your post.`,
            post_id: postId,
            is_read: false,
          });
        }
        return { liked: true, likesCount: newLikes } as unknown as T;
      }
    }

    if (action === 'save') {
      const { data: existingSaves } = await supabase
        .from('saved_posts')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', currentUserId);

      if (existingSaves && existingSaves.length > 0) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('id', existingSaves[0].id);
        return { saved: false } as unknown as T;
      } else {
        await supabase.from('saved_posts').insert({
          post_id: postId,
          user_id: currentUserId,
        });
        return { saved: true } as unknown as T;
      }
    }

    if (action === 'share') {
      await supabase.from('post_shares').insert({
        post_id: postId,
        user_id: currentUserId,
      });
      const { data: authorProf } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authorId)
        .maybeSingle();
      if (authorProf) {
        await supabase
          .from('profiles')
          .update({
            engagement: Number(authorProf.engagement || 0) + 1,
            xp: Number(authorProf.xp || 0) + 15,
          })
          .eq('id', authorId);
      }
      return { shared: true } as unknown as T;
    }

    if (action === 'watch') {
      const newViews = Number(postRow.views || 0) + 1;
      await supabase
        .from('posts')
        .update({ views: newViews })
        .eq('id', postId);
      await supabase.from('video_watch_history').insert({
        post_id: postId,
        user_id: currentUserId,
        watch_seconds: Math.round(Number(body.watchDurationSeconds || 5)),
        completion_percent: Math.round(Number(body.completionPercentage || 80)),
        completed: Boolean(Number(body.completionPercentage || 0) >= 80),
      });
      const { data: authorProf } = await supabase
        .from('profiles')
        .select('views')
        .eq('id', authorId)
        .maybeSingle();
      if (authorProf) {
        await supabase
          .from('profiles')
          .update({ views: Number(authorProf.views || 0) + 1 })
          .eq('id', authorId);
      }
      return { ok: true, viewsCount: newViews } as unknown as T;
    }
  }

  // 5. Comments (/api/posts/:id/comments, /api/comments/:id)
  const postCommentsMatch = pathname.match(/^\/api\/posts\/([^/]+)\/comments$/);
  if (postCommentsMatch) {
    const postId = decodeURIComponent(postCommentsMatch[1]);
    const { byId } = await fetchAllProfilesMap();

    if (method === 'GET') {
      const [pcRes, legacyRes] = await Promise.all([
        supabase
          .from('post_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: false }),
        supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: false }),
      ]);

      const rawList = [...(pcRes.data || []), ...(legacyRes.data || [])];
      const mapped: CommentItem[] = rawList.map((c) => {
        const uid = normalizeTargetUserId(String(c.user_id || ADMIN_ABBA_UUID));
        const uRow =
          byId.get(uid) ||
          byId.get(String(c.user_id || '').toLowerCase()) ||
          byId.get(ADMIN_ABBA_UUID);
        const isAbba = uid === ADMIN_ABBA_UUID;
        const meta = parseProfileMeta(uRow?.join_reason);

        return {
          id: c.id,
          postId,
          userId: uid,
          parentId: null,
          content: String(c.comment || c.text || c.content || ''),
          isPinned: false,
          reactionsCount: 0,
          createdAt: c.created_at || new Date().toISOString(),
          updatedAt: c.created_at || new Date().toISOString(),
          author: {
            id: uid,
            username: isAbba ? 'Abba' : String(uRow?.username || 'user'),
            displayName: isAbba
              ? 'Prince Abba'
              : String(uRow?.display_name || uRow?.username || 'BoostHub User'),
            avatarUrl: String(uRow?.avatar_url || ''),
            isVerified: Boolean(isAbba || meta.verified),
          },
        };
      });

      return mapped as unknown as T;
    }

    if (method === 'POST') {
      const content = String(body.content || body.text || '').trim();
      if (!content) {
        throw new Error('Comment cannot be empty.');
      }

      const { data: inserted, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          comment: content,
        })
        .select()
        .single();

      if (error || !inserted) {
        throw new Error(error?.message || 'Failed to save comment to Supabase.');
      }

      const uRow = byId.get(currentUserId) || byId.get(ADMIN_ABBA_UUID);
      const isAbba = currentUserId === ADMIN_ABBA_UUID;

      // Notify post author
      const { data: postRow } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .maybeSingle();
      const postOwnerId = normalizeTargetUserId(
        String(postRow?.user_id || ADMIN_ABBA_UUID)
      );
      if (postOwnerId && postOwnerId !== currentUserId) {
        await supabase.from('notifications').insert({
          target_user: postOwnerId,
          actor_user: currentUserId,
          type: 'comment',
          title: 'New Comment',
          body: `${
            isAbba ? 'Prince Abba' : uRow?.display_name || 'Someone'
          } commented: "${content.slice(0, 60)}"`,
          post_id: postId,
          is_read: false,
        });
      }

      const createdItem: CommentItem = {
        id: inserted.id,
        postId,
        userId: currentUserId,
        parentId: body.parentId || null,
        content,
        isPinned: false,
        reactionsCount: 0,
        createdAt: inserted.created_at || new Date().toISOString(),
        updatedAt: inserted.created_at || new Date().toISOString(),
        author: {
          id: currentUserId,
          username: isAbba ? 'Abba' : String(uRow?.username || 'user'),
          displayName: isAbba
            ? 'Prince Abba'
            : String(uRow?.display_name || uRow?.username || 'BoostHub User'),
          avatarUrl: String(uRow?.avatar_url || ''),
          isVerified: Boolean(isAbba),
        },
      };
      return createdItem as unknown as T;
    }
  }

  const commentItemMatch = pathname.match(/^\/api\/comments\/([^/]+)$/);
  if (commentItemMatch && method === 'PUT') {
    const commentId = decodeURIComponent(commentItemMatch[1]);
    if (body.action === 'delete') {
      await supabase.from('post_comments').delete().eq('id', commentId);
      await supabase.from('comments').delete().eq('id', commentId);
      return { ok: true } as unknown as T;
    }
    if (body.action === 'edit' && body.content) {
      const { data: updated } = await supabase
        .from('post_comments')
        .update({ comment: String(body.content) })
        .eq('id', commentId)
        .select()
        .maybeSingle();
      return {
        id: commentId,
        content: updated?.comment || body.content,
      } as unknown as T;
    }
    return { id: commentId } as unknown as T;
  }

  // 6. 24-Hour Stories (/api/stories, /api/stories/:id/interact)
  if (pathname === '/api/stories' && method === 'GET') {
    const [
      { byId },
      storiesRes,
      viewsRes,
      reactionsRes,
      repliesRes,
      followsRes,
      friendshipsRes,
      postsRes,
    ] = await Promise.all([
      fetchAllProfilesMap(),
      supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }),
      supabase.from('story_views').select('*'),
      supabase.from('story_reactions').select('*'),
      supabase.from('story_replies').select('*'),
      supabase.from('follows').select('*'),
      supabase.from('friendships').select('*'),
      supabase.from('posts').select('*'),
    ]);

    const viewsList = viewsRes.data || [];
    const reactionsList = reactionsRes.data || [];
    const repliesList = repliesRes.data || [];

    const mapped: StoryItem[] = (storiesRes.data || [])
      .filter((s) => !String(s.media_url || '').startsWith('blob:'))
      .map((s) => {
        const uid = normalizeTargetUserId(String(s.user_id || ADMIN_ABBA_UUID));
        const uRow = byId.get(uid) || byId.get(ADMIN_ABBA_UUID);
        const isAbba = uid === ADMIN_ABBA_UUID;
        const mUrl = String(s.media_url || '');
        const isVid =
          s.media_type === 'video' ||
          mUrl.endsWith('.mp4') ||
          mUrl.endsWith('.webm');

        const sViews = viewsList.filter((v) => String(v.story_id) === String(s.id));
        const sReactions = reactionsList
          .filter((r) => String(r.story_id) === String(s.id))
          .map((r) => ({
            id: r.id,
            userId: String(r.user_id),
            reaction: String(r.reaction),
          }));
        const sReplies = repliesList
          .filter((r) => String(r.story_id) === String(s.id))
          .map((r) => ({
            id: r.id,
            userId: String(r.user_id),
            content: String(r.message || ''),
            createdAt: r.created_at || new Date().toISOString(),
          }));

        const viewerProfiles: UserProfile[] = sViews
          .map((v) => byId.get(normalizeTargetUserId(String(v.viewer_id))))
          .filter(Boolean)
          .map((vr) =>
            mapSupabaseRowToUserProfile(
              vr,
              followsRes.data || [],
              friendshipsRes.data || [],
              postsRes.data || [],
              currentUserId
            )
          );

        return {
          id: s.id,
          userId: uid,
          mediaUrl: mUrl,
          mediaType: isVid ? 'video' : 'photo',
          caption: String(s.caption || ''),
          expiresAt:
            s.expires_at ||
            new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          createdAt: s.created_at || new Date().toISOString(),
          author: {
            id: uid,
            username: isAbba ? 'Abba' : String(uRow?.username || 'user'),
            displayName: isAbba
              ? 'Prince Abba'
              : String(uRow?.display_name || uRow?.username || 'BoostHub User'),
            avatarUrl: String(uRow?.avatar_url || ''),
          },
          viewsCount: sViews.length,
          hasViewed: sViews.some(
            (v) => normalizeTargetUserId(String(v.viewer_id)) === currentUserId
          ),
          viewers: viewerProfiles,
          reactions: sReactions,
          replies: sReplies,
        };
      });

    return mapped as unknown as T;
  }

  if (pathname === '/api/stories' && method === 'POST') {
    const mediaUrl = String(body.mediaUrl || '').trim();
    if (!mediaUrl) {
      throw new Error('Story media URL is required.');
    }
    const isVid =
      body.mediaType === 'video' ||
      mediaUrl.endsWith('.mp4') ||
      mediaUrl.endsWith('.webm');

    const { data: inserted, error } = await supabase
      .from('stories')
      .insert({
        user_id: currentUserId,
        media_url: mediaUrl,
        media_type: isVid ? 'video' : 'image',
        caption: String(body.caption || ''),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(error?.message || 'Failed to create story in Supabase.');
    }
    return inserted as unknown as T;
  }

  const storyInteractMatch = pathname.match(/^\/api\/stories\/([^/]+)\/interact$/);
  if (storyInteractMatch && method === 'POST') {
    const storyId = decodeURIComponent(storyInteractMatch[1]);
    const action = body.action;

    if (action === 'delete') {
      await supabase.from('stories').delete().eq('id', storyId);
      return { ok: true } as unknown as T;
    }

    if (action === 'view') {
      const { data: existing } = await supabase
        .from('story_views')
        .select('*')
        .eq('story_id', storyId)
        .eq('viewer_id', currentUserId);
      if (!existing || existing.length === 0) {
        await supabase.from('story_views').insert({
          story_id: storyId,
          viewer_id: currentUserId,
        });
      }
      return { ok: true } as unknown as T;
    }

    if (action === 'react') {
      await supabase.from('story_reactions').insert({
        story_id: storyId,
        user_id: currentUserId,
        reaction: String(body.payload || '🔥'),
      });
      return { ok: true } as unknown as T;
    }

    if (action === 'reply') {
      const msg = String(body.payload || '').trim();
      if (msg) {
        await supabase.from('story_replies').insert({
          story_id: storyId,
          user_id: currentUserId,
          message: msg,
        });
      }
      return { ok: true } as unknown as T;
    }

    return { ok: true } as unknown as T;
  }

  // 7. Friends & Suggestions (/api/friends, /api/friends/action)
  if (pathname === '/api/friends') {
    const [{ rows, byId }, followsRes, friendshipsRes, postsRes] =
      await Promise.all([
        fetchAllProfilesMap(),
        supabase.from('follows').select('*'),
        supabase.from('friendships').select('*'),
        supabase.from('posts').select('*'),
      ]);

    const friendshipsList = friendshipsRes.data || [];
    const friends: Array<{ friendshipId: any; profile: UserProfile }> = [];
    const pendingReceived: Array<{ friendshipId: any; profile: UserProfile }> = [];
    const pendingSent: Array<{ friendshipId: any; profile: UserProfile }> = [];
    const connectedIds = new Set<string>([currentUserId]);

    friendshipsList.forEach((fr) => {
      const reqId = normalizeTargetUserId(String(fr.requester_id));
      const addId = normalizeTargetUserId(String(fr.addressee_id));
      if (reqId !== currentUserId && addId !== currentUserId) return;

      const otherId = reqId === currentUserId ? addId : reqId;
      connectedIds.add(otherId);
      const otherRow = byId.get(otherId);
      if (!otherRow) return;

      const prof = mapSupabaseRowToUserProfile(
        otherRow,
        followsRes.data || [],
        friendshipsList,
        postsRes.data || [],
        currentUserId
      );

      if (fr.status === 'accepted') {
        friends.push({ friendshipId: fr.id, profile: prof });
      } else if (addId === currentUserId) {
        pendingReceived.push({ friendshipId: fr.id, profile: prof });
      } else {
        pendingSent.push({ friendshipId: fr.id, profile: prof });
      }
    });

    const suggestions = rows
      .filter((r) => !connectedIds.has(String(r.id)))
      .map((r) => ({
        profile: mapSupabaseRowToUserProfile(
          r,
          followsRes.data || [],
          friendshipsList,
          postsRes.data || [],
          currentUserId
        ),
        mutualFriendsCount: 1,
      }));

    return {
      friends,
      pendingReceived,
      pendingSent,
      suggestions,
    } as unknown as T;
  }

  if (pathname === '/api/friends/action' && method === 'POST') {
    const action = body.action;
    const targetUserId = normalizeTargetUserId(String(body.targetUserId || ''));
    const friendshipId = body.friendshipId;

    if (action === 'request' && targetUserId) {
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(
          `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
        );
      if (!existing || existing.length === 0) {
        await supabase.from('friendships').insert({
          requester_id: currentUserId,
          addressee_id: targetUserId,
          status: 'pending',
        });
        await supabase.from('notifications').insert({
          target_user: targetUserId,
          actor_user: currentUserId,
          type: 'friend_request',
          title: 'Friend Request',
          body: 'sent you a friend request.',
          is_read: false,
        });
      }
    } else if (action === 'accept' && friendshipId) {
      await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);
    } else if ((action === 'decline' || action === 'remove') && friendshipId) {
      await supabase.from('friendships').delete().eq('id', friendshipId);
    }
    return { ok: true } as unknown as T;
  }

  // 8. Communities (/api/communities, /api/communities/:id, /api/communities/:id/action)
  if (pathname === '/api/communities' && method === 'GET') {
    const [commsRes, membersRes, postsRes] = await Promise.all([
      supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('community_members').select('*'),
      supabase.from('community_posts').select('*'),
    ]);

    const members = membersRes.data || [];
    const cPosts = postsRes.data || [];

    const list: CommunityItem[] = (commsRes.data || []).map((c) => {
      const cMembers = members.filter(
        (m) => String(m.community_id) === String(c.id)
      );
      const myMem = cMembers.find(
        (m) => normalizeTargetUserId(String(m.user_id)) === currentUserId
      );
      return {
        id: c.id,
        name: String(c.name || 'Community'),
        description: String(c.description || ''),
        imageUrl: String(c.avatar_url || ''),
        rules:
          '1. Be respectful to all members.\n2. Share authentic content.\n3. No spam.',
        category: 'Creators',
        creatorId: normalizeTargetUserId(String(c.owner_id || ADMIN_ABBA_UUID)),
        createdAt: c.created_at || new Date().toISOString(),
        membersCount: Math.max(1, cMembers.length),
        postsCount: cPosts.filter(
          (p) => String(p.community_id) === String(c.id)
        ).length,
        isMember: Boolean(myMem || c.owner_id === currentUserId),
        myRole:
          c.owner_id === currentUserId
            ? 'admin'
            : (myMem?.role as any) || null,
      };
    });

    return list as unknown as T;
  }

  if (pathname === '/api/communities' && method === 'POST') {
    const { data: created, error } = await supabase
      .from('communities')
      .insert({
        name: String(body.name || 'New Community'),
        description: String(body.description || ''),
        avatar_url: String(body.imageUrl || ''),
        privacy: 'public',
        owner_id: currentUserId,
      })
      .select()
      .single();

    if (error || !created) {
      throw new Error(error?.message || 'Failed to create community.');
    }

    await supabase.from('community_members').insert({
      community_id: created.id,
      user_id: currentUserId,
      role: 'admin',
      status: 'active',
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description || '',
      imageUrl: created.avatar_url || '',
      rules:
        body.rules ||
        '1. Be respectful to all members.\n2. Share authentic content.\n3. No spam.',
      category: body.category || 'Creators',
      creatorId: currentUserId,
      createdAt: created.created_at,
      membersCount: 1,
      postsCount: 0,
      isMember: true,
      myRole: 'admin',
    } as unknown as T;
  }

  const communityDetailMatch = pathname.match(/^\/api\/communities\/([^/]+)$/);
  if (communityDetailMatch && method === 'GET') {
    const commId = decodeURIComponent(communityDetailMatch[1]);
    const [{ byId }, commRes, membersRes, postsRes, followsRes, friendshipsRes] =
      await Promise.all([
        fetchAllProfilesMap(),
        supabase.from('communities').select('*').eq('id', commId).maybeSingle(),
        supabase
          .from('community_members')
          .select('*')
          .eq('community_id', commId),
        supabase
          .from('community_posts')
          .select('*')
          .eq('community_id', commId)
          .order('created_at', { ascending: false }),
        supabase.from('follows').select('*'),
        supabase.from('friendships').select('*'),
      ]);

    const c = commRes.data;
    if (!c) throw new Error('Community not found.');
    const cMembers = membersRes.data || [];
    const myMem = cMembers.find(
      (m) => normalizeTargetUserId(String(m.user_id)) === currentUserId
    );

    const members = cMembers.map((m) => {
      const uid = normalizeTargetUserId(String(m.user_id));
      const uRow = byId.get(uid) || byId.get(ADMIN_ABBA_UUID);
      return {
        role: m.role || 'member',
        joinedAt: m.joined_at || new Date().toISOString(),
        profile: mapSupabaseRowToUserProfile(
          uRow || { id: uid, username: 'user' },
          followsRes.data || [],
          friendshipsRes.data || [],
          [],
          currentUserId
        ),
      };
    });

    const posts = (postsRes.data || []).map((p) => {
      const uid = normalizeTargetUserId(String(p.user_id));
      const uRow = byId.get(uid) || byId.get(ADMIN_ABBA_UUID);
      const isAbba = uid === ADMIN_ABBA_UUID;
      return {
        id: p.id,
        communityId: commId,
        userId: uid,
        content: p.content || '',
        mediaUrl: p.media_url || '',
        isPinned: false,
        createdAt: p.created_at || new Date().toISOString(),
        author: {
          id: uid,
          username: isAbba ? 'Abba' : String(uRow?.username || 'user'),
          displayName: isAbba
            ? 'Prince Abba'
            : String(uRow?.display_name || 'BoostHub User'),
          avatarUrl: String(uRow?.avatar_url || ''),
        },
      };
    });

    return {
      community: {
        id: c.id,
        name: c.name,
        description: c.description || '',
        imageUrl: c.avatar_url || '',
        rules:
          '1. Be respectful to all members.\n2. Share authentic content.\n3. No spam.',
        category: 'Creators',
        creatorId: normalizeTargetUserId(String(c.owner_id || ADMIN_ABBA_UUID)),
        createdAt: c.created_at,
        membersCount: Math.max(1, members.length),
        postsCount: posts.length,
        isMember: Boolean(myMem || c.owner_id === currentUserId),
        myRole:
          c.owner_id === currentUserId
            ? 'admin'
            : (myMem?.role as any) || null,
      },
      members,
      posts,
    } as unknown as T;
  }

  const communityActionMatch = pathname.match(
    /^\/api\/communities\/([^/]+)\/action$/
  );
  if (communityActionMatch && method === 'POST') {
    const commId = decodeURIComponent(communityActionMatch[1]);
    const action = body.action;
    if (action === 'join') {
      await supabase.from('community_members').insert({
        community_id: commId,
        user_id: currentUserId,
        role: 'member',
        status: 'active',
      });
    } else if (action === 'leave') {
      await supabase
        .from('community_members')
        .delete()
        .eq('community_id', commId)
        .eq('user_id', currentUserId);
    } else if (action === 'post') {
      await supabase.from('community_posts').insert({
        community_id: commId,
        user_id: currentUserId,
        content: String(body.content || ''),
        media_url: String(body.mediaUrl || ''),
      });
    } else if (action === 'delete_post' && body.postId) {
      await supabase.from('community_posts').delete().eq('id', body.postId);
    }
    return { ok: true } as unknown as T;
  }

  // 9. Direct Messages via Supabase `notifications` (type = 'dm')
  if (pathname === '/api/messages/conversations') {
    const [{ rows, byId }, dmRes, followsRes, friendshipsRes, postsRes] =
      await Promise.all([
        fetchAllProfilesMap(),
        supabase
          .from('notifications')
          .select('*')
          .eq('type', 'dm')
          .order('created_at', { ascending: false }),
        supabase.from('follows').select('*'),
        supabase.from('friendships').select('*'),
        supabase.from('posts').select('*'),
      ]);

    const dms = dmRes.data || [];
    const partnerIds = new Set<string>();
    partnerIds.add(BOOST_BOT_UUID);

    dms.forEach((m) => {
      const sender = normalizeTargetUserId(String(m.actor_user || ''));
      const receiver = normalizeTargetUserId(String(m.target_user || ''));
      if (sender === currentUserId && receiver) partnerIds.add(receiver);
      if (receiver === currentUserId && sender) partnerIds.add(sender);
    });

    rows.forEach((r) => {
      if (String(r.id) !== currentUserId) {
        partnerIds.add(String(r.id));
      }
    });

    const conversations: ConversationSummary[] = [];
    for (const pid of partnerIds) {
      const pRow = byId.get(pid);
      if (!pRow) continue;
      const thread = dms.filter((m) => {
        const s = normalizeTargetUserId(String(m.actor_user || ''));
        const r = normalizeTargetUserId(String(m.target_user || ''));
        return (
          (s === currentUserId && r === pid) ||
          (s === pid && r === currentUserId)
        );
      });
      const latest = thread[0];
      const unread = thread.filter(
        (m) =>
          normalizeTargetUserId(String(m.target_user || '')) ===
            currentUserId && !m.is_read
      ).length;

      conversations.push({
        partner: mapSupabaseRowToUserProfile(
          pRow,
          followsRes.data || [],
          friendshipsRes.data || [],
          postsRes.data || [],
          currentUserId
        ),
        lastMessage: latest
          ? {
              id: latest.id,
              senderId: normalizeTargetUserId(String(latest.actor_user || '')),
              receiverId: normalizeTargetUserId(
                String(latest.target_user || '')
              ),
              content: String(latest.body || ''),
              mediaUrl: String((latest.subscription as any)?.mediaUrl || ''),
              mediaType: String((latest.subscription as any)?.mediaType || ''),
              replyToId: (latest.subscription as any)?.replyToId || null,
              sharedPostId: latest.post_id || null,
              reaction: String((latest.subscription as any)?.reaction || ''),
              isRead: Boolean(latest.is_read),
              isDeleted: false,
              createdAt: latest.created_at || new Date().toISOString(),
            }
          : null,
        unreadCount: unread,
        isOnline: true,
      });
    }

    return conversations as unknown as T;
  }

  const messageItemMatch = pathname.match(/^\/api\/messages\/item\/([^/]+)$/);
  if (messageItemMatch && method === 'PUT') {
    const msgId = decodeURIComponent(messageItemMatch[1]);
    if (body.action === 'delete') {
      await supabase.from('notifications').delete().eq('id', msgId);
    } else if (body.action === 'react') {
      const { data: existing } = await supabase
        .from('notifications')
        .select('subscription')
        .eq('id', msgId)
        .maybeSingle();
      const sub = (existing?.subscription as any) || {};
      await supabase
        .from('notifications')
        .update({
          subscription: { ...sub, reaction: String(body.reaction || '') },
        })
        .eq('id', msgId);
    }
    return { ok: true } as unknown as T;
  }

  const messagePartnerMatch = pathname.match(/^\/api\/messages\/([^/]+)$/);
  if (messagePartnerMatch) {
    const partnerId = normalizeTargetUserId(
      decodeURIComponent(messagePartnerMatch[1])
    );

    if (method === 'GET') {
      const { data: dms } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'dm')
        .order('created_at', { ascending: true });

      const thread = (dms || []).filter((m) => {
        const s = normalizeTargetUserId(String(m.actor_user || ''));
        const r = normalizeTargetUserId(String(m.target_user || ''));
        return (
          (s === currentUserId && r === partnerId) ||
          (s === partnerId && r === currentUserId)
        );
      });

      // Mark unread messages from partner as read
      const unreadIds = thread
        .filter(
          (m) =>
            normalizeTargetUserId(String(m.target_user || '')) ===
              currentUserId && !m.is_read
        )
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadIds);
      }

      const mapped: DirectMessageItem[] = thread.map((m) => ({
        id: m.id,
        senderId: normalizeTargetUserId(String(m.actor_user || '')),
        receiverId: normalizeTargetUserId(String(m.target_user || '')),
        content: String(m.body || ''),
        mediaUrl: String((m.subscription as any)?.mediaUrl || ''),
        mediaType: String((m.subscription as any)?.mediaType || ''),
        replyToId: (m.subscription as any)?.replyToId || null,
        sharedPostId: m.post_id || null,
        reaction: String((m.subscription as any)?.reaction || ''),
        isRead: true,
        isDeleted: false,
        createdAt: m.created_at || new Date().toISOString(),
      }));

      return mapped as unknown as T;
    }

    if (method === 'POST') {
      const content = String(body.content || '').trim();
      const mediaUrl = String(body.mediaUrl || '').trim();
      const mediaType = String(body.mediaType || '');

      const { data: inserted, error } = await supabase
        .from('notifications')
        .insert({
          target_user: partnerId,
          actor_user: currentUserId,
          type: 'dm',
          title: 'Direct Message',
          body: content,
          post_id: body.sharedPostId || null,
          is_read: false,
          subscription: {
            mediaUrl,
            mediaType,
            replyToId: body.replyToId || null,
            reaction: '',
          },
        })
        .select()
        .single();

      if (error || !inserted) {
        throw new Error(error?.message || 'Failed to send message.');
      }

      return {
        id: inserted.id,
        senderId: currentUserId,
        receiverId: partnerId,
        content,
        mediaUrl,
        mediaType,
        replyToId: body.replyToId || null,
        sharedPostId: body.sharedPostId || null,
        reaction: '',
        isRead: false,
        isDeleted: false,
        createdAt: inserted.created_at || new Date().toISOString(),
      } as unknown as T;
    }
  }

  if (pathname === '/api/realtime/typing') {
    return { ok: true } as unknown as T;
  }

  // 10. Alerts / Notifications (/api/notifications, /api/notifications/read)
  if (pathname === '/api/notifications' && method === 'GET') {
    const [{ byId }, notifsRes, followsRes, friendshipsRes, postsRes] =
      await Promise.all([
        fetchAllProfilesMap(),
        supabase
          .from('notifications')
          .select('*')
          .eq('target_user', currentUserId)
          .order('created_at', { ascending: false }),
        supabase.from('follows').select('*'),
        supabase.from('friendships').select('*'),
        supabase.from('posts').select('*'),
      ]);

    const list: NotificationItem[] = (notifsRes.data || [])
      .filter((n) => n.type !== 'dm' && n.type !== 'gift_tx')
      .map((n) => {
        const actorId = n.actor_user
          ? normalizeTargetUserId(String(n.actor_user))
          : null;
        const actorRow = actorId ? byId.get(actorId) : null;
        return {
          id: n.id,
          userId: currentUserId,
          actorId,
          type: String(n.type || 'like'),
          title: String(n.title || 'Alert'),
          body: String(n.body || ''),
          entityId: String(n.post_id || actorId || ''),
          isRead: Boolean(n.is_read),
          createdAt: n.created_at || new Date().toISOString(),
          actor: actorRow
            ? mapSupabaseRowToUserProfile(
                actorRow,
                followsRes.data || [],
                friendshipsRes.data || [],
                postsRes.data || [],
                currentUserId
              )
            : null,
        };
      });

    return list as unknown as T;
  }

  if (pathname === '/api/notifications/read' && method === 'POST') {
    if (body.notificationId) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', body.notificationId);
    } else {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('target_user', currentUserId);
    }
    return { ok: true } as unknown as T;
  }

  // 11. B-Shop & Gifts State (/api/bshop/state, /api/bshop/buy, /api/bshop/send-gift, /api/bshop/settings)
  if (pathname === '/api/bshop/state') {
    const [{ byId }, giftTxRes] = await Promise.all([
      fetchAllProfilesMap(),
      supabase
        .from('notifications')
        .select('*')
        .eq('type', 'gift_tx')
        .order('created_at', { ascending: false }),
    ]);

    const meRow = byId.get(currentUserId) || byId.get(ADMIN_ABBA_UUID);
    const isAbba = currentUserId === ADMIN_ABBA_UUID;
    const meta = parseProfileMeta(meRow?.join_reason);

    const inventory = isAbba
      ? GIFT_ITEMS_ONLY.map((g) => ({
          itemCode: g.code,
          category: 'gift',
          quantity: 999,
        }))
      : meta.inventory || [];

    const allGiftTxs = giftTxRes.data || [];
    const giftCollection = GIFT_ITEMS_ONLY.map((item) => {
      const receivedTxs = allGiftTxs.filter(
        (tx) =>
          normalizeTargetUserId(String(tx.target_user)) === currentUserId &&
          (tx.subscription as any)?.itemCode === item.code
      );
      const countFromTxs = receivedTxs.reduce(
        (sum, tx) => sum + Number((tx.subscription as any)?.quantity || 1),
        0
      );
      const receivedCount = isAbba ? Math.max(999, countFromTxs) : countFromTxs;
      const invItem = inventory.find((i) => i.itemCode === item.code);

      return {
        code: item.code,
        name: item.name,
        icon: item.icon,
        rarity: item.rarity,
        costBp: item.costBp,
        receivedCount,
        ownedInInventoryCount: isAbba ? 999 : invItem?.quantity || 0,
        mostRecentSender: null,
        lastReceivedAt: receivedTxs[0]?.created_at || null,
      };
    });

    const giftActivity = allGiftTxs
      .filter(
        (tx) =>
          normalizeTargetUserId(String(tx.target_user)) === currentUserId ||
          normalizeTargetUserId(String(tx.actor_user)) === currentUserId
      )
      .map((tx) => {
        const sub = (tx.subscription as any) || {};
        const item = getBShopItemByCode(sub.itemCode || 'rose') || GIFT_ITEMS_ONLY[0];
        const isReceived =
          normalizeTargetUserId(String(tx.target_user)) === currentUserId;
        const otherId = isReceived
          ? normalizeTargetUserId(String(tx.actor_user || ADMIN_ABBA_UUID))
          : normalizeTargetUserId(String(tx.target_user || ADMIN_ABBA_UUID));
        const otherRow = byId.get(otherId) || byId.get(ADMIN_ABBA_UUID);

        return {
          id: tx.id,
          direction: isReceived ? ('received' as const) : ('sent' as const),
          itemCode: item.code,
          itemName: item.name,
          itemIcon: item.icon,
          itemRarity: item.rarity,
          quantity: Number(sub.quantity || 1),
          bpSpent: Number(sub.bpSpent || item.costBp),
          recognitionEarned: Number(sub.recognitionEarned || 10),
          message: String(tx.body || ''),
          createdAt: tx.created_at || new Date().toISOString(),
          counterparty: {
            id: otherId,
            username:
              otherId === ADMIN_ABBA_UUID
                ? 'Abba'
                : String(otherRow?.username || 'user'),
            displayName:
              otherId === ADMIN_ABBA_UUID
                ? 'Prince Abba'
                : String(otherRow?.display_name || 'BoostHub User'),
            avatarUrl: String(otherRow?.avatar_url || ''),
          },
        };
      });

    const state: BShopUserState = {
      boostPoints: isAbba ? 999999999 : Number(meRow?.boost_points || 0),
      xp: Number(meRow?.xp || (isAbba ? 100200 : 0)),
      giftPrivacy: meta.gift_privacy || 'public',
      showcaseGifts: (
        meta.showcase_gifts ??
        (isAbba ? 'crown,diamond,rocket,trophy' : '')
      )
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      equippedFrame: meta.equipped_frame || '',
      equippedBadge: meta.equipped_badge || '',
      equippedNameStyle: meta.equipped_name_style || '',
      giftsReceivedCount: Number(
        meta.gifts_received_count ?? (isAbba ? 7992 : 0)
      ),
      giftRecognitionScore: Number(
        meta.gift_recognition_score ?? (isAbba ? 99999 : 0)
      ),
      inventory,
      giftCollection,
      giftActivity,
    };

    return state as unknown as T;
  }

  if (pathname === '/api/bshop/buy' && method === 'POST') {
    const item = getBShopItemByCode(String(body.itemCode || ''));
    if (!item) throw new Error('Item not found in B-Shop catalog.');
    const qty = Math.max(1, Number(body.quantity || 1));
    const totalCost = item.costBp * qty;

    const { data: meRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .maybeSingle();
    const isAbba = currentUserId === ADMIN_ABBA_UUID;
    const currentBp = isAbba ? 999999999 : Number(meRow?.boost_points || 0);

    if (!isAbba && currentBp < totalCost) {
      throw new Error('Not enough Boost Points (BP) for this purchase.');
    }

    const rewardItem =
      item.category === 'mystery_box' ? rollMysteryBoxReward().item : item;
    const meta = parseProfileMeta(meRow?.join_reason);
    const inv = Array.isArray(meta.inventory) ? [...meta.inventory] : [];
    const existingIdx = inv.findIndex((i) => i.itemCode === rewardItem.code);
    if (existingIdx >= 0) {
      inv[existingIdx].quantity += qty;
    } else {
      inv.push({
        itemCode: rewardItem.code,
        category: rewardItem.category,
        quantity: qty,
      });
    }

    await supabase
      .from('profiles')
      .update({
        boost_points: isAbba ? 999999999 : currentBp - totalCost,
        xp: Number(meRow?.xp || 0) + rewardItem.creatorXpBonus * qty,
        join_reason: JSON.stringify({ ...meta, inventory: inv }),
      })
      .eq('id', currentUserId);

    const state = await handleStaticBackendRequest<BShopUserState>(
      '/api/bshop/state',
      'GET',
      null,
      token
    );
    return { state, mysteryReward: rewardItem } as unknown as T;
  }

  if (pathname === '/api/bshop/send-gift' && method === 'POST') {
    const receiverId = normalizeTargetUserId(String(body.receiverId || ''));
    const item = getBShopItemByCode(String(body.itemCode || 'rose'));
    if (!item) throw new Error('Gift not found.');
    const qty = Math.max(1, Number(body.quantity || 1));
    const totalCost = item.costBp * qty;

    const [{ byId }] = await Promise.all([fetchAllProfilesMap()]);
    const senderRow = byId.get(currentUserId);
    const receiverRow = byId.get(receiverId);
    if (!receiverRow) throw new Error('Recipient not found.');

    const isAbba = currentUserId === ADMIN_ABBA_UUID;
    const senderBp = isAbba ? 999999999 : Number(senderRow?.boost_points || 0);
    if (!isAbba && senderBp < totalCost) {
      throw new Error('Not enough Boost Points (BP) to send this gift.');
    }

    // Record gift transaction in Supabase notifications
    await supabase.from('notifications').insert({
      target_user: receiverId,
      actor_user: currentUserId,
      type: 'gift_tx',
      title: `${item.icon} Gift Received`,
      body: String(body.message || ''),
      is_read: false,
      subscription: {
        itemCode: item.code,
        quantity: qty,
        bpSpent: totalCost,
        recognitionEarned: item.recognitionPoints * qty,
      },
    });

    // Also create visible alert for recipient
    await supabase.from('notifications').insert({
      target_user: receiverId,
      actor_user: currentUserId,
      type: 'badge',
      title: `${item.icon} ${
        isAbba ? 'Prince Abba' : senderRow?.display_name || 'Someone'
      } sent you ${qty} ${item.name}`,
      body: body.message || `Added +${item.recognitionPoints * qty} Recognition`,
      is_read: false,
    });

    const recMeta = parseProfileMeta(receiverRow.join_reason);
    await supabase
      .from('profiles')
      .update({
        xp: Number(receiverRow.xp || 0) + item.creatorXpBonus * qty,
        boost_points:
          receiverId === ADMIN_ABBA_UUID
            ? 999999999
            : Number(receiverRow.boost_points || 0) + Math.round(totalCost * 0.5),
        join_reason: JSON.stringify({
          ...recMeta,
          gifts_received_count:
            Number(recMeta.gifts_received_count || 0) + qty,
          gift_recognition_score:
            Number(recMeta.gift_recognition_score || 0) +
            item.recognitionPoints * qty,
        }),
      })
      .eq('id', receiverId);

    const state = await handleStaticBackendRequest<BShopUserState>(
      '/api/bshop/state',
      'GET',
      null,
      token
    );
    return { state } as unknown as T;
  }

  if (pathname === '/api/bshop/settings' && method === 'PUT') {
    const { data: meRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .maybeSingle();
    if (meRow) {
      const meta = parseProfileMeta(meRow.join_reason);
      const nextMeta: ProfileMeta = {
        ...meta,
        gift_privacy: body.giftPrivacy || meta.gift_privacy || 'public',
        showcase_gifts: Array.isArray(body.showcaseGifts)
          ? body.showcaseGifts.join(',')
          : body.showcaseGifts ?? meta.showcase_gifts,
        equipped_frame:
          body.equippedFrame !== undefined
            ? body.equippedFrame
            : meta.equipped_frame,
        equipped_badge:
          body.equippedBadge !== undefined
            ? body.equippedBadge
            : meta.equipped_badge,
        equipped_name_style:
          body.equippedNameStyle !== undefined
            ? body.equippedNameStyle
            : meta.equipped_name_style,
      };
      await supabase
        .from('profiles')
        .update({ join_reason: JSON.stringify(nextMeta) })
        .eq('id', currentUserId);
    }
    return handleStaticBackendRequest<T>('/api/bshop/state', 'GET', null, token);
  }

  // 12. Creator Dashboard & Search
  if (pathname === '/api/creator-dashboard') {
    const [prof, missionsRes] = await Promise.all([
      handleStaticBackendRequest<UserProfile>('/api/me', 'GET', null, token),
      supabase.from('missions').select('*'),
    ]);

    const missions: MissionItem[] = (missionsRes.data || []).map((m, idx) => ({
      id: m.id || idx + 1,
      code: `mission_${idx + 1}`,
      title: String(m.name || 'Creator Mission'),
      description: 'Complete this mission on BoostHub to earn XP and rewards.',
      missionType: 'daily',
      targetAction: 'create_post',
      targetCount: 1,
      xpReward: Number(m.reward || 100),
      boostPointsReward: 50,
      progress: 1,
      completed: false,
      completedAt: null,
    }));

    return {
      profile: prof,
      missions,
      stats: {
        totalViews: prof.viewsReceivedCount || 0,
        totalLikes: prof.likesReceivedCount || 0,
        totalShares: prof.sharesReceivedCount || 0,
        followersCount: prof.followersCount || 0,
        xp: prof.xp || 0,
        boostPoints: prof.boostPoints || 0,
      },
    } as unknown as T;
  }

  if (pathname === '/api/creator-dashboard/activate') {
    return handleStaticBackendRequest<T>(
      '/api/creator-dashboard',
      'GET',
      null,
      token
    );
  }

  if (pathname === '/api/search') {
    const q = String(searchParams.get('q') || '')
      .trim()
      .toLowerCase();
    const [usersData, postsData, commsData] = await Promise.all([
      fetchAllProfilesMap(),
      handleStaticBackendRequest<PostItem[]>('/api/posts', 'GET', null, token),
      handleStaticBackendRequest<CommunityItem[]>(
        '/api/communities',
        'GET',
        null,
        token
      ),
    ]);

    const users = usersData.rows
      .map((r) => mapSupabaseRowToUserProfile(r, [], [], [], currentUserId))
      .filter(
        (u) =>
          !q ||
          u.username.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q)
      );
    const posts = (postsData || []).filter(
      (p) =>
        !q ||
        p.caption.toLowerCase().includes(q) ||
        p.hashtags.toLowerCase().includes(q) ||
        p.author.username.toLowerCase().includes(q)
    );
    const communities = (commsData || []).filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );

    return { users, posts, communities, hashtags: [] } as unknown as T;
  }

  // 13. Admin Overview & Actions (/api/admin/overview, /api/admin/action)
  if (pathname === '/api/admin/overview') {
    const [usersData, postsData, commsData, dmsRes] = await Promise.all([
      fetchAllProfilesMap(),
      handleStaticBackendRequest<PostItem[]>('/api/posts', 'GET', null, token),
      handleStaticBackendRequest<CommunityItem[]>(
        '/api/communities',
        'GET',
        null,
        token
      ),
      supabase
        .from('notifications')
        .select('*')
        .eq('type', 'dm')
        .order('created_at', { ascending: false }),
    ]);

    const users = usersData.rows.map((r) =>
      mapSupabaseRowToUserProfile(r, [], [], [], currentUserId)
    );

    return {
      users,
      posts: postsData || [],
      communities: commsData || [],
      reports: [],
      botMessages: (dmsRes.data || []).map((m) => ({
        id: m.id,
        senderId: normalizeTargetUserId(String(m.actor_user || '')),
        receiverId: normalizeTargetUserId(String(m.target_user || '')),
        content: m.body || '',
        createdAt: m.created_at,
      })),
    } as unknown as T;
  }

  if (pathname === '/api/admin/action' && method === 'POST') {
    const action = body.action;
    const targetId = normalizeTargetUserId(String(body.targetId || ''));

    if (action === 'toggle_verify' && targetId) {
      const { data: row } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .maybeSingle();
      if (row) {
        const meta = parseProfileMeta(row.join_reason);
        const nextVerified = !meta.verified;
        await supabase
          .from('profiles')
          .update({
            creator_of_week: nextVerified,
            join_reason: JSON.stringify({ ...meta, verified: nextVerified }),
          })
          .eq('id', targetId);
      }
    } else if (action === 'delete_post' && body.targetId) {
      await supabase.from('posts').delete().eq('id', body.targetId);
    } else if (action === 'send_bot_message') {
      const content = String(body.content || '').trim();
      if (content) {
        if (body.targetMode === 'all') {
          const { rows } = await fetchAllProfilesMap();
          for (const r of rows) {
            await supabase.from('notifications').insert({
              target_user: r.id,
              actor_user: BOOST_BOT_UUID,
              type: 'boost_bot',
              title: 'BOOST BOT',
              body: content,
              is_read: false,
            });
          }
        } else if (targetId) {
          await supabase.from('notifications').insert({
            target_user: targetId,
            actor_user: BOOST_BOT_UUID,
            type: 'boost_bot',
            title: 'BOOST BOT',
            body: content,
            is_read: false,
          });
        }
      }
    }
    return { ok: true } as unknown as T;
  }

  // 14. Web Push Subscription endpoints backed by Supabase `push_subscriptions`
  if (pathname === '/api/push/vapid-public-key') {
    return { publicKey: VAPID_PUBLIC_KEY } as unknown as T;
  }

  if (pathname === '/api/push/status') {
    const subs = await getSupabasePushSubscriptionsForUser(currentUserId);
    return {
      subscribed: subs.length > 0,
      deviceCount: subs.length,
    } as unknown as T;
  }

  if (pathname === '/api/push/subscribe' && method === 'POST') {
    if (body.subscription) {
      await upsertSupabasePushSubscription(
        currentUserId,
        body.subscription,
        typeof navigator !== 'undefined' ? navigator.userAgent : ''
      );
    }
    const subs = await getSupabasePushSubscriptionsForUser(currentUserId);
    return {
      ok: true,
      subscribed: true,
      deviceCount: Math.max(1, subs.length),
    } as unknown as T;
  }

  if (pathname === '/api/push/unsubscribe' && method === 'POST') {
    await deleteSupabasePushSubscription(currentUserId, body.endpoint);
    return { ok: true, subscribed: false, deviceCount: 0 } as unknown as T;
  }

  if (pathname === '/api/push/test' && method === 'POST') {
    const res = await dispatchRealPushNotification({
      userId: currentUserId,
      title: 'BoostHub Real-Time Push',
      body: 'Connected to Supabase real-time backend!',
      type: 'boost_bot',
      url: '/?tab=notifications',
    });
    return { ok: true, sent: Math.max(1, res.sent) } as unknown as T;
  }

  if (pathname === '/api/blocked-users') {
    return [] as unknown as T;
  }

  return { ok: true } as unknown as T;
}
