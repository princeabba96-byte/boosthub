export const INTEREST_CATEGORIES = [
  'Music',
  'Football',
  'Gaming',
  'Comedy',
  'Fashion',
  'Beauty',
  'Technology',
  'Business',
  'Education',
  'Fitness',
  'Movies',
  'Anime',
  'Travel',
  'Food',
  'Cars',
  'Art',
  'Sports',
  'News',
  'Lifestyle',
  'Creators',
] as const;

export type MainTab =
  | 'home'
  | 'capshots'
  | 'friends'
  | 'bshop'
  | 'create'
  | 'bedit'
  | 'notifications'
  | 'menu'
  | 'me';

export interface GiftCollectionCardItem {
  code: string;
  name: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  costBp: number;
  receivedCount: number;
  ownedInInventoryCount: number;
  mostRecentSender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  } | null;
  lastReceivedAt: string | null;
}

export interface GiftActivityEntry {
  id: number;
  direction: 'received' | 'sent';
  itemCode: string;
  itemName: string;
  itemIcon: string;
  itemRarity: string;
  quantity: number;
  bpSpent: number;
  recognitionEarned: number;
  message: string;
  createdAt: string;
  counterparty: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
}

export interface BShopUserState {
  boostPoints: number;
  balance?: number;
  xp: number;
  giftPrivacy: 'public' | 'showcase_only' | 'private';
  showcaseGifts: string[];
  equippedFrame: string;
  equippedBadge: string;
  equippedNameStyle: string;
  giftsReceivedCount: number;
  giftRecognitionScore: number;
  inventory: Array<{
    itemCode: string;
    category: string;
    quantity: number;
  }>;
  giftCollection: GiftCollectionCardItem[];
  giftActivity: GiftActivityEntry[];
}

export interface UserBadge {
  id: number;
  code: string;
  name: string;
  description: string;
  iconName: string;
  awardedAt?: string | null;
  unlocked?: boolean;
  requirementType?: string;
  requirementCount?: number;
}

export type NotificationBatchFrequency =
  | 'instant'
  | 'short_1m'
  | 'standard_5m'
  | 'digest_15m';

export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  follows: boolean;
  messages: boolean;
  friendRequests: boolean;
  gifts: boolean;
  boostBot: boolean;
  batchingEnabled: boolean;
  batchFrequency: NotificationBatchFrequency;
  batchWindowSeconds: number;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  likes: true,
  comments: true,
  mentions: true,
  follows: true,
  messages: true,
  friendRequests: true,
  gifts: true,
  boostBot: true,
  batchingEnabled: true,
  batchFrequency: 'short_1m',
  batchWindowSeconds: 60,
};

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  role: 'user' | 'creator' | 'moderator' | 'admin';
  isAdmin: boolean;
  isVerified: boolean;
  professionalMode?: boolean;
  monetizationEligible?: boolean;
  onboardingCompleted: boolean;
  joinReason: string;
  wantToWatch: string;
  wantToCreate: string;
  xp: number;
  boostPoints: number;
  balance?: number;
  giftPrivacy?: 'public' | 'showcase_only' | 'private';
  showcaseGifts?: string;
  equippedFrame?: string;
  equippedBadge?: string;
  equippedNameStyle?: string;
  giftsReceivedCount?: number;
  giftRecognitionScore?: number;
  publicGiftCollection?: Array<{
    code: string;
    name: string;
    icon: string;
    rarity: string;
    count: number;
  }>;
  whoCanMessage: 'everyone' | 'friends' | 'nobody';
  commentControl: 'everyone' | 'followers' | 'nobody';
  isPrivate: boolean;
  notificationsEnabled: boolean;
  notificationPreferences?: NotificationPreferences;
  isSuspended?: boolean;
  interests?: string[];
  followersCount?: number;
  followingCount?: number;
  friendsCount?: number;
  likesReceivedCount?: number;
  sharesReceivedCount?: number;
  viewsReceivedCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  friendshipStatus?: 'none' | 'friends' | 'pending_sent' | 'pending_received';
  friendshipId?: any;
  badges?: UserBadge[];
  createdAt?: string;
}

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  role?: string;
}

export interface PostItem {
  id: any;
  userId: string;
  postType: 'photo' | 'video' | 'text' | 'capshot';
  caption: string;
  mediaUrl: string;
  thumbnailUrl: string;
  hashtags: string;
  category: string;
  linkUrl: string;
  viewsCount: number;
  watchDurationTotal: number;
  completionRateSum: number;
  createdAt: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isFollowingAuthor: boolean;
  recentComments?: CommentItem[];
}

export interface CommentItem {
  id: any;
  postId: any;
  userId: string;
  parentId: any;
  content: string;
  isPinned: boolean;
  reactionsCount: number;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
}

export interface StoryItem {
  id: any;
  userId: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption: string;
  expiresAt: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  viewsCount: number;
  hasViewed: boolean;
  viewers: UserProfile[];
  reactions: Array<{ id: any; userId: string; reaction: string }>;
  replies: Array<{ id: any; userId: string; content: string; createdAt: string }>;
}

export interface DirectMessageItem {
  id: any;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl: string;
  mediaType: string;
  replyToId: any;
  sharedPostId: any;
  reaction: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  partner: UserProfile;
  lastMessage: DirectMessageItem | null;
  unreadCount: number;
  isOnline: boolean;
}

export interface NotificationItem {
  id: any;
  userId: string;
  actorId: string | null;
  type: string;
  title: string;
  body: string;
  entityId: string;
  isRead: boolean;
  createdAt: string;
  actor?: UserProfile | null;
}

export interface CommunityItem {
  id: any;
  name: string;
  description: string;
  imageUrl: string;
  rules: string;
  category: string;
  creatorId: string;
  createdAt: string;
  membersCount?: number;
  postsCount?: number;
  isMember?: boolean;
  myRole?: 'admin' | 'moderator' | 'member' | null;
}

export interface MissionItem {
  id: any;
  code: string;
  title: string;
  description: string;
  missionType: 'daily' | 'weekly';
  targetAction: string;
  targetCount: number;
  xpReward: number;
  boostPointsReward: number;
  progress: number;
  completed: boolean;
  claimed?: boolean;
  completedAt: string | null;
}
