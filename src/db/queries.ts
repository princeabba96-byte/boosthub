import crypto from 'crypto';
import { and, desc, eq, gt, ilike, inArray, ne, or } from 'drizzle-orm';
import { db } from './index.ts';
import {
  users,
  profiles,
  userInterests,
  posts,
  postLikes,
  postComments,
  postShares,
  savedPosts,
  follows,
  friendships,
  stories,
  storyViews,
  storyReactions,
  storyReplies,
  messages,
  notifications,
  communities,
  communityMembers,
  communityPosts,
  videoWatchHistory,
  missions,
  userMissions,
  badges,
  userBadges,
  monetizationRequirements,
  creatorRewards,
  contentFeedback,
  mediaStorage,
} from './schema.ts';
import { getOrCreateUser, invalidateUserCache } from './users.ts';
import { sendPushNotificationToUser } from '../lib/webPushServer.ts';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  if (hashBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, keyBuffer);
}

async function resolveAuthAvatarUrl(uid: string, rawAvatarUrl?: string): Promise<string | undefined> {
  if (!rawAvatarUrl || !rawAvatarUrl.trim()) return undefined;
  const trimmed = rawAvatarUrl.trim();
  if (trimmed.startsWith('data:image/')) {
    try {
      const mimeMatch = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const saved = await storePermanentMedia(
        uid,
        'avatars',
        `avatar_${Date.now()}.jpg`,
        mimeType,
        trimmed.length,
        trimmed
      );
      return `/api/media/${saved.id}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export async function registerEmailAccount(
  email: string,
  password: string,
  displayName: string,
  username: string,
  avatarUrl?: string
) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const rawUsername = (username || email.split('@')[0] || 'creator')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    const cleanUsername = rawUsername.length >= 3 ? rawUsername : `${rawUsername}user`;

    if (!cleanEmail || !password || password.length < 6) {
      throw new Error('Please provide a valid email and a password of at least 6 characters.');
    }

    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail));

    const uid =
      existingEmail.length > 0
        ? existingEmail[0].uid
        : `bh_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
    const pwdHash = hashPassword(password);

    if (existingEmail.length > 0) {
      if (existingEmail[0].passwordHash) {
        if (!verifyPassword(password, existingEmail[0].passwordHash)) {
          throw new Error(
            'This email is already registered. Please sign in with your existing password.'
          );
        }
      } else {
        await db
          .update(users)
          .set({ passwordHash: pwdHash })
          .where(eq(users.uid, uid));
      }
    } else {
      await db.insert(users).values({
        uid,
        email: cleanEmail,
        passwordHash: pwdHash,
      });
    }

    const resolvedAvatar = await resolveAuthAvatarUrl(uid, avatarUrl);
    const profile = await getOrCreateUser(
      uid,
      cleanEmail,
      displayName || cleanUsername,
      resolvedAvatar
    );

    const existingUsername = await db
      .select()
      .from(profiles)
      .where(eq(profiles.username, cleanUsername));

    const resolvedUsername =
      existingUsername.length === 0 || existingUsername[0].id === uid
        ? cleanUsername
        : profile.username && profile.id === uid
          ? profile.username
          : `${cleanUsername}_${uid.slice(-4)}`;

    const updateFields: Record<string, any> = {
      username: resolvedUsername,
      displayName: displayName.trim() || profile.displayName || resolvedUsername,
      updatedAt: new Date(),
    };
    if (resolvedAvatar) {
      updateFields.avatarUrl = resolvedAvatar;
    }

    const updatedProfile = await db
      .update(profiles)
      .set(updateFields)
      .where(eq(profiles.id, uid))
      .returning();

    invalidateUserCache(uid);
    return updatedProfile[0] || profile;
  } catch (error: any) {
    console.warn('Notice in registerEmailAccount:', error?.message || error);
    throw new Error(error.message || 'Registration failed. Please try again.', { cause: error });
  }
}

export async function loginEmailAccount(
  email: string,
  password: string,
  avatarUrl?: string
) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Please enter your email and password.');
    }

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail));

    if (userRows.length === 0) {
      // Auto-provision account if signing in with a new email
      const defaultUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '') || 'creator';
      return await registerEmailAccount(
        cleanEmail,
        password.length >= 6 ? password : `${password}123456`.slice(0, 6),
        defaultUsername,
        defaultUsername,
        avatarUrl
      );
    }

    const userRecord = userRows[0];
    if (!userRecord.passwordHash) {
      const pwdHash = hashPassword(password);
      await db
        .update(users)
        .set({ passwordHash: pwdHash })
        .where(eq(users.uid, userRecord.uid));
    } else if (!verifyPassword(password, userRecord.passwordHash)) {
      throw new Error('Invalid email or password.');
    }

    let profile = await getOrCreateUser(userRecord.uid, cleanEmail);
    if (profile.isSuspended) {
      throw new Error('This account has been suspended by moderation.');
    }

    const resolvedAvatar = await resolveAuthAvatarUrl(userRecord.uid, avatarUrl);
    if (resolvedAvatar) {
      const updated = await db
        .update(profiles)
        .set({
          avatarUrl: resolvedAvatar,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userRecord.uid))
        .returning();
      invalidateUserCache(userRecord.uid);
      if (updated[0]) profile = updated[0];
    }

    return profile;
  } catch (error: any) {
    console.warn('Notice in loginEmailAccount:', error?.message || error);
    throw new Error(error.message || 'Sign in failed. Please check your credentials.', { cause: error });
  }
}

export async function resetEmailPassword(email: string, newPassword: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail));
    if (userRows.length === 0) {
      throw new Error('No account found with that email address.');
    }
    const pwdHash = hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash: pwdHash })
      .where(eq(users.uid, userRows[0].uid));
    return { success: true };
  } catch (error: any) {
    console.warn('Notice in resetEmailPassword:', error?.message || error);
    throw new Error(error.message || 'Password reset failed. Please try again.', { cause: error });
  }
}

export async function getFullUserProfile(targetUserId: string, viewerId: string) {
  try {
    const [
      profileRows,
      interests,
      followersRows,
      followingRows,
      friendRows,
      userPosts,
      friendshipWithViewer,
      awardedBadges,
    ] = await Promise.all([
      db.select().from(profiles).where(eq(profiles.id, targetUserId)),
      db.select().from(userInterests).where(eq(userInterests.userId, targetUserId)),
      db.select().from(follows).where(eq(follows.followingId, targetUserId)),
      db.select().from(follows).where(eq(follows.followerId, targetUserId)),
      db
        .select()
        .from(friendships)
        .where(
          and(
            eq(friendships.status, 'accepted'),
            or(
              eq(friendships.requesterId, targetUserId),
              eq(friendships.addresseeId, targetUserId)
            )
          )
        ),
      db
        .select()
        .from(posts)
        .where(and(eq(posts.userId, targetUserId), eq(posts.isHidden, false)))
        .orderBy(desc(posts.createdAt)),
      db
        .select()
        .from(friendships)
        .where(
          or(
            and(
              eq(friendships.requesterId, viewerId),
              eq(friendships.addresseeId, targetUserId)
            ),
            and(
              eq(friendships.requesterId, targetUserId),
              eq(friendships.addresseeId, viewerId)
            )
          )
        ),
      db
        .select({
          id: badges.id,
          code: badges.code,
          name: badges.name,
          description: badges.description,
          iconName: badges.iconName,
          awardedAt: userBadges.awardedAt,
        })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, targetUserId)),
    ]);

    if (profileRows.length === 0) return null;
    const profile = profileRows[0];

    const postIds = userPosts.map((p) => p.id);
    let totalLikesReceived = 0;
    let totalSharesReceived = 0;
    if (postIds.length > 0) {
      const [likesOnUserPosts, sharesOnUserPosts] = await Promise.all([
        db.select().from(postLikes).where(inArray(postLikes.postId, postIds)),
        db.select().from(postShares).where(inArray(postShares.postId, postIds)),
      ]);
      totalLikesReceived = likesOnUserPosts.length;
      totalSharesReceived = sharesOnUserPosts.length;
    }

    const totalViewsReceived = userPosts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
    const isFollowing = followersRows.some((f) => f.followerId === viewerId);

    let friendshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received' = 'none';
    let friendshipId: number | null = null;
    if (friendshipWithViewer.length > 0) {
      const rel = friendshipWithViewer[0];
      friendshipId = rel.id;
      if (rel.status === 'accepted') {
        friendshipStatus = 'friends';
      } else if (rel.status === 'pending') {
        friendshipStatus = rel.requesterId === viewerId ? 'pending_sent' : 'pending_received';
      }
    }

    return {
      ...profile,
      interests: interests.map((i) => i.category),
      followersCount: followersRows.length,
      followingCount: followingRows.length,
      friendsCount: friendRows.length,
      likesReceivedCount: totalLikesReceived,
      sharesReceivedCount: totalSharesReceived,
      viewsReceivedCount: totalViewsReceived,
      postsCount: userPosts.length,
      isFollowing,
      friendshipStatus,
      friendshipId,
      badges: awardedBadges,
    };
  } catch (error) {
    console.error('Database query failed in getFullUserProfile:', error);
    throw new Error('Failed to load profile information.', { cause: error });
  }
}

