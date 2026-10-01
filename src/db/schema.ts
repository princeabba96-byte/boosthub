import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Matches users.uid
  email: text('email').notNull(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url').default(''),
  bio: text('bio').default(''),
  role: text('role').default('user').notNull(), // 'user' | 'creator' | 'moderator' | 'admin'
  isAdmin: boolean('is_admin').default(false).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  joinReason: text('join_reason').default(''),
  wantToWatch: text('want_to_watch').default(''),
  wantToCreate: text('want_to_create').default(''),
  xp: integer('xp').default(0).notNull(),
  boostPoints: integer('boost_points').default(0).notNull(),
  giftPrivacy: text('gift_privacy').default('public').notNull(), // 'public' | 'showcase_only' | 'private'
  showcaseGifts: text('showcase_gifts').default('').notNull(),
  equippedFrame: text('equipped_frame').default('').notNull(),
  equippedBadge: text('equipped_badge').default('').notNull(),
  equippedNameStyle: text('equipped_name_style').default('').notNull(),
  giftsReceivedCount: integer('gifts_received_count').default(0).notNull(),
  giftRecognitionScore: integer('gift_recognition_score').default(0).notNull(),
  whoCanMessage: text('who_can_message').default('everyone').notNull(), // 'everyone' | 'friends' | 'nobody'
  commentControl: text('comment_control').default('everyone').notNull(), // 'everyone' | 'followers' | 'nobody'
  isPrivate: boolean('is_private').default(false).notNull(),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  isSuspended: boolean('is_suspended').default(false).notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userInterests = pgTable('user_interests', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  category: text('category').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  postType: text('post_type').default('text').notNull(), // 'photo' | 'video' | 'text' | 'capshot'
  caption: text('caption').default('').notNull(),
  mediaUrl: text('media_url').default(''),
  thumbnailUrl: text('thumbnail_url').default(''),
  hashtags: text('hashtags').default(''), // comma-separated hashtags
  category: text('category').default('Lifestyle'),
  linkUrl: text('link_url').default(''),
  viewsCount: integer('views_count').default(0).notNull(),
  watchDurationTotal: integer('watch_duration_total').default(0).notNull(),
  completionRateSum: integer('completion_rate_sum').default(0).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const postLikes = pgTable('post_likes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => posts.id)
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const postComments = pgTable('post_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => posts.id)
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  parentId: integer('parent_id'),
  content: text('content').notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  reactionsCount: integer('reactions_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postShares = pgTable('post_shares', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => posts.id)
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  shareType: text('share_type').default('link').notNull(), // 'link' | 'message' | 'story' | 'external'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const savedPosts = pgTable('saved_posts', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => posts.id)
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const follows = pgTable('follows', {
  id: serial('id').primaryKey(),
  followerId: text('follower_id')
    .references(() => profiles.id)
    .notNull(),
  followingId: text('following_id')
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const friendships = pgTable('friendships', {
  id: serial('id').primaryKey(),
  requesterId: text('requester_id')
    .references(() => profiles.id)
    .notNull(),
  addresseeId: text('addressee_id')
    .references(() => profiles.id)
    .notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'accepted' | 'declined'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const stories = pgTable('stories', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  mediaUrl: text('media_url').notNull(),
  mediaType: text('media_type').default('photo').notNull(), // 'photo' | 'video'
  caption: text('caption').default(''),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const storyViews = pgTable('story_views', {
  id: serial('id').primaryKey(),
  storyId: integer('story_id')
    .references(() => stories.id)
    .notNull(),
  viewerId: text('viewer_id')
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const storyReactions = pgTable('story_reactions', {
  id: serial('id').primaryKey(),
  storyId: integer('story_id')
    .references(() => stories.id)
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  reaction: text('reaction').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const storyReplies = pgTable('story_replies', {
  id: serial('id').primaryKey(),
  storyId: integer('story_id')
    .references(() => stories.id)
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: text('sender_id')
    .references(() => profiles.id)
    .notNull(),
  receiverId: text('receiver_id')
    .references(() => profiles.id)
    .notNull(),
  content: text('content').default('').notNull(),
  mediaUrl: text('media_url').default(''),
  mediaType: text('media_type').default(''), // '' | 'photo' | 'video'
  replyToId: integer('reply_to_id'),
  sharedPostId: integer('shared_post_id'),
  reaction: text('reaction').default(''),
  isRead: boolean('is_read').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  actorId: text('actor_id').references(() => profiles.id),
  type: text('type').notNull(), // 'like' | 'comment' | 'reply' | 'follow' | 'friend_request' | 'friend_accept' | 'share' | 'message' | 'story_reaction' | 'story_reply' | 'mission' | 'badge' | 'community'
  title: text('title').notNull(),
  body: text('body').notNull(),
  entityId: text('entity_id').default(''),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communities = pgTable('communities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').default('').notNull(),
  imageUrl: text('image_url').default(''),
  rules: text('rules').default('1. Be respectful to all members.\n2. Share authentic content.\n3. No spam or self-promotion without context.'),
  category: text('category').default('Creators').notNull(),
  creatorId: text('creator_id')
    .references(() => profiles.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communityMembers = pgTable('community_members', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id')
    .references(() => communities.id)
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  role: text('role').default('member').notNull(), // 'admin' | 'moderator' | 'member'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communityPosts = pgTable('community_posts', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id')
    .references(() => communities.id)
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  content: text('content').notNull(),
  mediaUrl: text('media_url').default(''),
  isPinned: boolean('is_pinned').default(false).notNull(),
  likesCount: integer('likes_count').default(0).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const videoWatchHistory = pgTable('video_watch_history', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => posts.id)
    .notNull(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  watchDurationSeconds: integer('watch_duration_seconds').default(0).notNull(),
  completionPercentage: integer('completion_percentage').default(0).notNull(),
  skipped: boolean('skipped').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const missions = pgTable('missions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  missionType: text('mission_type').default('daily').notNull(), // 'daily' | 'weekly'
  targetAction: text('target_action').notNull(), // 'like' | 'comment' | 'watch_capshot' | 'follow' | 'create_post' | 'share'
  targetCount: integer('target_count').notNull(),
  xpReward: integer('xp_reward').notNull(),
  boostPointsReward: integer('boost_points_reward').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userMissions = pgTable('user_missions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  missionId: integer('mission_id')
    .references(() => missions.id)
    .notNull(),
  progress: integer('progress').default(0).notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const badges = pgTable('badges', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  iconName: text('icon_name').default('Award').notNull(),
  requirementType: text('requirement_type').notNull(), // 'posts' | 'likes_received' | 'xp' | 'follows' | 'communities' | 'missions'
  requirementCount: integer('requirement_count').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userBadges = pgTable('user_badges', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  badgeId: integer('badge_id')
    .references(() => badges.id)
    .notNull(),
  awardedAt: timestamp('awarded_at').defaultNow().notNull(),
});

export const monetizationRequirements = pgTable('monetization_requirements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  metricKey: text('metric_key').notNull(), // 'followers' | 'views' | 'posts' | 'xp'
  requiredValue: integer('required_value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const creatorRewards = pgTable('creator_rewards', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  rewardType: text('reward_type').notNull(),
  title: text('title').notNull(),
  pointsEarned: integer('points_earned').default(0).notNull(),
  status: text('status').default('unlocked').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contentFeedback = pgTable('content_feedback', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  targetType: text('target_type').notNull(), // 'post' | 'video' | 'comment' | 'user' | 'community'
  targetId: text('target_id').notNull(),
  feedbackType: text('feedback_type').notNull(), // 'hide' | 'not_interested' | 'report' | 'block' | 'mute'
  reason: text('reason').default(''),
  status: text('status').default('open').notNull(), // 'open' | 'reviewed' | 'resolved'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mediaStorage = pgTable('media_storage', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  bucket: text('bucket').default('media').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').default(0).notNull(),
  dataUrl: text('data_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userShopInventory = pgTable('user_shop_inventory', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id)
    .notNull(),
  itemCode: text('item_code').notNull(),
  category: text('category').default('gift').notNull(), // 'gift' | 'frame' | 'badge' | 'name_style'
  quantity: integer('quantity').default(1).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const giftTransactions = pgTable('gift_transactions', {
  id: serial('id').primaryKey(),
  senderId: text('sender_id')
    .references(() => profiles.id)
    .notNull(),
  receiverId: text('receiver_id')
    .references(() => profiles.id)
    .notNull(),
  itemCode: text('item_code').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  bpSpent: integer('bp_spent').default(0).notNull(),
  recognitionEarned: integer('recognition_earned').default(0).notNull(),
  message: text('message').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  posts: many(posts),
  interests: many(userInterests),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(profiles, {
    fields: [posts.userId],
    references: [profiles.id],
  }),
  likes: many(postLikes),
  comments: many(postComments),
}));