export async function completeUserOnboarding(
  userId: string,
  categories: string[],
  joinReason: string,
  wantToWatch: string,
  wantToCreate: string
) {
  try {
    if (!Array.isArray(categories) || categories.length !== 6) {
      throw new Error('Please select exactly 6 interest categories.');
    }

    await db.delete(userInterests).where(eq(userInterests.userId, userId));
    await db.insert(userInterests).values(
      categories.map((category) => ({
        userId,
        category,
      }))
    );

    const updated = await db
      .update(profiles)
      .set({
        onboardingCompleted: true,
        joinReason: joinReason || '',
        wantToWatch: wantToWatch || '',
        wantToCreate: wantToCreate || '',
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    invalidateUserCache(userId);
    return updated[0];
  } catch (error: any) {
    console.error('Database query failed in completeUserOnboarding:', error);
    throw new Error(error.message || 'Failed to save onboarding preferences.', { cause: error });
  }
}

export async function updateUserProfileData(
  userId: string,
  updates: {
    displayName?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    whoCanMessage?: string;
    commentControl?: string;
    isPrivate?: boolean;
    notificationsEnabled?: boolean;
    categories?: string[];
  }
) {
  try {
    if (updates.username) {
      const cleanUsername = updates.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const existing = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.username, cleanUsername), ne(profiles.id, userId)));
      if (existing.length > 0) {
        throw new Error('Username is already taken by another user.');
      }
      updates.username = cleanUsername;
    }

    if (updates.categories && updates.categories.length > 0) {
      await db.delete(userInterests).where(eq(userInterests.userId, userId));
      await db.insert(userInterests).values(
        updates.categories.map((category) => ({
          userId,
          category,
        }))
      );
    }

    const setObj: Record<string, any> = { updatedAt: new Date() };
    if (updates.displayName !== undefined) setObj.displayName = updates.displayName.trim();
    if (updates.username !== undefined) setObj.username = updates.username;
    if (updates.bio !== undefined) setObj.bio = updates.bio;
    if (updates.avatarUrl !== undefined) setObj.avatarUrl = updates.avatarUrl;
    if (updates.whoCanMessage !== undefined) setObj.whoCanMessage = updates.whoCanMessage;
    if (updates.commentControl !== undefined) setObj.commentControl = updates.commentControl;
    if (updates.isPrivate !== undefined) setObj.isPrivate = updates.isPrivate;
    if (updates.notificationsEnabled !== undefined)
      setObj.notificationsEnabled = updates.notificationsEnabled;

    const updated = await db
      .update(profiles)
      .set(setObj)
      .where(eq(profiles.id, userId))
      .returning();

    invalidateUserCache(userId);
    return updated[0];
  } catch (error: any) {
    console.error('Database query failed in updateUserProfileData:', error);
    throw new Error(error.message || 'Failed to update profile.', { cause: error });
  }
}

export async function trackMissionAndBadges(
  userId: string,
  actionType: 'like' | 'comment' | 'watch_capshot' | 'follow' | 'create_post' | 'share'
) {
  try {
    const allMissions = await db
      .select()
      .from(missions)
      .where(eq(missions.targetAction, actionType));

    for (const mission of allMissions) {
      const existingProgress = await db
        .select()
        .from(userMissions)
        .where(
          and(
            eq(userMissions.userId, userId),
            eq(userMissions.missionId, mission.id)
          )
        );

      if (existingProgress.length === 0) {
        const isDone = 1 >= mission.targetCount;
        await db.insert(userMissions).values({
          userId,
          missionId: mission.id,
          progress: 1,
          completed: isDone,
          completedAt: isDone ? new Date() : null,
        });
        if (isDone) {
          await awardMissionReward(userId, mission);
        }
      } else {
        const record = existingProgress[0];
        if (!record.completed) {
          const nextProgress = record.progress + 1;
          const isDone = nextProgress >= mission.targetCount;
          await db
            .update(userMissions)
            .set({
              progress: nextProgress,
              completed: isDone,
              completedAt: isDone ? new Date() : null,
              updatedAt: new Date(),
            })
            .where(eq(userMissions.id, record.id));
          if (isDone) {
            await awardMissionReward(userId, mission);
          }
        }
      }
    }

    await evaluateUserBadges(userId);
  } catch (error) {
    console.error('Database query failed in trackMissionAndBadges:', error);
  }
}

async function awardMissionReward(
  userId: string,
  mission: typeof missions.$inferSelect
) {
  const userRows = await db.select().from(profiles).where(eq(profiles.id, userId));
  if (userRows.length === 0) return;
  const current = userRows[0];
  await db
    .update(profiles)
    .set({
      xp: current.xp + mission.xpReward,
      boostPoints: current.boostPoints + mission.boostPointsReward,
    })
    .where(eq(profiles.id, userId));

  await db.insert(creatorRewards).values({
    userId,
    rewardType: 'mission',
    title: `Completed: ${mission.title}`,
    pointsEarned: mission.boostPointsReward,
    status: 'unlocked',
  });

  await db.insert(notifications).values({
    userId,
    actorId: userId,
    type: 'mission',
    title: 'Mission Completed!',
    body: `You completed "${mission.title}" and earned +${mission.xpReward} XP and +${mission.boostPointsReward} Boost Points!`,
    entityId: String(mission.id),
  });
}

export async function evaluateUserBadges(userId: string) {
  try {
    const allBadges = await db.select().from(badges);
    const earned = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
    const earnedIds = new Set(earned.map((e) => e.badgeId));

    const userPosts = await db.select().from(posts).where(eq(posts.userId, userId));
    const postIds = userPosts.map((p) => p.id);
    let likesReceived = 0;
    if (postIds.length > 0) {
      const likesRows = await db
        .select()
        .from(postLikes)
        .where(inArray(postLikes.postId, postIds));
      likesReceived = likesRows.length;
    }

    const followingRows = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    const commRows = await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));

    const userRow = await db.select().from(profiles).where(eq(profiles.id, userId));
    const currentXp = userRow[0]?.xp || 0;

    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue;
      let qualifies = false;
      if (badge.requirementType === 'posts' && userPosts.length >= badge.requirementCount) {
        qualifies = true;
      } else if (
        badge.requirementType === 'likes_received' &&
        likesReceived >= badge.requirementCount
      ) {
        qualifies = true;
      } else if (
        badge.requirementType === 'follows' &&
        followingRows.length >= badge.requirementCount
      ) {
        qualifies = true;
      } else if (
        badge.requirementType === 'communities' &&
        commRows.length >= badge.requirementCount
      ) {
        qualifies = true;
      } else if (badge.requirementType === 'xp' && currentXp >= badge.requirementCount) {
        qualifies = true;
      }

      if (qualifies) {
        await db.insert(userBadges).values({
          userId,
          badgeId: badge.id,
        });
        await db.insert(notifications).values({
          userId,
          actorId: userId,
          type: 'badge',
          title: 'New Badge Unlocked!',
          body: `Congratulations! You unlocked the "${badge.name}" badge.`,
          entityId: badge.code,
        });
      }
    }
  } catch (error) {
    console.error('Database query failed in evaluateUserBadges:', error);
  }
}

export async function getPersonalizedFeed(
  viewerId: string,
  tab: 'recommended' | 'following' | 'friends' | 'trending' | 'new' = 'recommended',
  limit = 15,
  offset = 0,
  authorId?: string
) {
  try {
    const [allPosts, feedbackRows, interestsRows, followingRows, friendRows] =
      await Promise.all([
        db
          .select()
          .from(posts)
          .where(
            authorId
              ? and(eq(posts.isHidden, false), eq(posts.userId, authorId))
              : eq(posts.isHidden, false)
          )
          .orderBy(desc(posts.createdAt))
          .limit(80),
        db
          .select()
          .from(contentFeedback)
          .where(eq(contentFeedback.userId, viewerId)),
        db
          .select()
          .from(userInterests)
          .where(eq(userInterests.userId, viewerId)),
        db
          .select()
          .from(follows)
          .where(eq(follows.followerId, viewerId)),
        db
          .select()
          .from(friendships)
          .where(
            and(
              eq(friendships.status, 'accepted'),
              or(
                eq(friendships.requesterId, viewerId),
                eq(friendships.addresseeId, viewerId)
              )
            )
          ),
      ]);

    if (allPosts.length === 0) return [];

    const hiddenPostIds = new Set(
      feedbackRows
        .filter(
          (f) =>
            (f.targetType === 'post' || f.targetType === 'video') &&
            (f.feedbackType === 'hide' || f.feedbackType === 'not_interested')
        )
        .map((f) => Number(f.targetId))
    );

    const blockedUserIds = new Set(
      feedbackRows
        .filter(
          (f) =>
            f.targetType === 'user' &&
            (f.feedbackType === 'block' || f.feedbackType === 'mute')
        )
        .map((f) => f.targetId)
    );

    const viewerInterests = new Set(interestsRows.map((i) => i.category.toLowerCase()));
    const followingIds = new Set(followingRows.map((f) => f.followingId));
    const friendIds = new Set(
      friendRows.map((f) => (f.requesterId === viewerId ? f.addresseeId : f.requesterId))
    );

    const authorIds = Array.from(new Set(allPosts.map((p) => p.userId)));
    const postIds = allPosts.map((p) => p.id);

    const [authorProfiles, likesAll, commentsAll, sharesAll, savesAll] =
      await Promise.all([
        authorIds.length > 0
          ? db.select().from(profiles).where(inArray(profiles.id, authorIds))
          : Promise.resolve([]),
        postIds.length > 0
          ? db.select().from(postLikes).where(inArray(postLikes.postId, postIds))
          : Promise.resolve([]),
        postIds.length > 0
          ? db.select().from(postComments).where(inArray(postComments.postId, postIds))
          : Promise.resolve([]),
        postIds.length > 0
          ? db.select().from(postShares).where(inArray(postShares.postId, postIds))
          : Promise.resolve([]),
        postIds.length > 0
          ? db.select().from(savedPosts).where(inArray(savedPosts.postId, postIds))
          : Promise.resolve([]),
      ]);

    const profileMap = new Map(authorProfiles.map((p) => [p.id, p]));

    const enriched = allPosts
      .filter((p) => !hiddenPostIds.has(p.id) && !blockedUserIds.has(p.userId))
      .filter((p) => {
        if (authorId) return true;
        if (tab === 'following') return followingIds.has(p.userId) || p.userId === viewerId;
        if (tab === 'friends') return friendIds.has(p.userId) || p.userId === viewerId;
        return true;
      })
      .map((post) => {
        const author = profileMap.get(post.userId);
        const postLikesList = likesAll.filter((l) => l.postId === post.id);
        const postCommentsList = commentsAll.filter((c) => c.postId === post.id);
        const postSharesList = sharesAll.filter((s) => s.postId === post.id);
        const postSavesList = savesAll.filter((s) => s.postId === post.id);

        const isLiked = postLikesList.some((l) => l.userId === viewerId);
        const isSaved = postSavesList.some((s) => s.userId === viewerId);
        const isFollowingAuthor = followingIds.has(post.userId);

        let recommendationScore = 0;
        if (viewerInterests.has((post.category || '').toLowerCase())) {
          recommendationScore += 30;
        }
        if (followingIds.has(post.userId)) recommendationScore += 25;
        if (friendIds.has(post.userId)) recommendationScore += 35;
        recommendationScore += postLikesList.length * 4;
        recommendationScore += postCommentsList.length * 6;
        recommendationScore += postSharesList.length * 8;
        recommendationScore += postSavesList.length * 7;
        recommendationScore += Math.min(40, Math.floor((post.viewsCount || 0) / 5));

        const ageHours = Math.max(
          1,
          (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60)
        );
        const recencyBoost = Math.max(0, 50 - ageHours * 1.5);
        recommendationScore += recencyBoost;

        return {
          ...post,
          author: author
            ? {
                id: author.id,
                username: author.username,
                displayName: author.displayName,
                avatarUrl: author.avatarUrl,
                isVerified: author.isVerified,
                role: author.role,
              }
            : {
                id: post.userId,
                username: 'user',
                displayName: 'BoostHub User',
                avatarUrl: '',
                isVerified: false,
                role: 'user',
              },
          likesCount: postLikesList.length,
          commentsCount: postCommentsList.length,
          sharesCount: postSharesList.length,
          savesCount: postSavesList.length,
          isLiked,
          isSaved,
          isFollowingAuthor,
          recommendationScore,
        };
      });

    if (tab === 'trending') {
      enriched.sort(
        (a, b) =>
          b.likesCount * 3 +
          b.commentsCount * 4 +
          b.sharesCount * 5 +
          b.viewsCount -
          (a.likesCount * 3 + a.commentsCount * 4 + a.sharesCount * 5 + a.viewsCount)
      );
    } else if (tab === 'recommended' && !authorId) {
      enriched.sort((a, b) => b.recommendationScore - a.recommendationScore);
    } else {
      enriched.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return enriched.slice(offset, offset + limit);
  } catch (error) {
    console.error('Database query failed in getPersonalizedFeed:', error);
    throw new Error('Failed to load feed posts.', { cause: error });
  }
}

export async function getCapshotsFeed(viewerId: string, limit = 20, offset = 0) {
  try {
    const allFeed = await getPersonalizedFeed(viewerId, 'recommended', 100, 0);
    const capshotsOnly = allFeed.filter(
      (p) => p.postType === 'capshot' || p.postType === 'video'
    );
    return capshotsOnly.slice(offset, offset + limit);
  } catch (error) {
    console.error('Database query failed in getCapshotsFeed:', error);
    throw new Error('Failed to load Capshots.', { cause: error });
  }
}

export async function createNewPost(
  userId: string,
  payload: {
    postType: 'photo' | 'video' | 'text' | 'capshot';
    caption: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    hashtags?: string;
    category?: string;
    linkUrl?: string;
  }
) {
  try {
    if (payload.mediaUrl && payload.mediaUrl.startsWith('blob:')) {
      throw new Error('Temporary blob URLs are not permitted. Please upload media to permanent storage.');
    }

    const inserted = await db
      .insert(posts)
      .values({
        userId,
        postType: payload.postType || 'text',
        caption: payload.caption || '',
        mediaUrl: payload.mediaUrl || '',
        thumbnailUrl: payload.thumbnailUrl || '',
        hashtags: payload.hashtags || '',
        category: payload.category || 'Lifestyle',
        linkUrl: payload.linkUrl || '',
      })
      .returning();

    await trackMissionAndBadges(userId, 'create_post');
    return inserted[0];
  } catch (error: any) {
    console.error('Database query failed in createNewPost:', error);
    throw new Error(error.message || 'Failed to publish post.', { cause: error });
  }
}

export async function togglePostLike(postId: number, userId: string) {
  try {
    const existing = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

    if (existing.length > 0) {
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      return { liked: false };
    } else {
      await db.insert(postLikes).values({ postId, userId });
      const postRows = await db.select().from(posts).where(eq(posts.id, postId));
      if (postRows.length > 0 && postRows[0].userId !== userId) {
        const actor = await db.select().from(profiles).where(eq(profiles.id, userId));
        const actorName = actor[0]?.displayName || 'Someone';
        const isVideo =
          postRows[0].postType === 'capshot' || postRows[0].postType === 'video';
        const notifBody = `${actorName} liked your ${isVideo ? 'video' : 'post'}.`;
        await db.insert(notifications).values({
          userId: postRows[0].userId,
          actorId: userId,
          type: 'like',
          title: 'New Like',
          body: notifBody,
          entityId: String(postId),
        });
        await sendPushNotificationToUser(postRows[0].userId, {
          title: 'New Like on BoostHub ❤️',
          body: notifBody,
          type: 'like',
          entityId: String(postId),
          url: '/?tab=notifications',
        });
      }
      await trackMissionAndBadges(userId, 'like');
      if (postRows.length > 0) {
        await evaluateUserBadges(postRows[0].userId);
      }
      return { liked: true };
    }
  } catch (error) {
    console.error('Database query failed in togglePostLike:', error);
    throw new Error('Failed to update like.', { cause: error });
  }
}

export async function toggleSavePost(postId: number, userId: string) {
  try {
    const existing = await db
      .select()
      .from(savedPosts)
      .where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, userId)));

    if (existing.length > 0) {
      await db
        .delete(savedPosts)
        .where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, userId)));
      return { saved: false };
    } else {
      await db.insert(savedPosts).values({ postId, userId });
      return { saved: true };
    }
  } catch (error) {
    console.error('Database query failed in toggleSavePost:', error);
    throw new Error('Failed to update saved status.', { cause: error });
  }
}

export async function recordPostShare(
  postId: number,
  userId: string,
  shareType: string
) {
  try {
    await db.insert(postShares).values({
      postId,
      userId,
      shareType: shareType || 'link',
    });

    const postRows = await db.select().from(posts).where(eq(posts.id, postId));
    if (postRows.length > 0 && postRows[0].userId !== userId) {
      const actor = await db.select().from(profiles).where(eq(profiles.id, userId));
      const actorName = actor[0]?.displayName || 'Someone';
      await db.insert(notifications).values({
        userId: postRows[0].userId,
        actorId: userId,
        type: 'share',
        title: 'Post Shared',
        body: `${actorName} shared your post.`,
        entityId: String(postId),
      });
      await sendPushNotificationToUser(postRows[0].userId, {
        title: 'Your Content Was Shared 🔄',
        body: `${actorName} shared your post.`,
        type: 'share',
        entityId: String(postId),
        url: '/?tab=notifications',
      });
    }

    await trackMissionAndBadges(userId, 'share');
    return { shared: true };
  } catch (error) {
    console.error('Database query failed in recordPostShare:', error);
    throw new Error('Failed to record share.', { cause: error });
  }
}

export async function recordVideoWatchMetric(
  postId: number,
  userId: string,
  watchDurationSeconds: number,
  completionPercentage: number,
  skipped: boolean
) {
  try {
    await db.insert(videoWatchHistory).values({
      postId,
      userId,
      watchDurationSeconds: Math.max(0, Math.round(watchDurationSeconds)),
      completionPercentage: Math.min(100, Math.max(0, Math.round(completionPercentage))),
      skipped: Boolean(skipped),
    });

    const postRows = await db.select().from(posts).where(eq(posts.id, postId));
    if (postRows.length > 0) {
      const current = postRows[0];
      await db
        .update(posts)
        .set({
          viewsCount: (current.viewsCount || 0) + 1,
          watchDurationTotal:
            (current.watchDurationTotal || 0) + Math.max(0, Math.round(watchDurationSeconds)),
          completionRateSum:
            (current.completionRateSum || 0) +
            Math.min(100, Math.max(0, Math.round(completionPercentage))),
        })
        .where(eq(posts.id, postId));
    }

    if (!skipped && watchDurationSeconds >= 2) {
      await trackMissionAndBadges(userId, 'watch_capshot');
    }

    return { recorded: true };
  } catch (error) {
    console.error('Database query failed in recordVideoWatchMetric:', error);
    throw new Error('Failed to record watch telemetry.', { cause: error });
  }
}

export async function getSavedPostsForUser(userId: string) {
  try {
    const savedRows = await db
      .select()
      .from(savedPosts)
      .where(eq(savedPosts.userId, userId))
      .orderBy(desc(savedPosts.createdAt));

    if (savedRows.length === 0) return [];
    const savedIds = new Set(savedRows.map((s) => s.postId));
    const allFeed = await getPersonalizedFeed(userId, 'new', 200, 0);
    return allFeed.filter((p) => savedIds.has(p.id));
  } catch (error) {
    console.error('Database query failed in getSavedPostsForUser:', error);
    throw new Error('Failed to load saved content.', { cause: error });
  }
}

export async function getCommentsForPost(postId: number) {
  try {
    const rows = await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(desc(postComments.isPinned), desc(postComments.createdAt));

    if (rows.length === 0) return [];
    const authorIds = Array.from(new Set(rows.map((r) => r.userId)));
    const authors = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.id, authorIds));
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    return rows.map((c) => {
      const author = authorMap.get(c.userId);
      return {
        ...c,
        author: author
          ? {
              id: author.id,
              username: author.username,
              displayName: author.displayName,
              avatarUrl: author.avatarUrl,
              isVerified: author.isVerified,
            }
          : {
              id: c.userId,
              username: 'user',
              displayName: 'BoostHub User',
              avatarUrl: '',
              isVerified: false,
            },
      };
    });
  } catch (error) {
    console.error('Database query failed in getCommentsForPost:', error);
    throw new Error('Failed to load comments.', { cause: error });
  }
}

export async function addPostComment(
  postId: number,
  userId: string,
  content: string,
  parentId?: number | null
) {
  try {
    const clean = content.trim();
    if (!clean) throw new Error('Comment cannot be empty.');

    const inserted = await db
      .insert(postComments)
      .values({
        postId,
        userId,
        parentId: parentId || null,
        content: clean,
      })
      .returning();

    const postRows = await db.select().from(posts).where(eq(posts.id, postId));
    const actor = await db.select().from(profiles).where(eq(profiles.id, userId));
    const actorName = actor[0]?.displayName || 'Someone';

    if (postRows.length > 0 && postRows[0].userId !== userId) {
      const notifTitle = parentId ? 'New Reply' : 'New Comment';
      const notifBody = `${actorName} commented: "${clean.slice(0, 60)}"`;
      await db.insert(notifications).values({
        userId: postRows[0].userId,
        actorId: userId,
        type: parentId ? 'reply' : 'comment',
        title: notifTitle,
        body: notifBody,
        entityId: String(postId),
      });
      await sendPushNotificationToUser(postRows[0].userId, {
        title: `${notifTitle} on BoostHub 💬`,
        body: notifBody,
        type: parentId ? 'reply' : 'comment',
        entityId: String(postId),
        url: '/?tab=notifications',
      });
    }

    await trackMissionAndBadges(userId, 'comment');
    const comments = await getCommentsForPost(postId);
    return comments.find((c) => c.id === inserted[0].id) || inserted[0];
  } catch (error: any) {
    console.error('Database query failed in addPostComment:', error);
    throw new Error(error.message || 'Failed to post comment.', { cause: error });
  }
}

export async function modifyComment(
  commentId: number,
  userId: string,
  action: 'edit' | 'delete' | 'react' | 'pin',
  content?: string
) {
  try {
    const existing = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, commentId));
    if (existing.length === 0) throw new Error('Comment not found.');
    const target = existing[0];

    if (action === 'react') {
      const updated = await db
        .update(postComments)
        .set({ reactionsCount: (target.reactionsCount || 0) + 1 })
        .where(eq(postComments.id, commentId))
        .returning();
      return updated[0];
    }

    if (action === 'pin') {
      const postRow = await db.select().from(posts).where(eq(posts.id, target.postId));
      if (postRow.length === 0 || postRow[0].userId !== userId) {
        throw new Error('Only the post creator can pin comments.');
      }
      const updated = await db
        .update(postComments)
        .set({ isPinned: !target.isPinned })
        .where(eq(postComments.id, commentId))
        .returning();
      return updated[0];
    }

    if (target.userId !== userId) {
      throw new Error('You can only modify your own comments.');
    }

    if (action === 'delete') {
      await db.delete(postComments).where(eq(postComments.id, commentId));
      return { deleted: true };
    }

    if (action === 'edit' && content) {
      const updated = await db
        .update(postComments)
        .set({ content: content.trim(), updatedAt: new Date() })
        .where(eq(postComments.id, commentId))
        .returning();
      return updated[0];
    }

    return target;
  } catch (error: any) {
    console.error('Database query failed in modifyComment:', error);
    throw new Error(error.message || 'Failed to update comment.', { cause: error });
  }
}

export async function toggleFollowUser(followerId: string, followingId: string) {
  try {
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself.');
    }
    const existing = await db
      .select()
      .from(follows)
      .where(
        and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
      );

    if (existing.length > 0) {
      await db
        .delete(follows)
        .where(
          and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
        );
      return { following: false };
    } else {
      await db.insert(follows).values({ followerId, followingId });
      const actor = await db.select().from(profiles).where(eq(profiles.id, followerId));
      const actorName = actor[0]?.displayName || 'Someone';
      await db.insert(notifications).values({
        userId: followingId,
        actorId: followerId,
        type: 'follow',
        title: 'New Follower',
        body: `${actorName} started following you.`,
        entityId: followerId,
      });
      await sendPushNotificationToUser(followingId, {
        title: 'New Follower on BoostHub 🎉',
        body: `${actorName} started following you.`,
        type: 'follow',
        entityId: followerId,
        url: '/?tab=notifications',
      });
      await trackMissionAndBadges(followerId, 'follow');
      return { following: true };
    }
  } catch (error: any) {
    console.error('Database query failed in toggleFollowUser:', error);
    throw new Error(error.message || 'Failed to update follow status.', { cause: error });
  }
}

export async function getFollowLists(userId: string) {
  try {
    const followerRows = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId));
    const followingRows = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followerIds = followerRows.map((r) => r.followerId);
    const followingIds = followingRows.map((r) => r.followingId);

    const followersProfiles =
      followerIds.length > 0
        ? await db.select().from(profiles).where(inArray(profiles.id, followerIds))
        : [];
    const followingProfiles =
      followingIds.length > 0
        ? await db.select().from(profiles).where(inArray(profiles.id, followingIds))
        : [];

    return {
      followers: followersProfiles,
      following: followingProfiles,
    };
  } catch (error) {
    console.error('Database query failed in getFollowLists:', error);
    throw new Error('Failed to load followers and following lists.', { cause: error });
  }
}

export async function getFriendsState(userId: string) {
  try {
    const allRels = await db
      .select()
      .from(friendships)
      .where(
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId))
      )
      .orderBy(desc(friendships.updatedAt));

    const allUsers = await db.select().from(profiles);
    const profileMap = new Map(allUsers.map((u) => [u.id, u]));

    const myFriendIds = new Set<string>();
    const connectedUserIds = new Set<string>([userId]);

    const friends: any[] = [];
    const pendingReceived: any[] = [];
    const pendingSent: any[] = [];

    for (const rel of allRels) {
      const otherId = rel.requesterId === userId ? rel.addresseeId : rel.requesterId;
      const otherProfile = profileMap.get(otherId);
      if (!otherProfile) continue;

      if (rel.status === 'accepted') {
        myFriendIds.add(otherId);
        connectedUserIds.add(otherId);
        friends.push({ friendshipId: rel.id, profile: otherProfile });
      } else if (rel.status === 'pending') {
        connectedUserIds.add(otherId);
        if (rel.addresseeId === userId) {
          pendingReceived.push({ friendshipId: rel.id, profile: otherProfile });
        } else {
          pendingSent.push({ friendshipId: rel.id, profile: otherProfile });
        }
      }
    }

    const allAccepted = await db
      .select()
      .from(friendships)
      .where(eq(friendships.status, 'accepted'));

    const suggestions = allUsers
      .filter((u) => !connectedUserIds.has(u.id) && !u.isSuspended)
      .map((candidate) => {
        const candidateFriends = allAccepted
          .filter(
            (f) => f.requesterId === candidate.id || f.addresseeId === candidate.id
          )
          .map((f) => (f.requesterId === candidate.id ? f.addresseeId : f.requesterId));
        const mutualCount = candidateFriends.filter((id) => myFriendIds.has(id)).length;
        return {
          profile: candidate,
          mutualFriendsCount: mutualCount,
        };
      })
      .sort((a, b) => b.mutualFriendsCount - a.mutualFriendsCount)
      .slice(0, 20);

    return {
      friends,
      pendingReceived,
      pendingSent,
      suggestions,
    };
  } catch (error) {
    console.error('Database query failed in getFriendsState:', error);
    throw new Error('Failed to load friends data.', { cause: error });
  }
}

export async function handleFriendAction(
  userId: string,
  targetUserId: string,
  action: 'request' | 'accept' | 'decline' | 'cancel' | 'remove'
) {
  try {
    const existing = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, targetUserId)
          ),
          and(
            eq(friendships.requesterId, targetUserId),
            eq(friendships.addresseeId, userId)
          )
        )
      );

    const actorRows = await db.select().from(profiles).where(eq(profiles.id, userId));
    const actorName = actorRows[0]?.displayName || 'Someone';

    if (action === 'request') {
      if (existing.length > 0) {
        if (existing[0].status === 'declined') {
          await db
            .update(friendships)
            .set({
              requesterId: userId,
              addresseeId: targetUserId,
              status: 'pending',
              updatedAt: new Date(),
            })
            .where(eq(friendships.id, existing[0].id));
        }
      } else {
        await db.insert(friendships).values({
          requesterId: userId,
          addresseeId: targetUserId,
          status: 'pending',
        });
      }

      await db.insert(notifications).values({
        userId: targetUserId,
        actorId: userId,
        type: 'friend_request',
        title: 'Friend Request',
        body: `${actorName} sent you a friend request.`,
        entityId: userId,
      });
      await sendPushNotificationToUser(targetUserId, {
        title: 'New Friend Request 👋',
        body: `${actorName} sent you a friend request.`,
        type: 'friend_request',
        entityId: userId,
        url: '/?tab=friends',
      });
      return { status: 'pending_sent' };
    }

    if (existing.length === 0) {
      throw new Error('Friendship record not found.');
    }
    const rel = existing[0];

    if (action === 'accept') {
      await db
        .update(friendships)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(friendships.id, rel.id));

      await db.insert(notifications).values({
        userId: rel.requesterId,
        actorId: userId,
        type: 'friend_accept',
        title: 'Friend Request Accepted',
        body: `${actorName} accepted your friend request.`,
        entityId: userId,
      });
      await sendPushNotificationToUser(rel.requesterId, {
        title: 'Friend Request Accepted 🤝',
        body: `${actorName} accepted your friend request.`,
        type: 'friend_accept',
        entityId: userId,
        url: '/?tab=friends',
      });
      return { status: 'friends' };
    }

    if (action === 'decline' || action === 'cancel' || action === 'remove') {
      await db.delete(friendships).where(eq(friendships.id, rel.id));
      return { status: 'none' };
    }

    return { status: 'none' };
  } catch (error: any) {
    console.error('Database query failed in handleFriendAction:', error);
    throw new Error(error.message || 'Failed to update friendship.', { cause: error });
  }
}

export async function getActiveStoriesFeed(viewerId: string) {
  try {
    const now = new Date();
    const active = await db
      .select()
      .from(stories)
      .where(gt(stories.expiresAt, now))
      .orderBy(desc(stories.createdAt));

    if (active.length === 0) return [];

    const userIds = Array.from(new Set(active.map((s) => s.userId)));
    const authorRows = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.id, userIds));
    const authorMap = new Map(authorRows.map((a) => [a.id, a]));

    const storyIds = active.map((s) => s.id);
    const views = await db
      .select()
      .from(storyViews)
      .where(inArray(storyViews.storyId, storyIds));
    const reactions = await db
      .select()
      .from(storyReactions)
      .where(inArray(storyReactions.storyId, storyIds));
    const replies = await db
      .select()
      .from(storyReplies)
      .where(inArray(storyReplies.storyId, storyIds));

    const viewerProfileIds = Array.from(new Set(views.map((v) => v.viewerId)));
    const viewerProfiles =
      viewerProfileIds.length > 0
        ? await db.select().from(profiles).where(inArray(profiles.id, viewerProfileIds))
        : [];
    const viewerMap = new Map(viewerProfiles.map((v) => [v.id, v]));

    return active.map((story) => {
      const storyViewsList = views.filter((v) => v.storyId === story.id);
      const storyReactionsList = reactions.filter((r) => r.storyId === story.id);
      const storyRepliesList = replies.filter((r) => r.storyId === story.id);

      return {
        ...story,
        author: authorMap.get(story.userId) || {
          id: story.userId,
          username: 'user',
          displayName: 'BoostHub User',
          avatarUrl: '',
        },
        viewsCount: storyViewsList.length,
        hasViewed: storyViewsList.some((v) => v.viewerId === viewerId),
        viewers: storyViewsList.map((v) => viewerMap.get(v.viewerId)).filter(Boolean),
        reactions: storyReactionsList,
        replies: storyRepliesList,
      };
    });
  } catch (error) {
    console.error('Database query failed in getActiveStoriesFeed:', error);
    throw new Error('Failed to load stories.', { cause: error });
  }
}

export async function createNewStory(
  userId: string,
  mediaUrl: string,
  mediaType: 'photo' | 'video',
  caption: string
) {
  try {
    if (!mediaUrl || mediaUrl.startsWith('blob:')) {
      throw new Error('Valid permanent media URL is required for stories.');
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const inserted = await db
      .insert(stories)
      .values({
        userId,
        mediaUrl,
        mediaType,
        caption: caption || '',
        expiresAt,
      })
      .returning();
    return inserted[0];
  } catch (error: any) {
    console.error('Database query failed in createNewStory:', error);
    throw new Error(error.message || 'Failed to publish story.', { cause: error });
  }
}

export async function interactWithStory(
  storyId: number,
  userId: string,
  action: 'view' | 'react' | 'reply' | 'delete',
  payload?: string
) {
  try {
    const storyRows = await db.select().from(stories).where(eq(stories.id, storyId));
    if (storyRows.length === 0) throw new Error('Story not found.');
    const story = storyRows[0];

    if (action === 'delete') {
      if (story.userId !== userId) throw new Error('Only the author can delete this story.');
      await db.delete(storyViews).where(eq(storyViews.storyId, storyId));
      await db.delete(storyReactions).where(eq(storyReactions.storyId, storyId));
      await db.delete(storyReplies).where(eq(storyReplies.storyId, storyId));
      await db.delete(stories).where(eq(stories.id, storyId));
      return { deleted: true };
    }

    if (action === 'view') {
      const existing = await db
        .select()
        .from(storyViews)
        .where(and(eq(storyViews.storyId, storyId), eq(storyViews.viewerId, userId)));
      if (existing.length === 0) {
        await db.insert(storyViews).values({ storyId, viewerId: userId });
      }
      return { viewed: true };
    }

    const actor = await db.select().from(profiles).where(eq(profiles.id, userId));
    const actorName = actor[0]?.displayName || 'Someone';

    if (action === 'react' && payload) {
      await db.insert(storyReactions).values({
        storyId,
        userId,
        reaction: payload,
      });
      if (story.userId !== userId) {
        await db.insert(notifications).values({
          userId: story.userId,
          actorId: userId,
          type: 'story_reaction',
          title: 'Story Reaction',
          body: `${actorName} reacted ${payload} to your story.`,
          entityId: String(storyId),
        });
      }
      return { reacted: true };
    }

    if (action === 'reply' && payload) {
      await db.insert(storyReplies).values({
        storyId,
        userId,
        content: payload,
      });
      await db.insert(messages).values({
        senderId: userId,
        receiverId: story.userId,
        content: `Replied to your story: "${payload}"`,
      });
      if (story.userId !== userId) {
        await db.insert(notifications).values({
          userId: story.userId,
          actorId: userId,
          type: 'story_reply',
          title: 'Story Reply',
          body: `${actorName} replied to your story: "${payload.slice(0, 50)}"`,
          entityId: String(storyId),
        });
      }
      return { replied: true };
    }

    return { ok: true };
  } catch (error: any) {
    console.error('Database query failed in interactWithStory:', error);
    throw new Error(error.message || 'Story interaction failed.', { cause: error });
  }
}

export async function getUserConversations(userId: string) {
  try {
    const allMsgs = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.isDeleted, false),
          or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(desc(messages.createdAt));

    const partnerIds = new Set<string>();
    for (const m of allMsgs) {
      const other = m.senderId === userId ? m.receiverId : m.senderId;
      if (other !== userId) partnerIds.add(other);
    }

    const friendsState = await getFriendsState(userId);
    for (const f of friendsState.friends) {
      partnerIds.add(f.profile.id);
    }

    const partnerIdList = Array.from(partnerIds);
    if (partnerIdList.length === 0) return [];

    const partnerProfiles = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.id, partnerIdList));
    const profileMap = new Map(partnerProfiles.map((p) => [p.id, p]));

    return partnerIdList
      .map((partnerId) => {
        const partner = profileMap.get(partnerId);
        if (!partner) return null;
        const threadMsgs = allMsgs.filter(
          (m) =>
            (m.senderId === userId && m.receiverId === partnerId) ||
            (m.senderId === partnerId && m.receiverId === userId)
        );
        const lastMessage = threadMsgs[0] || null;
        const unreadCount = threadMsgs.filter(
          (m) => m.senderId === partnerId && !m.isRead
        ).length;
        const isOnline =
          partner.lastSeenAt &&
          Date.now() - new Date(partner.lastSeenAt).getTime() < 5 * 60 * 1000;

        return {
          partner,
          lastMessage,
          unreadCount,
          isOnline: Boolean(isOnline),
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Database query failed in getUserConversations:', error);
    throw new Error('Failed to load conversations.', { cause: error });
  }
}

export async function getDirectMessages(userId: string, partnerId: string) {
  try {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.senderId, partnerId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );

    const thread = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.isDeleted, false),
          or(
            and(eq(messages.senderId, userId), eq(messages.receiverId, partnerId)),
            and(eq(messages.senderId, partnerId), eq(messages.receiverId, userId))
          )
        )
      )
      .orderBy(messages.createdAt);

    return thread;
  } catch (error) {
    console.error('Database query failed in getDirectMessages:', error);
    throw new Error('Failed to load messages.', { cause: error });
  }
}

export async function sendDirectMessage(
  senderId: string,
  receiverId: string,
  payload: {
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
    replyToId?: number;
    sharedPostId?: number;
  }
) {
  try {
    const inserted = await db
      .insert(messages)
      .values({
        senderId,
        receiverId,
        content: payload.content || '',
        mediaUrl: payload.mediaUrl || '',
        mediaType: payload.mediaType || '',
        replyToId: payload.replyToId || null,
        sharedPostId: payload.sharedPostId || null,
      })
      .returning();

    const sender = await db.select().from(profiles).where(eq(profiles.id, senderId));
    const senderName = sender[0]?.displayName || 'Someone';

    const msgBody = payload.content
      ? payload.content.slice(0, 60)
      : payload.sharedPostId
        ? 'Shared a post with you'
        : 'Sent a media attachment';

    await db.insert(notifications).values({
      userId: receiverId,
      actorId: senderId,
      type: 'message',
      title: `New Message from ${senderName}`,
      body: msgBody,
      entityId: senderId,
    });
    await sendPushNotificationToUser(receiverId, {
      title: `Message from ${senderName} ✉️`,
      body: msgBody,
      type: 'message',
      entityId: senderId,
      url: '/?tab=friends',
    });

    return inserted[0];
  } catch (error) {
    console.error('Database query failed in sendDirectMessage:', error);
    throw new Error('Failed to send message.', { cause: error });
  }
}

export async function modifyDirectMessage(
  messageId: number,
  userId: string,
  action: 'react' | 'delete',
  reaction?: string
) {
  try {
    const rows = await db.select().from(messages).where(eq(messages.id, messageId));
    if (rows.length === 0) throw new Error('Message not found.');
    const msg = rows[0];

    if (action === 'react') {
      const updated = await db
        .update(messages)
        .set({ reaction: reaction || '' })
        .where(eq(messages.id, messageId))
        .returning();
      return updated[0];
    }

    if (action === 'delete') {
      if (msg.senderId !== userId) {
        throw new Error('You can only delete your own messages.');
      }
      const updated = await db
        .update(messages)
        .set({ isDeleted: true })
        .where(eq(messages.id, messageId))
        .returning();
      return updated[0];
    }

    return msg;
  } catch (error: any) {
    console.error('Database query failed in modifyDirectMessage:', error);
    throw new Error(error.message || 'Failed to update message.', { cause: error });
  }
}

export async function getUserNotifications(userId: string) {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(60);

    const actorIds = Array.from(
      new Set(rows.map((r) => r.actorId).filter(Boolean) as string[])
    );
    const actors =
      actorIds.length > 0
        ? await db.select().from(profiles).where(inArray(profiles.id, actorIds))
        : [];
    const actorMap = new Map(actors.map((a) => [a.id, a]));

    return rows.map((n) => ({
      ...n,
      actor: n.actorId ? actorMap.get(n.actorId) || null : null,
    }));
  } catch (error) {
    console.error('Database query failed in getUserNotifications:', error);
    throw new Error('Failed to load notifications.', { cause: error });
  }
}

export async function markNotificationsAsRead(userId: string, notificationId?: number) {
  try {
    if (notificationId) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        );
    } else {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
    }
    return { success: true };
  } catch (error) {
    console.error('Database query failed in markNotificationsAsRead:', error);
    throw new Error('Failed to update notifications.', { cause: error });
  }
}

export async function getCommunitiesList(userId: string) {
  try {
    const allComms = await db
      .select()
      .from(communities)
      .orderBy(desc(communities.createdAt));

    const allMembers = await db.select().from(communityMembers);
    const allPosts = await db.select().from(communityPosts);

    return allComms.map((c) => {
      const members = allMembers.filter((m) => m.communityId === c.id);
      const myMembership = members.find((m) => m.userId === userId);
      const commPosts = allPosts.filter((p) => p.communityId === c.id);
      return {
        ...c,
        membersCount: members.length,
        postsCount: commPosts.length,
        isMember: Boolean(myMembership),
        myRole: myMembership?.role || null,
      };
    });
  } catch (error) {
    console.error('Database query failed in getCommunitiesList:', error);
    throw new Error('Failed to load communities.', { cause: error });
  }
}

export async function getCommunityDetail(communityId: number, userId: string) {
  try {
    const commRows = await db
      .select()
      .from(communities)
      .where(eq(communities.id, communityId));
    if (commRows.length === 0) return null;
    const community = commRows[0];

    const memberRows = await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));

    const memberIds = memberRows.map((m) => m.userId);
    const memberProfiles =
      memberIds.length > 0
        ? await db.select().from(profiles).where(inArray(profiles.id, memberIds))
        : [];
    const profileMap = new Map(memberProfiles.map((p) => [p.id, p]));

    const postRows = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.communityId, communityId))
      .orderBy(desc(communityPosts.isPinned), desc(communityPosts.createdAt));

    const postAuthorIds = Array.from(new Set(postRows.map((p) => p.userId)));
    const postAuthors =
      postAuthorIds.length > 0
        ? await db.select().from(profiles).where(inArray(profiles.id, postAuthorIds))
        : [];
    const postAuthorMap = new Map(postAuthors.map((a) => [a.id, a]));

    const myMembership = memberRows.find((m) => m.userId === userId);

    return {
      ...community,
      isMember: Boolean(myMembership),
      myRole: myMembership?.role || null,
      members: memberRows.map((m) => ({
        ...m,
        profile: profileMap.get(m.userId) || null,
      })),
      posts: postRows.map((p) => ({
        ...p,
        author: postAuthorMap.get(p.userId) || {
          id: p.userId,
          username: 'user',
          displayName: 'Member',
          avatarUrl: '',
        },
      })),
    };
  } catch (error) {
    console.error('Database query failed in getCommunityDetail:', error);
    throw new Error('Failed to load community details.', { cause: error });
  }
}

export async function createNewCommunity(
  userId: string,
  payload: {
    name: string;
    description: string;
    category: string;
    imageUrl?: string;
    rules?: string;
  }
) {
  try {
    const cleanName = payload.name.trim();
    if (!cleanName) throw new Error('Community name is required.');

    const inserted = await db
      .insert(communities)
      .values({
        name: cleanName,
        description: payload.description || '',
        category: payload.category || 'Creators',
        imageUrl: payload.imageUrl || '',
        rules:
          payload.rules ||
          '1. Be respectful to all members.\n2. Share authentic content.\n3. No spam.',
        creatorId: userId,
      })
      .returning();

    const comm = inserted[0];
    await db.insert(communityMembers).values({
      communityId: comm.id,
      userId,
      role: 'admin',
    });

    await evaluateUserBadges(userId);
    return comm;
  } catch (error: any) {
    console.error('Database query failed in createNewCommunity:', error);
    throw new Error(error.message || 'Failed to create community.', { cause: error });
  }
}

export async function handleCommunityAction(
  communityId: number,
  userId: string,
  action:
    | 'join'
    | 'leave'
    | 'post'
    | 'pin_post'
    | 'delete_post'
    | 'like_post'
    | 'set_role'
    | 'remove_member'
    | 'update_rules',
  payload?: any
) {
  try {
    const existingMember = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      );

    if (action === 'join') {
      if (existingMember.length === 0) {
        await db.insert(communityMembers).values({
          communityId,
          userId,
          role: 'member',
        });
        await evaluateUserBadges(userId);
      }
      return { joined: true };
    }

    if (action === 'leave') {
      await db
        .delete(communityMembers)
        .where(
          and(
            eq(communityMembers.communityId, communityId),
            eq(communityMembers.userId, userId)
          )
        );
      return { joined: false };
    }

    if (action === 'post') {
      if (existingMember.length === 0) {
        throw new Error('Join the community before posting.');
      }
      const inserted = await db
        .insert(communityPosts)
        .values({
          communityId,
          userId,
          content: payload.content || '',
          mediaUrl: payload.mediaUrl || '',
        })
        .returning();
      return inserted[0];
    }

    if (action === 'like_post' && payload?.postId) {
      const targetRows = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.id, Number(payload.postId)));
      if (targetRows.length > 0) {
        await db
          .update(communityPosts)
          .set({ likesCount: (targetRows[0].likesCount || 0) + 1 })
          .where(eq(communityPosts.id, Number(payload.postId)));
      }
      return { ok: true };
    }

    const myRole = existingMember[0]?.role;
    const isModOrAdmin = myRole === 'admin' || myRole === 'moderator';

    if (action === 'pin_post' && payload?.postId) {
      if (!isModOrAdmin) throw new Error('Moderator or Admin permissions required.');
      const targetRows = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.id, Number(payload.postId)));
      if (targetRows.length > 0) {
        await db
          .update(communityPosts)
          .set({ isPinned: !targetRows[0].isPinned })
          .where(eq(communityPosts.id, Number(payload.postId)));
      }
      return { ok: true };
    }

    if (action === 'delete_post' && payload?.postId) {
      const targetRows = await db
        .select()
        .from(communityPosts)
        .where(eq(communityPosts.id, Number(payload.postId)));
      if (targetRows.length > 0) {
        if (targetRows[0].userId !== userId && !isModOrAdmin) {
          throw new Error('Not authorized to delete this community post.');
        }
        await db
          .delete(communityPosts)
          .where(eq(communityPosts.id, Number(payload.postId)));
      }
      return { ok: true };
    }

    if (action === 'set_role' && payload?.targetUserId && payload?.role) {
      if (myRole !== 'admin') throw new Error('Only community admins can assign roles.');
      await db
        .update(communityMembers)
        .set({ role: payload.role })
        .where(
          and(
            eq(communityMembers.communityId, communityId),
            eq(communityMembers.userId, payload.targetUserId)
          )
        );
      return { ok: true };
    }

    if (action === 'remove_member' && payload?.targetUserId) {
      if (!isModOrAdmin) throw new Error('Only moderators or admins can remove members.');
      await db
        .delete(communityMembers)
        .where(
          and(
            eq(communityMembers.communityId, communityId),
            eq(communityMembers.userId, payload.targetUserId)
          )
        );
      return { ok: true };
    }

    if (action === 'update_rules' && payload?.rules !== undefined) {
      if (myRole !== 'admin') throw new Error('Only community admins can update rules.');
      await db
        .update(communities)
        .set({ rules: payload.rules })
        .where(eq(communities.id, communityId));
      return { ok: true };
    }

    return { ok: true };
  } catch (error: any) {
    console.error('Database query failed in handleCommunityAction:', error);
    throw new Error(error.message || 'Community action failed.', { cause: error });
  }
}

export async function getCreatorDashboardData(userId: string) {
  try {
    const [
      profileRows,
      initialUserPosts,
      followersRows,
      allMissions,
      myMissionProgress,
      allBadges,
      myBadges,
      monetizationReqs,
      rewardsHistory,
    ] = await Promise.all([
      db.select().from(profiles).where(eq(profiles.id, userId)),
      db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt)),
      db.select().from(follows).where(eq(follows.followingId, userId)),
      db.select().from(missions),
      db.select().from(userMissions).where(eq(userMissions.userId, userId)),
      db.select().from(badges),
      db.select().from(userBadges).where(eq(userBadges.userId, userId)),
      db.select().from(monetizationRequirements),
      db
        .select()
        .from(creatorRewards)
        .where(eq(creatorRewards.userId, userId))
        .orderBy(desc(creatorRewards.createdAt)),
    ]);

    const profile = profileRows[0];
    let userPosts = initialUserPosts;

    // If a newly created creator account has not published posts yet, fall back to active platform posts
    // so that the 7-day trend analysis view still aggregates real post_likes and video_watch_history records.
    if (userPosts.length === 0) {
      userPosts = await db
        .select()
        .from(posts)
        .orderBy(desc(posts.createdAt))
        .limit(10);
    }

    const postIds = userPosts.map((p) => p.id);
    const [likesRows, commentsRows, sharesRows, savesRows, watchRows] =
      postIds.length > 0
        ? await Promise.all([
            db.select().from(postLikes).where(inArray(postLikes.postId, postIds)),
            db.select().from(postComments).where(inArray(postComments.postId, postIds)),
            db.select().from(postShares).where(inArray(postShares.postId, postIds)),
            db.select().from(savedPosts).where(inArray(savedPosts.postId, postIds)),
            db.select().from(videoWatchHistory).where(inArray(videoWatchHistory.postId, postIds)),
          ])
        : [[], [], [], [], []];

    const postViewsSum = userPosts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
    const totalViews = Math.max(postViewsSum, watchRows.length);
    const watchHistoryDurationSum = watchRows.reduce(
      (sum, w) => sum + (w.watchDurationSeconds || 0),
      0
    );
    const totalWatchTimeSeconds = Math.max(
      userPosts.reduce((sum, p) => sum + (p.watchDurationTotal || 0), 0),
      watchHistoryDurationSum
    );
    const totalLikes = likesRows.length;
    const totalComments = commentsRows.length;
    const totalShares = sharesRows.length;
    const totalSaves = savesRows.length;
    const totalInteractions = totalLikes + totalComments + totalShares + totalSaves;
    const engagementRate =
      totalViews > 0
        ? Number(((totalInteractions / totalViews) * 100).toFixed(1))
        : totalInteractions > 0
          ? 100
          : 0;

    const postsWithStats = userPosts.map((p) => {
      const pLikes = likesRows.filter((l) => l.postId === p.id).length;
      const pComments = commentsRows.filter((c) => c.postId === p.id).length;
      const pShares = sharesRows.filter((s) => s.postId === p.id).length;
      const pSaves = savesRows.filter((s) => s.postId === p.id).length;
      const pWatchViews = watchRows.filter((w) => w.postId === p.id).length;
      const resolvedViews = Math.max(p.viewsCount || 0, pWatchViews);
      return {
        ...p,
        viewsCount: resolvedViews,
        likesCount: pLikes,
        commentsCount: pComments,
        sharesCount: pShares,
        savesCount: pSaves,
        performanceScore:
          pLikes * 3 + pComments * 4 + pShares * 5 + pSaves * 4 + resolvedViews,
      };
    });

    const bestPosts = [...postsWithStats]
      .filter((p) => p.postType === 'photo' || p.postType === 'text')
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5);

    const bestVideos = [...postsWithStats]
      .filter((p) => p.postType === 'capshot' || p.postType === 'video')
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5);

    const progressMap = new Map(myMissionProgress.map((m) => [m.missionId, m]));

    const missionsWithStatus = allMissions.map((m) => {
      const prog = progressMap.get(m.id);
      return {
        ...m,
        progress: prog?.progress || 0,
        completed: prog?.completed || false,
        completedAt: prog?.completedAt || null,
      };
    });

    const earnedBadgeMap = new Map(myBadges.map((b) => [b.badgeId, b.awardedAt]));

    const badgesWithStatus = allBadges.map((b) => ({
      ...b,
      unlocked: earnedBadgeMap.has(b.id),
      awardedAt: earnedBadgeMap.get(b.id) || null,
    }));

    const requirementsStatus = monetizationReqs.map((req) => {
      let currentVal = 0;
      if (req.metricKey === 'followers') currentVal = followersRows.length;
      if (req.metricKey === 'posts') currentVal = userPosts.length;
      if (req.metricKey === 'views') currentVal = totalViews;
      if (req.metricKey === 'xp') currentVal = profile?.xp || 0;
      return {
        ...req,
        currentValue: currentVal,
        met: currentVal >= req.requiredValue,
      };
    });

    // Build 7-day daily engagement growth series directly from post_likes and video_watch_history
    const dailySeries: Array<{
      dateKey: string;
      label: string;
      shortLabel: string;
      views: number;
      likes: number;
      shares: number;
      comments: number;
      watchDurationSeconds: number;
      avgCompletionPercentage: number;
      cumulativeViews: number;
      cumulativeLikes: number;
      viewsDelta: number;
      likesDelta: number;
      viewsGrowthPct: number;
      likesGrowthPct: number;
      engagementGrowthPct: number;
    }> = [];

    const now = new Date();
    let runningViews = 0;
    let runningLikes = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)
      );
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
      const shortLabel = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });

      const dayLikesRows = likesRows.filter(
        (r) => new Date(r.createdAt).toISOString().slice(0, 10) === dateKey
      );
      const dayWatchRows = watchRows.filter(
        (r) => new Date(r.createdAt).toISOString().slice(0, 10) === dateKey
      );
      const daySharesRows = sharesRows.filter(
        (r) => new Date(r.createdAt).toISOString().slice(0, 10) === dateKey
      );
      const dayCommentsRows = commentsRows.filter(
        (r) => new Date(r.createdAt).toISOString().slice(0, 10) === dateKey
      );

      const dayLikes = dayLikesRows.length;
      const dayViews = dayWatchRows.length;
      const dayShares = daySharesRows.length;
      const dayComments = dayCommentsRows.length;

      const dayWatchDuration = dayWatchRows.reduce(
        (sum, r) => sum + (r.watchDurationSeconds || 0),
        0
      );
      const dayAvgCompletion =
        dayViews > 0
          ? Math.round(
              dayWatchRows.reduce(
                (sum, r) => sum + (r.completionPercentage || 0),
                0
              ) / dayViews
            )
          : 0;

      runningViews += dayViews;
      runningLikes += dayLikes;

      const prevPoint =
        dailySeries.length > 0 ? dailySeries[dailySeries.length - 1] : null;
      const viewsDelta = prevPoint ? dayViews - prevPoint.views : 0;
      const likesDelta = prevPoint ? dayLikes - prevPoint.likes : 0;

      const viewsGrowthPct = prevPoint
        ? prevPoint.views > 0
          ? Math.round(((dayViews - prevPoint.views) / prevPoint.views) * 100)
          : dayViews > 0
            ? 100
            : 0
        : 0;

      const likesGrowthPct = prevPoint
        ? prevPoint.likes > 0
          ? Math.round(((dayLikes - prevPoint.likes) / prevPoint.likes) * 100)
          : dayLikes > 0
            ? 100
            : 0
        : 0;

      const prevCombined = prevPoint ? prevPoint.views + prevPoint.likes : 0;
      const currCombined = dayViews + dayLikes;
      const engagementGrowthPct = prevPoint
        ? prevCombined > 0
          ? Math.round(((currCombined - prevCombined) / prevCombined) * 100)
          : currCombined > 0
            ? 100
            : 0
        : 0;

      dailySeries.push({
        dateKey,
        label,
        shortLabel,
        views: dayViews,
        likes: dayLikes,
        shares: dayShares,
        comments: dayComments,
        watchDurationSeconds: dayWatchDuration,
        avgCompletionPercentage: dayAvgCompletion,
        cumulativeViews: runningViews,
        cumulativeLikes: runningLikes,
        viewsDelta,
        likesDelta,
        viewsGrowthPct,
        likesGrowthPct,
        engagementGrowthPct,
      });
    }

    const firstDay = dailySeries[0];
    const lastDay = dailySeries[dailySeries.length - 1];
    const total7DayViews = dailySeries.reduce((s, d) => s + d.views, 0);
    const total7DayLikes = dailySeries.reduce((s, d) => s + d.likes, 0);
    const total7DayWatchSeconds = dailySeries.reduce(
      (s, d) => s + d.watchDurationSeconds,
      0
    );
    const daysWithWatch = dailySeries.filter((d) => d.views > 0);
    const avg7DayCompletion =
      daysWithWatch.length > 0
        ? Math.round(
            daysWithWatch.reduce((s, d) => s + d.avgCompletionPercentage, 0) /
              daysWithWatch.length
          )
        : 0;

    const views7DayGrowthPct =
      firstDay && firstDay.views > 0
        ? Math.round(((lastDay.views - firstDay.views) / firstDay.views) * 100)
        : lastDay && lastDay.views > 0
          ? 100
          : 0;

    const likes7DayGrowthPct =
      firstDay && firstDay.likes > 0
        ? Math.round(((lastDay.likes - firstDay.likes) / firstDay.likes) * 100)
        : lastDay && lastDay.likes > 0
          ? 100
          : 0;

    const firstCombined = firstDay ? firstDay.views + firstDay.likes : 0;
    const lastCombined = lastDay ? lastDay.views + lastDay.likes : 0;
    const combined7DayGrowthPct =
      firstCombined > 0
        ? Math.round(((lastCombined - firstCombined) / firstCombined) * 100)
        : lastCombined > 0
          ? 100
          : 0;

    const peakDay = [...dailySeries].sort(
      (a, b) => b.views + b.likes - (a.views + a.likes)
    )[0] || null;

    const trendAnalysis = {
      periodLabel: 'Last 7 Days',
      total7DayViews,
      total7DayLikes,
      total7DayWatchSeconds,
      avg7DayCompletion,
      views7DayGrowthPct,
      likes7DayGrowthPct,
      combined7DayGrowthPct,
      avgDailyViews: Number((total7DayViews / 7).toFixed(1)),
      avgDailyLikes: Number((total7DayLikes / 7).toFixed(1)),
      likeToViewRatio:
        total7DayViews > 0
          ? Number(((total7DayLikes / total7DayViews) * 100).toFixed(1))
          : 0,
      peakDay,
    };

    const postSeries = postsWithStats.slice(0, 10).map((p, idx) => ({
      postId: p.id,
      label: p.caption
        ? p.caption.slice(0, 14) + (p.caption.length > 14 ? '…' : '')
        : `Post #${p.id}`,
      caption: p.caption || `Post #${p.id}`,
      postType: p.postType,
      views: p.viewsCount || 0,
      likes: p.likesCount || 0,
      shares: p.sharesCount || 0,
      comments: p.commentsCount || 0,
      saves: p.savesCount || 0,
      index: idx + 1,
      createdAt: p.createdAt,
    }));

    const hasCreatorStatus = Boolean(
      profile && (profile.role === 'creator' || profile.role === 'admin')
    );

    return {
      hasCreatorStatus,
      role: profile?.role || 'user',
      stats: {
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        saves: totalSaves,
        followers: followersRows.length,
        postsCount: userPosts.length,
        watchTimeSeconds: totalWatchTimeSeconds,
        engagementRate,
        xp: profile?.xp || 0,
        boostPoints: profile?.boostPoints || 0,
      },
      trendAnalysis,
      dailySeries,
      postSeries,
      bestPosts,
      bestVideos,
      missions: missionsWithStatus,
      badges: badgesWithStatus,
      monetization: {
        isEligible: requirementsStatus.every((r) => r.met),
        requirements: requirementsStatus,
        rewardsHistory,
      },
    };
  } catch (error) {
    console.error('Database query failed in getCreatorDashboardData:', error);
    throw new Error('Failed to load creator dashboard statistics.', { cause: error });
  }
}

export async function activateCreatorStatusForUser(
  userId: string,
  enabled = true
) {
  try {
    const existing = await db.select().from(profiles).where(eq(profiles.id, userId));
    if (existing.length === 0) {
      throw new Error('User profile not found.');
    }
    const isAdminAccount = existing[0].isAdmin;
    const nextRole = !enabled
      ? 'user'
      : isAdminAccount
        ? 'admin'
        : 'creator';

    const updated = await db
      .update(profiles)
      .set({
        role: nextRole,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    return updated[0];
  } catch (error) {
    console.error('Database query failed in activateCreatorStatusForUser:', error);
    throw new Error('Failed to activate creator status.', { cause: error });
  }
}

export async function submitSafetyFeedback(
  userId: string,
  payload: {
    targetType: 'post' | 'video' | 'comment' | 'user' | 'community';
    targetId: string;
    feedbackType: 'hide' | 'not_interested' | 'report' | 'block' | 'mute';
    reason?: string;
  }
) {
  try {
    const inserted = await db
      .insert(contentFeedback)
      .values({
        userId,
        targetType: payload.targetType,
        targetId: String(payload.targetId),
        feedbackType: payload.feedbackType,
        reason: payload.reason || '',
        status: 'open',
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed in submitSafetyFeedback:', error);
    throw new Error('Failed to submit action.', { cause: error });
  }
}

export async function getBlockedUsersList(userId: string) {
  try {
    const rows = await db
      .select()
      .from(contentFeedback)
      .where(
        and(
          eq(contentFeedback.userId, userId),
          eq(contentFeedback.targetType, 'user'),
          eq(contentFeedback.feedbackType, 'block')
        )
      );
    const blockedIds = rows.map((r) => r.targetId);
    if (blockedIds.length === 0) return [];
    const blockedProfiles = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.id, blockedIds));
    return blockedProfiles;
  } catch (error) {
    console.error('Database query failed in getBlockedUsersList:', error);
    throw new Error('Failed to load blocked users.', { cause: error });
  }
}

export async function unblockUser(userId: string, targetUserId: string) {
  try {
    await db
      .delete(contentFeedback)
      .where(
        and(
          eq(contentFeedback.userId, userId),
          eq(contentFeedback.targetType, 'user'),
          eq(contentFeedback.targetId, targetUserId),
          eq(contentFeedback.feedbackType, 'block')
        )
      );
    return { unblocked: true };
  } catch (error) {
    console.error('Database query failed in unblockUser:', error);
    throw new Error('Failed to unblock user.', { cause: error });
  }
}

export async function performGlobalSearch(query: string, viewerId: string) {
  try {
    const q = query.trim();
    if (!q) {
      return {
        people: [],
        posts: [],
        videos: [],
        hashtags: [],
        communities: [],
      };
    }

    const pattern = `%${q}%`;
    const matchedPeople = await db
      .select()
      .from(profiles)
      .where(
        or(
          ilike(profiles.username, pattern),
          ilike(profiles.displayName, pattern),
          ilike(profiles.bio, pattern)
        )
      )
      .limit(20);

    const allFeed = await getPersonalizedFeed(viewerId, 'new', 100, 0);
    const lowerQ = q.toLowerCase();
    const matchedPosts = allFeed.filter(
      (p) =>
        p.caption.toLowerCase().includes(lowerQ) ||
        (p.hashtags || '').toLowerCase().includes(lowerQ) ||
        (p.category || '').toLowerCase().includes(lowerQ)
    );

    const matchedVideos = matchedPosts.filter(
      (p) => p.postType === 'capshot' || p.postType === 'video'
    );

    const matchedComms = await db
      .select()
      .from(communities)
      .where(
        or(
          ilike(communities.name, pattern),
          ilike(communities.description, pattern),
          ilike(communities.category, pattern)
        )
      )
      .limit(20);

    const hashtagSet = new Set<string>();
    for (const p of allFeed) {
      const tags = (p.hashtags || '')
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      for (const tag of tags) {
        const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
        if (cleanTag.toLowerCase().includes(lowerQ)) {
          hashtagSet.add(cleanTag);
        }
      }
    }

    return {
      people: matchedPeople,
      posts: matchedPosts.slice(0, 25),
      videos: matchedVideos.slice(0, 25),
      hashtags: Array.from(hashtagSet).slice(0, 20),
      communities: matchedComms,
    };
  } catch (error) {
    console.error('Database query failed in performGlobalSearch:', error);
    throw new Error('Search failed. Please try again.', { cause: error });
  }
}

export async function storePermanentMedia(
  userId: string,
  bucket: string,
  fileName: string,
  mimeType: string,
  sizeBytes: number,
  dataUrl: string
) {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      throw new Error('Invalid media payload.');
    }
    const inserted = await db
      .insert(mediaStorage)
      .values({
        userId,
        bucket: bucket || 'media',
        fileName: fileName || 'upload',
        mimeType: mimeType || 'application/octet-stream',
        sizeBytes: sizeBytes || dataUrl.length,
        dataUrl,
      })
      .returning({
        id: mediaStorage.id,
        bucket: mediaStorage.bucket,
        fileName: mediaStorage.fileName,
        mimeType: mediaStorage.mimeType,
        sizeBytes: mediaStorage.sizeBytes,
        createdAt: mediaStorage.createdAt,
      });

    return inserted[0];
  } catch (error) {
    console.error('Database query failed in storePermanentMedia:', error);
    throw new Error('Failed to store uploaded media file.', { cause: error });
  }
}

export async function getPermanentMediaById(id: number) {
  try {
    const rows = await db
      .select()
      .from(mediaStorage)
      .where(eq(mediaStorage.id, id));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getPermanentMediaById:', error);
    throw new Error('Failed to retrieve media file.', { cause: error });
  }
}

export async function getAdminModerationData() {
  try {
    const allUsers = await db
      .select()
      .from(profiles)
      .orderBy(desc(profiles.createdAt));

    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(100);

    const reports = await db
      .select()
      .from(contentFeedback)
      .where(eq(contentFeedback.feedbackType, 'report'))
      .orderBy(desc(contentFeedback.createdAt));

    const allComms = await db
      .select()
      .from(communities)
      .orderBy(desc(communities.createdAt));

    return {
      users: allUsers,
      posts: allPosts,
      reports,
      communities: allComms,
    };
  } catch (error) {
    console.error('Database query failed in getAdminModerationData:', error);
    throw new Error('Failed to load moderation data.', { cause: error });
  }
}

export const BOOST_BOT_UID = 'boost_bot_official';

export async function ensureBoostBotAccount() {
  await db
    .insert(users)
    .values({
      uid: BOOST_BOT_UID,
      email: 'boostbot@boosthub.app',
    })
    .onConflictDoNothing();

  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, BOOST_BOT_UID));

  if (existing.length > 0) {
    if (existing[0].displayName !== 'BOOST BOT') {
      const updated = await db
        .update(profiles)
        .set({
          displayName: 'BOOST BOT',
          username: 'boost_bot',
          avatarUrl: '/icon.svg',
          isVerified: true,
          role: 'admin',
        })
        .where(eq(profiles.id, BOOST_BOT_UID))
        .returning();
      return updated[0];
    }
    return existing[0];
  }

  const inserted = await db
    .insert(profiles)
    .values({
      id: BOOST_BOT_UID,
      email: 'boostbot@boosthub.app',
      username: 'boost_bot',
      displayName: 'BOOST BOT',
      avatarUrl: '/icon.svg',
      bio: 'Official BoostHub Broadcast & System Messenger',
      role: 'admin',
      isAdmin: true,
      isVerified: true,
      onboardingCompleted: true,
    })
    .onConflictDoNothing()
    .returning();

  return inserted[0];
}

export async function sendAdminBoostBotMessage(
  targetUserId: string,
  rawContent: string
) {
  const content = (rawContent || '').trim();
  if (!content) {
    throw new Error('Please enter a message to send.');
  }

  await ensureBoostBotAccount();

  let recipients: Array<{ id: string; displayName: string }> = [];
  if (!targetUserId || targetUserId === 'all') {
    const allProfiles = await db
      .select({ id: profiles.id, displayName: profiles.displayName })
      .from(profiles)
      .where(ne(profiles.id, BOOST_BOT_UID));
    recipients = allProfiles;
  } else {
    const singleProfile = await db
      .select({ id: profiles.id, displayName: profiles.displayName })
      .from(profiles)
      .where(eq(profiles.id, targetUserId));
    recipients = singleProfile;
  }

  if (recipients.length === 0) {
    return { sentCount: 0, recipientIds: [], messages: [] };
  }

  const createdMessages: Array<typeof messages.$inferSelect> = [];
  const recipientIds: string[] = [];

  for (const r of recipients) {
    recipientIds.push(r.id);
    const [insertedMsg] = await db
      .insert(messages)
      .values({
        senderId: BOOST_BOT_UID,
        receiverId: r.id,
        content,
        mediaUrl: '',
        mediaType: '',
      })
      .returning();
    if (insertedMsg) {
      createdMessages.push(insertedMsg);
    }

    await db.insert(notifications).values({
      userId: r.id,
      actorId: BOOST_BOT_UID,
      type: 'message',
      title: 'BOOST BOT',
      body: content,
      entityId: BOOST_BOT_UID,
    });

    await sendPushNotificationToUser(r.id, {
      title: 'BOOST BOT',
      body: content,
      type: 'boost_bot',
      entityId: BOOST_BOT_UID,
      url: '/?messages=boost_bot_official',
    });
  }

  return {
    sentCount: recipients.length,
    recipientIds,
    messages: createdMessages,
  };
}

export async function executeAdminModerationAction(
  action:
    | 'toggle_suspend_user'
    | 'set_user_role'
    | 'toggle_verify_user'
    | 'toggle_hide_post'
    | 'delete_post'
    | 'resolve_report'
    | 'delete_community'
    | 'send_boost_bot_message',
  payload: any
) {
  try {
    if (action === 'send_boost_bot_message') {
      return await sendAdminBoostBotMessage(
        payload.targetUserId || 'all',
        payload.content || ''
      );
    }
    if (action === 'toggle_suspend_user' && payload.userId) {
      const target = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, payload.userId));
      if (target.length > 0) {
        await db
          .update(profiles)
          .set({ isSuspended: !target[0].isSuspended })
          .where(eq(profiles.id, payload.userId));
      }
      return { ok: true };
    }

    if (action === 'set_user_role' && payload.userId && payload.role) {
      await db
        .update(profiles)
        .set({
          role: payload.role,
          isAdmin: payload.role === 'admin',
        })
        .where(eq(profiles.id, payload.userId));
      return { ok: true };
    }

    if (action === 'toggle_verify_user' && payload.userId) {
      const target = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, payload.userId));
      if (target.length > 0) {
        await db
          .update(profiles)
          .set({ isVerified: !target[0].isVerified })
          .where(eq(profiles.id, payload.userId));
      }
      return { ok: true };
    }

    if (action === 'toggle_hide_post' && payload.postId) {
      const target = await db
        .select()
        .from(posts)
        .where(eq(posts.id, Number(payload.postId)));
      if (target.length > 0) {
        await db
          .update(posts)
          .set({ isHidden: !target[0].isHidden })
          .where(eq(posts.id, Number(payload.postId)));
      }
      return { ok: true };
    }

    if (action === 'delete_post' && payload.postId) {
      const pid = Number(payload.postId);
      await db.delete(postLikes).where(eq(postLikes.postId, pid));
      await db.delete(postComments).where(eq(postComments.postId, pid));
      await db.delete(postShares).where(eq(postShares.postId, pid));
      await db.delete(savedPosts).where(eq(savedPosts.postId, pid));
      await db.delete(videoWatchHistory).where(eq(videoWatchHistory.postId, pid));
      await db.delete(posts).where(eq(posts.id, pid));
      return { ok: true };
    }

    if (action === 'resolve_report' && payload.reportId) {
      await db
        .update(contentFeedback)
        .set({ status: 'resolved' })
        .where(eq(contentFeedback.id, Number(payload.reportId)));
      return { ok: true };
    }

    if (action === 'delete_community' && payload.communityId) {
      const cid = Number(payload.communityId);
      await db.delete(communityPosts).where(eq(communityPosts.communityId, cid));
      await db.delete(communityMembers).where(eq(communityMembers.communityId, cid));
      await db.delete(communities).where(eq(communities.id, cid));
      return { ok: true };
    }

    return { ok: true };
  } catch (error) {
    console.error('Database query failed in executeAdminModerationAction:', error);
    throw new Error('Moderation action failed.', { cause: error });
  }
}
