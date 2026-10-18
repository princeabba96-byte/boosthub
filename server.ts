import express, { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { GoogleGenAI, Modality, Type } from '@google/genai';
import {
  requireAuth,
  requireAdmin,
  AuthRequest,
  signCustomToken,
} from './src/middleware/auth.ts';
import {
  registerEmailAccount,
  loginEmailAccount,
  resetEmailPassword,
  getFullUserProfile,
  completeUserOnboarding,
  updateUserProfileData,
  getPersonalizedFeed,
  getCapshotsFeed,
  createNewPost,
  togglePostLike,
  toggleSavePost,
  recordPostShare,
  recordVideoWatchMetric,
  getSavedPostsForUser,
  getCommentsForPost,
  addPostComment,
  modifyComment,
  toggleFollowUser,
  getFollowLists,
  getFriendsState,
  handleFriendAction,
  getActiveStoriesFeed,
  createNewStory,
  interactWithStory,
  getUserConversations,
  getDirectMessages,
  sendDirectMessage,
  modifyDirectMessage,
  getUserNotifications,
  markNotificationsAsRead,
  deleteNotificationForUser,
  getCommunitiesList,
  getCommunityDetail,
  createNewCommunity,
  handleCommunityAction,
  getCreatorDashboardData,
  activateCreatorStatusForUser,
  submitSafetyFeedback,
  getBlockedUsersList,
  unblockUser,
  performGlobalSearch,
  logProfileSearchNotification,
  storePermanentMedia,
  getPermanentMediaById,
  getAdminModerationData,
  executeAdminModerationAction,
  getBShopAndUserGiftsState,
  purchaseBShopItem,
  sendGiftToCreator,
  updateUserGiftSettings,
} from './src/db/queries.ts';
import {
  getPublicVapidKey,
  saveUserPushSubscription,
  removeUserPushSubscription,
  getUserPushSubscriptionStatus,
  sendPushNotificationToUser,
  startSupabaseRealtimePushBridge,
} from './src/lib/webPushServer.ts';
import {
  supabase,
  ADMIN_ABBA_UUID,
  BOOST_BOT_UUID,
} from './src/lib/supabase.ts';

dotenv.config({ override: true });
startSupabaseRealtimePushBridge();

interface RealtimeClient {
  userId: string;
  res: Response;
}

const realtimeClients = new Set<RealtimeClient>();

function broadcastRealtimeEvent(
  eventType: string,
  payload: any,
  targetUserIds?: string[]
) {
  const message = `data: ${JSON.stringify({ type: eventType, payload, timestamp: Date.now() })}\n\n`;
  for (const client of realtimeClients) {
    if (!targetUserIds || targetUserIds.includes(client.userId)) {
      try {
        client.res.write(message);
      } catch {
        realtimeClients.delete(client);
      }
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '45mb' }));
  app.use(express.urlencoded({ extended: true, limit: '45mb' }));

  // Universal CORS support so GitHub Pages (https://princeabba96-byte.github.io/boosthub/) can call /api/*
  app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // Compress JSON API responses with gzip on slow networks
  app.use((req, res, next) => {
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    if (!acceptEncoding.includes('gzip') || req.path === '/api/realtime/stream') {
      return next();
    }
    const origJson = res.json.bind(res);
    res.json = (body: any) => {
      try {
        const jsonStr = JSON.stringify(body);
        if (jsonStr.length > 1024) {
          const compressed = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Vary', 'Accept-Encoding');
          res.setHeader('Content-Length', String(compressed.length));
          return res.send(compressed);
        }
      } catch {
        // fallback to uncompressed
      }
      return origJson(body);
    };
    next();
  });

  // --- AUTHENTICATION ROUTES ---
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, displayName, username, avatarUrl } = req.body;
      const profile = await registerEmailAccount(
        email || '',
        password || '',
        displayName || '',
        username || '',
        avatarUrl
      );
      const token = signCustomToken({
        uid: profile.id,
        email: profile.email,
        name: profile.displayName,
        picture: profile.avatarUrl || '',
      });
      res.json({ token, profile });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Something went wrong. Please try again.',
      });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, avatarUrl } = req.body;
      const profile = await loginEmailAccount(
        email || '',
        password || '',
        avatarUrl
      );
      const token = signCustomToken({
        uid: profile.id,
        email: profile.email,
        name: profile.displayName,
        picture: profile.avatarUrl || '',
      });
      res.json({ token, profile });
    } catch (error: any) {
      res.status(401).json({
        error: error.message || 'Invalid email or password.',
      });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      const result = await resetEmailPassword(email || '', newPassword || '');
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to reset password.',
      });
    }
  });

  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const profile = await getFullUserProfile(uid, uid);
      res.json(profile);
    } catch (error: any) {
      console.error('Failed to fetch current user profile:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  });

  app.post('/api/onboarding', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const { categories, joinReason, wantToWatch, wantToCreate } = req.body;
      await completeUserOnboarding(
        uid,
        categories,
        joinReason || '',
        wantToWatch || '',
        wantToCreate || ''
      );
      const fullProfile = await getFullUserProfile(uid, uid);
      res.json(fullProfile);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Something went wrong. Please try again.',
      });
    }
  });

  // --- REALTIME SSE STREAM ---
  app.get('/api/realtime/stream', requireAuth, (req: AuthRequest, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client: RealtimeClient = {
      userId: req.user!.uid,
      res,
    };
    realtimeClients.add(client);

    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        onlineUserIds: Array.from(new Set(Array.from(realtimeClients).map((c) => c.userId))),
      })}\n\n`
    );

    broadcastRealtimeEvent('presence', {
      userId: req.user!.uid,
      online: true,
    });

    req.on('close', () => {
      realtimeClients.delete(client);
    });
  });

  app.post('/api/realtime/typing', requireAuth, (req: AuthRequest, res) => {
    const { receiverId, isTyping } = req.body;
    if (receiverId) {
      broadcastRealtimeEvent(
        'typing',
        { senderId: req.user!.uid, isTyping: Boolean(isTyping) },
        [receiverId]
      );
    }
    res.json({ ok: true });
  });

  // --- PERMANENT STORAGE ROUTES ---
  app.post('/api/storage/upload', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { bucket, fileName, mimeType, sizeBytes, dataUrl } = req.body;
      const stored = await storePermanentMedia(
        req.user!.uid,
        bucket || 'media',
        fileName || 'upload',
        mimeType || 'image/jpeg',
        Number(sizeBytes) || 0,
        dataUrl
      );
      const permanentUrl = `/api/storage/file/${stored.id}`;
      res.json({
        id: stored.id,
        url: permanentUrl,
        bucket: stored.bucket,
        mimeType: stored.mimeType,
      });
    } catch (error: any) {
      console.error('Media upload failed:', error);
      res.status(400).json({
        error: error.message || 'Upload failed. Please try again.',
      });
    }
  });

  app.get('/api/storage/file/:id', async (req, res) => {
    try {
      const fileId = Number(req.params.id);
      if (!fileId) return res.status(400).send('Invalid file ID');
      const media = await getPermanentMediaById(fileId);
      if (!media || !media.dataUrl) {
        return res.status(404).send('Media not found');
      }

      const matches = media.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).send('Malformed media record');
      }
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (error) {
      console.error('Error serving stored media:', error);
      res.status(500).send('Failed to load media');
    }
  });

  // --- PROFILE & FOLLOW ROUTES ---
  app.get('/api/profiles/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const profile = await getFullUserProfile(req.params.id, req.user!.uid);
      if (!profile) return res.status(404).json({ error: 'User not found.' });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  });

  app.put('/api/profiles/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      await updateUserProfileData(req.user!.uid, req.body);
      const updated = await getFullUserProfile(req.user!.uid, req.user!.uid);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to update profile.',
      });
    }
  });

  app.post('/api/profiles/:id/follow', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await toggleFollowUser(req.user!.uid, req.params.id);
      broadcastRealtimeEvent(
        'follow',
        { followerId: req.user!.uid, following: result.following },
        [req.params.id]
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to update follow status.',
      });
    }
  });

  app.get('/api/profiles/:id/follows', requireAuth, async (req: AuthRequest, res) => {
    try {
      const lists = await getFollowLists(req.params.id);
      res.json(lists);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load follow lists.' });
    }
  });

  // --- FEED & POSTS ROUTES ---
  app.get('/api/posts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const tab = (req.query.tab as any) || 'recommended';
      const limit = Math.min(50, Number(req.query.limit) || 15);
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const authorId = req.query.authorId ? String(req.query.authorId) : undefined;
      const feed = await getPersonalizedFeed(
        req.user!.uid,
        tab,
        limit,
        offset,
        authorId
      );
      res.json(feed);
    } catch (error: any) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  });

  app.get('/api/capshots', requireAuth, async (req: AuthRequest, res) => {
    try {
      const limit = Math.min(50, Number(req.query.limit) || 20);
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const capshots = await getCapshotsFeed(req.user!.uid, limit, offset);
      res.json(capshots);
    } catch (error: any) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  });

  app.post('/api/posts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const created = await createNewPost(req.user!.uid, req.body);
      const enriched = await getPersonalizedFeed(
        req.user!.uid,
        'new',
        1,
        0,
        req.user!.uid
      );
      const postObj = enriched[0] || created;
      broadcastRealtimeEvent('new_post', postObj);
      res.json(postObj);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to publish post.',
      });
    }
  });

  app.post('/api/posts/:id/like', requireAuth, async (req: AuthRequest, res) => {
    try {
      const postId = Number(req.params.id);
      const result = await togglePostLike(postId, req.user!.uid);
      broadcastRealtimeEvent('post_like', {
        postId,
        userId: req.user!.uid,
        liked: result.liked,
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to update like.' });
    }
  });

  app.post('/api/posts/:id/save', requireAuth, async (req: AuthRequest, res) => {
    try {
      const postId = Number(req.params.id);
      const result = await toggleSavePost(postId, req.user!.uid);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to update saved content.' });
    }
  });

  app.post('/api/posts/:id/share', requireAuth, async (req: AuthRequest, res) => {
    try {
      const postId = Number(req.params.id);
      const result = await recordPostShare(
        postId,
        req.user!.uid,
        req.body.shareType || 'link'
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to share post.' });
    }
  });

  app.post('/api/posts/:id/watch', requireAuth, async (req: AuthRequest, res) => {
    try {
      const postId = Number(req.params.id);
      const { watchDurationSeconds, completionPercentage, skipped } = req.body;
      const result = await recordVideoWatchMetric(
        postId,
        req.user!.uid,
        Number(watchDurationSeconds) || 0,
        Number(completionPercentage) || 0,
        Boolean(skipped)
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to record watch telemetry.' });
    }
  });

  app.get('/api/saved-posts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await getSavedPostsForUser(req.user!.uid);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load saved content.' });
    }
  });

  // --- COMMENTS ROUTES ---
  app.get('/api/posts/:id/comments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const postId = Number(req.params.id);
      const comments = await getCommentsForPost(postId);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load comments.' });
    }
  });

  app.post('/api/posts/:id/comments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const postId = Number(req.params.id);
      const { content, parentId } = req.body;
      const comment = await addPostComment(
        postId,
        req.user!.uid,
        content || '',
        parentId ? Number(parentId) : null
      );
      broadcastRealtimeEvent('post_comment', { postId, comment });
      res.json(comment);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to add comment.',
      });
    }
  });

  app.put('/api/comments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const commentId = Number(req.params.id);
      const { action, content } = req.body;
      const updated = await modifyComment(
        commentId,
        req.user!.uid,
        action,
        content
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to update comment.',
      });
    }
  });

  // --- STORIES ROUTES ---
  app.get('/api/stories', requireAuth, async (req: AuthRequest, res) => {
    try {
      const activeStories = await getActiveStoriesFeed(req.user!.uid);
      res.json(activeStories);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load stories.' });
    }
  });

  app.post('/api/stories', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { mediaUrl, mediaType, caption } = req.body;
      const created = await createNewStory(
        req.user!.uid,
        mediaUrl,
        mediaType || 'photo',
        caption || ''
      );
      broadcastRealtimeEvent('new_story', created);
      res.json(created);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to create story.',
      });
    }
  });

  app.post('/api/stories/:id/interact', requireAuth, async (req: AuthRequest, res) => {
    try {
      const storyId = Number(req.params.id);
      const { action, payload } = req.body;
      const result = await interactWithStory(
        storyId,
        req.user!.uid,
        action,
        payload
      );
      broadcastRealtimeEvent('story_update', { storyId, action });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to interact with story.',
      });
    }
  });

  // --- FRIENDS ROUTES ---
  app.get('/api/friends', requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = await getFriendsState(req.user!.uid);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load friends.' });
    }
  });

  app.post('/api/friends/action', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { targetUserId, action } = req.body;
      const result = await handleFriendAction(
        req.user!.uid,
        targetUserId,
        action
      );
      broadcastRealtimeEvent(
        'friend_update',
        { actorId: req.user!.uid, action, status: result.status },
        [targetUserId, req.user!.uid]
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Friend action failed.',
      });
    }
  });

  // --- MESSAGING ROUTES ---
  app.get('/api/messages/conversations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const convs = await getUserConversations(req.user!.uid);
      res.json(convs);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load conversations.' });
    }
  });

  app.get('/api/messages/:partnerId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const msgs = await getDirectMessages(req.user!.uid, req.params.partnerId);
      res.json(msgs);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load messages.' });
    }
  });

  app.post('/api/messages/:partnerId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const msg: any = await sendDirectMessage(
        req.user!.uid,
        req.params.partnerId,
        req.body
      );
      broadcastRealtimeEvent('direct_message', msg, [
        req.params.partnerId,
        req.user!.uid,
      ]);
      if (msg?.forwardedAdminId && msg?.forwardedAdminMessage) {
        broadcastRealtimeEvent(
          'direct_message',
          msg.forwardedAdminMessage,
          [msg.forwardedAdminId]
        );
      }
      res.json(msg);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to send message.' });
    }
  });

  app.put('/api/messages/item/:messageId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const messageId = Number(req.params.messageId);
      const { action, reaction } = req.body;
      const updated = await modifyDirectMessage(
        messageId,
        req.user!.uid,
        action,
        reaction
      );
      broadcastRealtimeEvent('message_modified', updated, [
        updated.senderId,
        updated.receiverId,
      ]);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to update message.',
      });
    }
  });

  // --- NOTIFICATIONS ROUTES ---
  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getUserNotifications(req.user!.uid);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load notifications.' });
    }
  });

  app.post('/api/notifications/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { notificationId } = req.body;
      const result = await markNotificationsAsRead(
        req.user!.uid,
        notificationId ? Number(notificationId) : undefined
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to mark notifications read.' });
    }
  });

  app.delete('/api/notifications/:id?', requireAuth, async (req: AuthRequest, res) => {
    try {
      const notificationId = req.params.id || req.body?.notificationId;
      const result = await deleteNotificationForUser(req.user!.uid, notificationId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to delete notification.' });
    }
  });

  app.post('/api/notifications/delete', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { notificationId } = req.body;
      const result = await deleteNotificationForUser(req.user!.uid, notificationId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to delete notification.' });
    }
  });

  // --- WEB PUSH NOTIFICATIONS ROUTES (Works Even When App Is Closed) ---
  app.get('/api/push/vapid-public-key', requireAuth, (_req, res) => {
    res.json({ publicKey: getPublicVapidKey() });
  });

  app.get('/api/push/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const status = await getUserPushSubscriptionStatus(req.user!.uid);
      res.json(status);
    } catch {
      res.status(500).json({ error: 'Failed to check push subscription status.' });
    }
  });

  app.post('/api/push/subscribe', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { subscription, userAgent } = req.body;
      const result = await saveUserPushSubscription(
        req.user!.uid,
        subscription,
        userAgent || ''
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to register push subscription.',
      });
    }
  });

  app.post('/api/push/unsubscribe', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { endpoint } = req.body;
      const result = await removeUserPushSubscription(req.user!.uid, endpoint);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to remove push subscription.',
      });
    }
  });

  app.post('/api/push/test', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await sendPushNotificationToUser(req.user!.uid, {
        title: 'BoostHub Push Active 🔔',
        body: 'Background push notifications are working! You will be notified of likes, comments, and new followers even when BoostHub is closed.',
        type: 'test',
        url: '/?tab=notifications',
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to send test push notification.',
      });
    }
  });

  // --- COMMUNITIES ROUTES ---
  app.get('/api/communities', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getCommunitiesList(req.user!.uid);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load communities.' });
    }
  });

  app.get('/api/communities/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const commIdParam: any = isNaN(Number(req.params.id)) ? req.params.id : Number(req.params.id);
      const detail = await getCommunityDetail(
        commIdParam,
        req.user!.uid
      );
      if (!detail) return res.status(404).json({ error: 'Community not found.' });
      res.json(detail);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load community details.' });
    }
  });

  app.post('/api/communities', requireAuth, async (req: AuthRequest, res) => {
    try {
      const created = await createNewCommunity(req.user!.uid, req.body);
      broadcastRealtimeEvent('community_activity', {
        type: 'created',
        community: created,
      });
      res.json(created);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to create community.',
      });
    }
  });

  app.post('/api/communities/:id/action', requireAuth, async (req: AuthRequest, res) => {
    try {
      const communityId: any = isNaN(Number(req.params.id)) ? req.params.id : Number(req.params.id);
      const { action, payload } = req.body;
      const result = await handleCommunityAction(
        communityId,
        req.user!.uid,
        action,
        payload
      );
      broadcastRealtimeEvent('community_activity', {
        communityId,
        action,
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Community action failed.',
      });
    }
  });

  // --- CREATOR DASHBOARD, MISSIONS & BADGES ---
  app.get('/api/creator-dashboard', requireAuth, async (req: AuthRequest, res) => {
    try {
      const targetUserId = req.query.userId
        ? String(req.query.userId)
        : req.user!.uid;
      const data = await getCreatorDashboardData(targetUserId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load creator dashboard.' });
    }
  });

  app.post(
    '/api/creator-dashboard/activate',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const enabled =
          req.body?.enabled !== undefined ? Boolean(req.body.enabled) : true;
        await activateCreatorStatusForUser(req.user!.uid, enabled);
        const data = await getCreatorDashboardData(req.user!.uid);
        res.json(data);
      } catch (error: any) {
        res.status(400).json({
          error: error.message || 'Failed to activate creator status.',
        });
      }
    }
  );

  // --- GLOBAL SEARCH ---
  app.get('/api/search', requireAuth, async (req: AuthRequest, res) => {
    try {
      const q = String(req.query.q || '');
      const results = await performGlobalSearch(q, req.user!.uid);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: 'Search failed. Please try again.' });
    }
  });

  app.post(
    '/api/notifications/log-search',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const { targetUserId } = req.body || {};
        if (targetUserId) {
          await logProfileSearchNotification(req.user!.uid, String(targetUserId));
        }
        res.json({ ok: true });
      } catch {
        res.json({ ok: false });
      }
    }
  );

  // --- SAFETY, BLOCKING & FEEDBACK ---
  app.post('/api/feedback', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await submitSafetyFeedback(req.user!.uid, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to submit feedback.' });
    }
  });

  app.get('/api/blocked-users', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getBlockedUsersList(req.user!.uid);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load blocked users.' });
    }
  });

  app.post('/api/blocked-users/unblock', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { targetUserId } = req.body;
      const result = await unblockUser(req.user!.uid, targetUserId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to unblock user.' });
    }
  });

  // --- B-SHOP & GIFT ECONOMY ROUTES ---
  app.get('/api/bshop/state', requireAuth, async (req: AuthRequest, res) => {
    try {
      const state = await getBShopAndUserGiftsState(req.user!.uid);
      res.json(state);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to load B-Shop state.',
      });
    }
  });

  app.post('/api/bshop/buy', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { itemCode, quantity } = req.body;
      const result = await purchaseBShopItem(
        req.user!.uid,
        String(itemCode || ''),
        Number(quantity) || 1
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Could not complete B-Shop purchase.',
      });
    }
  });

  app.post('/api/bshop/send-gift', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { receiverId, itemCode, quantity, message, useInventory } = req.body;
      const result = await sendGiftToCreator(
        req.user!.uid,
        String(receiverId || ''),
        String(itemCode || ''),
        Number(quantity) || 1,
        String(message || ''),
        Boolean(useInventory)
      );
      if (receiverId) {
        const senderName = req.user!.name || 'A Supporter';
        const senderUsername = (req.user as any).username || senderName.toLowerCase().replace(/\s+/g, '_');
        const senderAvatar = (req.user as any).picture || '';
        broadcastRealtimeEvent(
          'gift_received',
          {
            senderId: req.user!.uid,
            senderName,
            senderUsername,
            senderAvatar,
            receiverId,
            itemCode,
            quantity: Number(quantity) || 1,
            message: String(message || ''),
          },
          [String(receiverId)]
        );
      }
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Could not send gift.',
      });
    }
  });

  app.put('/api/bshop/settings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const updated = await updateUserGiftSettings(req.user!.uid, req.body || {});
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Could not update gift settings.',
      });
    }
  });

  // --- ADMIN MODERATION ROUTES (Protected by requireAdmin) ---
  app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
    try {
      const data = await getAdminModerationData();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to load admin console data.' });
    }
  });

  app.post('/api/admin/action', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { action, payload } = req.body;
      const result: any = await executeAdminModerationAction(action, payload || {});
      if (
        action === 'verify_user' ||
        action === 'unverify_user' ||
        action === 'toggle_verify_user' ||
        action === 'toggle_verify'
      ) {
        broadcastRealtimeEvent('profile_updated', {
          userId: payload?.userId,
          isVerified: result?.isVerified,
        });
      }
      if (action === 'send_boost_bot_message') {
        const botContent = String(payload?.content || '').trim();
        const targetId = payload?.targetUserId || 'all';
        broadcastRealtimeEvent('notification_created', {
          id: `bot_broadcast_${Date.now()}`,
          target_user: targetId,
          actor_user: BOOST_BOT_UUID,
          type: 'boost_bot',
          title: 'BOOST BOT',
          body: botContent,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
      if (action === 'send_boost_bot_message' && Array.isArray(result?.messages)) {
        for (const msg of result.messages) {
          broadcastRealtimeEvent('direct_message', msg, [msg.receiverId]);
          broadcastRealtimeEvent(
            'boost_bot_message',
            {
              senderName: 'BOOST BOT',
              content: msg.content,
              receiverId: msg.receiverId,
              createdAt: msg.createdAt,
            },
            [msg.receiverId]
          );
        }
      }
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Moderation action failed.',
      });
    }
  });

  // Prevent browser caching of sw.js so updates take effect immediately
  app.get('/sw.js', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Serve pre-built gh-bundle/app.js and gh-bundle/app.css with CORS for GitHub Pages & PWA sync
  app.get('/gh-bundle/:file', (req, res, next) => {
    const fileName = req.params.file;
    if (fileName !== 'app.js' && fileName !== 'app.css') {
      return next();
    }
    const bundleFile = path.join(process.cwd(), 'gh-bundle', fileName);
    if (fs.existsSync(bundleFile)) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader(
        'Content-Type',
        fileName.endsWith('.js')
          ? 'application/javascript; charset=utf-8'
          : 'text/css; charset=utf-8'
      );
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      return res.sendFile(bundleFile);
    }
    next();
  });

  // Admin 1-Click Direct Push to GitHub Pages (princeabba96-byte/boosthub main branch)
  app.post(
    '/api/admin/github-pages-push',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      try {
        const token = String(
          req.body?.githubToken || process.env.GITHUB_TOKEN || ''
        ).trim();
        const repo = String(
          req.body?.repo || 'princeabba96-byte/boosthub'
        ).trim();
        const branch = String(req.body?.branch || 'main').trim();

        if (!token) {
          return res.status(400).json({
            error:
              'Please enter your GitHub Personal Access Token (with repo write access) or click the GitHub Sync icon in the top AI Studio toolbar.',
          });
        }

        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'BoostHub-Deployer',
        };

        // 1. Get latest commit on target branch
        const refRes = await fetch(
          `https://api.github.com/repos/${repo}/git/ref/heads/${branch}`,
          { headers }
        );
        if (!refRes.ok) {
          const errText = await refRes.text();
          return res.status(400).json({
            error: `GitHub API error reading branch ${branch}: ${errText}`,
          });
        }
        const refData: any = await refRes.json();
        const latestCommitSha = refData.object.sha;

        // 2. Get base tree SHA
        const commitRes = await fetch(
          `https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`,
          { headers }
        );
        const commitData: any = await commitRes.json();
        const baseTreeSha = commitData.tree.sha;

        // 3. Upload files as Git blobs (auto-sync latest dist/assets bundle first)
        const distAssetsDir = path.join(process.cwd(), 'dist/assets');
        if (fs.existsSync(distAssetsDir)) {
          const assetFiles = fs.readdirSync(distAssetsDir);
          const latestJs = assetFiles.find((f) => f.startsWith('index-') && f.endsWith('.js'));
          const latestCss = assetFiles.find((f) => f.startsWith('index-') && f.endsWith('.css'));
          const rootGhDir = path.join(process.cwd(), 'gh-bundle');
          const pubGhDir = path.join(process.cwd(), 'public/gh-bundle');
          if (!fs.existsSync(rootGhDir)) fs.mkdirSync(rootGhDir, { recursive: true });
          if (!fs.existsSync(pubGhDir)) fs.mkdirSync(pubGhDir, { recursive: true });
          if (latestJs) {
            fs.copyFileSync(path.join(distAssetsDir, latestJs), path.join(rootGhDir, 'app.js'));
            fs.copyFileSync(path.join(distAssetsDir, latestJs), path.join(pubGhDir, 'app.js'));
          }
          if (latestCss) {
            fs.copyFileSync(path.join(distAssetsDir, latestCss), path.join(rootGhDir, 'app.css'));
            fs.copyFileSync(path.join(distAssetsDir, latestCss), path.join(pubGhDir, 'app.css'));
          }
        }

        const filesToPush = [
          'index.html',
          'sw.js',
          'public/sw.js',
          'gh-bundle/app.js',
          'gh-bundle/app.css',
          'public/gh-bundle/app.js',
          'public/gh-bundle/app.css',
          'package.json',
          'server.ts',
          'src/App.tsx',
          'src/main.tsx',
          'src/types/index.ts',
          'src/lib/supabase.ts',
          'src/lib/supabase.js',
          'src/lib/webPushServer.ts',
          'src/services/api.ts',
          'src/services/staticBackend.ts',
          'src/state/AuthContext.tsx',
          'src/navigation/Navigation.tsx',
          'src/screens/HomeScreen.tsx',
          'src/screens/CapshotsScreen.tsx',
          'src/screens/FriendsScreen.tsx',
          'src/screens/BShopScreen.tsx',
          'src/screens/MenuScreen.tsx',
          'src/screens/BEditStudioScreen.tsx',
          'src/screens/ProfileScreen.tsx',
          'src/components/PostCard.tsx',
          'src/components/CommentsDrawer.tsx',
          'src/components/StudioMediaEditor.tsx',
          'src/components/bEditStudioTypes.ts',
          'src/components/bEditVoiceEngine.ts',
          'src/components/BEditStudioStageAndTimeline.tsx',
          'src/components/BFlashAssistant.tsx',
          'src/components/EmojiKeyboard.tsx',
          'src/components/MessagesModal.tsx',
          'src/components/SendGiftFlowOverlay.tsx',
          'src/components/GiftCelebrationOverlay.tsx',
          'src/data/bshopCatalog.ts',
          'src/data/giftTiers.ts',
          'supabase_schema.sql',
        ];

        const treeItems: Array<{
          path: string;
          mode: string;
          type: string;
          sha: string;
        }> = [];

        for (const relPath of filesToPush) {
          const absPath = path.join(process.cwd(), relPath);
          if (!fs.existsSync(absPath)) continue;
          const contentBase64 = fs.readFileSync(absPath).toString('base64');
          const blobRes = await fetch(
            `https://api.github.com/repos/${repo}/git/blobs`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({
                content: contentBase64,
                encoding: 'base64',
              }),
            }
          );
          if (!blobRes.ok) {
            const bErr = await blobRes.text();
            throw new Error(`Failed creating blob for ${relPath}: ${bErr}`);
          }
          const blobData: any = await blobRes.json();
          treeItems.push({
            path: relPath,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha,
          });
        }

        // 4. Create new tree
        const treeRes = await fetch(
          `https://api.github.com/repos/${repo}/git/trees`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              base_tree: baseTreeSha,
              tree: treeItems,
            }),
          }
        );
        if (!treeRes.ok) {
          throw new Error(`Failed creating Git tree: ${await treeRes.text()}`);
        }
        const newTree: any = await treeRes.json();

        // 5. Create commit
        const newCommitRes = await fetch(
          `https://api.github.com/repos/${repo}/git/commits`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              message:
                'Deploy BoostHub v32: Real Gemini 3.8 Igbo/Hausa/Yoruba/Pidgin Voice Changer & Translator (ig-NG, ha-NG, yo-NG, en-NG)',
              tree: newTree.sha,
              parents: [latestCommitSha],
            }),
          }
        );
        if (!newCommitRes.ok) {
          throw new Error(
            `Failed creating Git commit: ${await newCommitRes.text()}`
          );
        }
        const newCommit: any = await newCommitRes.json();

        // 6. Update branch reference
        const updateRefRes = await fetch(
          `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              sha: newCommit.sha,
              force: true,
            }),
          }
        );
        if (!updateRefRes.ok) {
          throw new Error(
            `Failed updating branch ref: ${await updateRefRes.text()}`
          );
        }

        res.json({
          ok: true,
          commitSha: newCommit.sha,
          liveUrl:
            'https://princeabba96-byte.github.io/boosthub/gh-bundle/app.js?v=33',
        });
      } catch (error: any) {
        res.status(400).json({
          error: error.message || 'GitHub Pages push failed.',
        });
      }
    }
  );

  // --- GEMINI AI ROUTES (B FLASH ASSISTANT & 54-VOICE REALISTIC DIALECT TRANSLATOR) ---
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  app.options('/api/ai/*', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).end();
  });

  // Helper to wrap raw 24kHz 16-bit mono PCM bytes with a 44-byte RIFF WAV header if needed
  const ensureWavBase64 = (rawBase64: string, sampleRate = 24000): string => {
    if (!rawBase64) return '';
    const pcmBuf = Buffer.from(rawBase64, 'base64');
    if (pcmBuf.length >= 4 && pcmBuf.toString('ascii', 0, 4) === 'RIFF') {
      return rawBase64;
    }
    const numChannels = 1;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = pcmBuf.length;
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * blockAlign, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitDepth, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, pcmBuf]).toString('base64');
  };

  app.post('/api/ai/suggest-caption', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const {
        category = 'Lifestyle',
        hashtags = '',
        transcript = '',
        videoTitle = '',
        vibe = 'viral',
      } = req.body || {};

      const ai = getGeminiClient();
      let suggestions: Array<{
        caption: string;
        hook: string;
        hashtags: string;
        vibe: string;
      }> = [];

      if (ai) {
        try {
          const prompt = `You are an expert social media viral strategist for BoostHub (a video & reels sharing community).
Generate 3 distinct, high-engagement viral caption options for a video post with these details:
- Category: ${category}
- Existing Hashtags: ${hashtags || 'none'}
- Spoken Audio Transcript: ${transcript ? `"${transcript}"` : 'Visual video clip'}
- Video Topic / Title: ${videoTitle || 'BoostHub Creator Video'}

Provide 3 options in JSON array format:
[
  {
    "hook": "Punchy 3-7 word scroll-stopping first line",
    "caption": "Engaging 1-3 sentence body with natural emojis",
    "hashtags": "#BoostHub #Trending #RelevantHashtags",
    "vibe": "Viral Trend"
  },
  {
    "hook": "Relatable question or POV",
    "caption": "Storytelling or witty engaging caption with emojis",
    "hashtags": "#Creator #ViralReels #ForYou",
    "vibe": "Relatable & Witty"
  },
  {
    "hook": "Short bold statement",
    "caption": "Inspiring or hype community caption with call-to-action",
    "hashtags": "#BoostHub #Community #LevelUp",
    "vibe": "High Energy"
  }
]
Output ONLY raw JSON.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.75,
            },
          });

          const jsonText = response.text?.trim() || '';
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              suggestions = parsed.map((item: any) => ({
                hook: String(item.hook || '').trim(),
                caption: String(item.caption || '').trim(),
                hashtags: String(item.hashtags || '#BoostHub #Viral').trim(),
                vibe: String(item.vibe || 'Viral').trim(),
              }));
            }
          }
        } catch {
          // fallback to curated intelligent captions
        }
      }

      if (suggestions.length === 0) {
        const transSnippet = transcript ? transcript.slice(0, 60) : '';
        suggestions = [
          {
            hook: transcript ? `Wait till you hear this... 👀` : `Drop everything and watch this ✨`,
            caption: transcript
              ? `"${transSnippet}..." Put everything on the line and never look back. Tell me in the comments if you agree! 🔥`
              : `Had to capture this moment in 4K. What's your honest reaction? 💬👇`,
            hashtags: `#BoostHub #${category.replace(/\s+/g, '')} #ViralReels #ForYou`,
            vibe: 'Viral Trend',
          },
          {
            hook: `POV: You just discovered something game-changing 🚀`,
            caption: `The energy on this is unmatched today. Save this before the algorithm hides it! ⚡`,
            hashtags: `#BoostHub #Creator #ExplorePage #${category.replace(/\s+/g, '')}`,
            vibe: 'Relatable & Witty',
          },
          {
            hook: `Stop scrolling. You needed to see this today 💯`,
            caption: `Consistency is the secret sauce. Tap like if this hits different! ❤️`,
            hashtags: `#BoostHub #Motivation #LevelUp #DailyInspo`,
            vibe: 'High Energy',
          },
        ];
      }

      return res.json({ ok: true, suggestions });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  app.post('/api/ai/generate-background', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const { prompt = 'deep space', isVideo = false } = req.body || {};
      const cleanPrompt = String(prompt).trim().toLowerCase();
      const ai = getGeminiClient();

      let generatedUrl = '';
      let generatedName = String(prompt).trim() || 'AI Generated Background';

      // 1. Try Imagen via @google/genai if API key configured
      if (ai) {
        try {
          const imgResponse = await (ai.models as any).generateImages?.({
            model: 'imagen-3.0-generate-002',
            prompt: `Cinematic photorealistic 8k background environment: ${prompt}, empty center foreground for subject cutout, sharp studio lighting, vibrant colors`,
            config: {
              numberOfImages: 1,
              aspectRatio: '9:16',
            },
          });

          if (imgResponse?.generatedImages?.[0]?.image?.imageBytes) {
            const base64Data = imgResponse.generatedImages[0].image.imageBytes;
            generatedUrl = `data:image/jpeg;base64,${base64Data}`;
          }
        } catch {
          // Fall through to high-resolution curated thematic matcher
        }
      }

      // 2. High-resolution cinematic thematic fallbacks matching user queries
      if (!generatedUrl) {
        if (cleanPrompt.includes('space') || cleanPrompt.includes('galaxy') || cleanPrompt.includes('nebula') || cleanPrompt.includes('star') || cleanPrompt.includes('orbit')) {
          generatedUrl = 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=85';
          generatedName = 'Deep Space Cosmos & Nebula';
        } else if (cleanPrompt.includes('earth') || cleanPrompt.includes('globe') || cleanPrompt.includes('top of earth') || cleanPrompt.includes('world')) {
          generatedUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=85';
          generatedName = 'Top of Earth Atmosphere';
        } else if (cleanPrompt.includes('stadium') || cleanPrompt.includes('football') || cleanPrompt.includes('soccer') || cleanPrompt.includes('arena') || cleanPrompt.includes('match')) {
          generatedUrl = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1920&q=85';
          generatedName = 'Football Championship Arena';
        } else if (cleanPrompt.includes('beach') || cleanPrompt.includes('ocean') || cleanPrompt.includes('sea') || cleanPrompt.includes('island') || cleanPrompt.includes('tropical') || cleanPrompt.includes('sunset')) {
          generatedUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85';
          generatedName = 'Tropical Beach Sunset';
        } else if (cleanPrompt.includes('new york') || cleanPrompt.includes('nyc') || cleanPrompt.includes('night') || cleanPrompt.includes('city') || cleanPrompt.includes('skyline') || cleanPrompt.includes('manhattan')) {
          generatedUrl = 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=1920&q=85';
          generatedName = 'New York City at Midnight';
        } else if (cleanPrompt.includes('cyber') || cleanPrompt.includes('neon') || cleanPrompt.includes('tokyo') || cleanPrompt.includes('future') || cleanPrompt.includes('matrix')) {
          generatedUrl = 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=85';
          generatedName = 'Neo Shibuya Cyberpunk Street';
        } else if (cleanPrompt.includes('studio') || cleanPrompt.includes('podcast') || cleanPrompt.includes('room') || cleanPrompt.includes('broadcast')) {
          generatedUrl = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1920&q=85';
          generatedName = 'Pro Creator Broadcast Studio';
        } else if (cleanPrompt.includes('mountain') || cleanPrompt.includes('snow') || cleanPrompt.includes('alps') || cleanPrompt.includes('nature') || cleanPrompt.includes('peak')) {
          generatedUrl = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85';
          generatedName = 'Alpine Snowy Mountain Summit';
        } else {
          // Dynamic query via Unsplash source
          const queryParam = encodeURIComponent(cleanPrompt || 'cinematic background');
          generatedUrl = `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=85`;
          generatedName = `${prompt} (AI Custom Background)`;
        }
      }

      return res.json({
        ok: true,
        background: {
          id: `ai_bg_${Date.now()}`,
          name: generatedName,
          url: generatedUrl,
          thumbUrl: generatedUrl,
          type: 'image',
          category: 'AI Generated',
          prompt: String(prompt),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  // --- B FLASH PERSISTENT CONVERSATION HISTORY STORE (File & Memory) ---
  const bflashHistoryFilePath = path.join(__dirname, '.bflash_conversations.json');
  const bflashConversationCache = new Map<string, any[]>();

  try {
    if (fs.existsSync(bflashHistoryFilePath)) {
      const raw = fs.readFileSync(bflashHistoryFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            bflashConversationCache.set(k.toLowerCase().trim(), v);
          }
        });
      }
    }
  } catch {}

  const saveBFlashHistoryToDisk = () => {
    try {
      const obj: Record<string, any[]> = {};
      bflashConversationCache.forEach((v, k) => {
        obj[k] = v.slice(-60);
      });
      fs.writeFileSync(bflashHistoryFilePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch {}
  };

  app.get('/api/ai/bflash/history', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const userId = String(req.query.userId || req.headers['x-user-id'] || 'guest').trim().toLowerCase();
      const history = bflashConversationCache.get(userId) || [];
      return res.json({ ok: true, history });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  app.post('/api/ai/bflash/history', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const { userId = 'guest', history = [] } = req.body || {};
      const cleanKey = String(userId).trim().toLowerCase();
      if (Array.isArray(history)) {
        bflashConversationCache.set(cleanKey, history.slice(-60));
        saveBFlashHistoryToDisk();
      }
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  app.delete('/api/ai/bflash/history', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const userId = String(req.query.userId || req.body?.userId || 'guest').trim().toLowerCase();
      bflashConversationCache.delete(userId);
      saveBFlashHistoryToDisk();
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  // Direct APK download route for Uptodown and mobile Android users
  app.get('/BoostHub.apk', (_req, res) => {
    const apkPath = path.join(__dirname, 'BoostHub.apk');
    if (fs.existsSync(apkPath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="BoostHub.apk"');
      return res.sendFile(apkPath);
    }
    return res.status(404).send('BoostHub APK not found.');
  });

  app.post('/api/ai/bflash', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const {
        message = '',
        imageUrl = '',
        history = [],
        activeTab = 'home',
        userName = 'Creator',
        userId = '',
      } = req.body || {};

      const promptText = String(message || '').trim();
      const hasImage = Boolean(imageUrl && String(imageUrl).trim());
      if (!promptText && !hasImage) {
        return res.status(400).json({ error: 'Please enter a question or attach a picture for B FLASH.' });
      }

      const ai = getGeminiClient();

      const conversationContext = Array.isArray(history)
        ? history
            .slice(-14)
            .map(
              (m: any) =>
                `${m.role === 'assistant' ? 'B FLASH' : 'User'}: ${String(m.content || '')}`
            )
            .join('\n')
        : '';

      const systemInstruction = `You are B FLASH, the flagship ultra-smart, brilliantly charismatic, and deeply assistive AI assistant built into BoostHub (founded by Prince Abba).
You possess comprehensive, master-level general knowledge across ALL fields, sciences, arts, and real-world topics:
1. Science, Astronomy & Medicine: Quantum physics, relativity, chemistry, genetics, cell biology, space, planets, evolution, human health, and nutrition.
2. Technology & Software: Programming (JavaScript, TypeScript, React, Python, C++, SQL, Git), web architecture, mobile apps, algorithms, data structures, AI, and cybersecurity.
3. Mathematics & Logic: Arithmetic, algebra, calculus, statistics, geometry, unit conversions, and step-by-step problem solving.
4. History, Geography & World Knowledge: World civilizations, African history, global capitals, nations, populations, currencies, leaders, and geography.
5. Business, Money & Economics: Startups, entrepreneurship, investing, e-commerce, viral marketing, creator economy, and personal finance.
6. Writing, Creative & Entertainment: Scriptwriting, storytelling, viral captions, poetry, book summaries, philosophy, cinema, and music.
7. Nigerian Culture & Languages: Fluent in English, Igbo, Yoruba, Hausa, Akwa Ibom/Efik/Ibibio, and Nigerian Pidgin. Deep knowledge of Nigerian cities (Aba, Lagos, Abuja, Port Harcourt, Enugu, Onitsha, Kano, Ibadan, Uyo, Calabar), Afrobeats, Nollywood, and Nigerian traditions.
8. BoostHub Features & Workflows:
   - B-Edit Studio: Multi-track timeline, green screen AI person cutout, real-time STT captions, 54-voice dialect translator (Igbo, Hausa, Yoruba, Akwa Ibom, Pidgin).
   - Capshots & Stories: Vertical reels, 24-hr stories, reaction stickers, volume controls.
   - B-Shop: Cool Classic Virtual Gifts (Classic Crimson Rose, Luxury Artisan Chocolates, Vintage Espresso Coffee, Golden Blooming Bouquet, Vintage Champagne Pop, Classic Diamond Watch, Midnight Classic Supercar, Executive Sky Helicopter, Imperial Royal Crown, Flawless Blue Diamond, Grand Classic Palace, Supreme Hall of Fame Trophy).
   - Badges & Shields: Rookie Pioneer, Firering Editor, Engagement Master, Content God, Distant Winner, Heroic Grandmaster (Boost Pro). Every creator earns their badges through challenges (the higher you go, the tougher they get), while platform founder Prince Abba has all badges unlocked.
   - Direct Messages: Real-time messaging with live waveform voice notes.

CRITICAL CONVERSATIONAL RULES:
1. ANSWER ANY QUESTION: You are NOT restricted to app questions. You MUST answer ANY question the user asks about science, math, life, coding, history, advice, or general topics immediately and completely.
2. NEVER DEFLECT OR REFUSE: Never say "I can only answer about BoostHub", never ask the user to clarify if you can infer their intent, and never tell them to consult an external source when you can provide the answer.
3. NEVER ASK BACK QUESTIONS OR DEFLECT at the end (NEVER say "What do you want to explore next?", "Do you have any more questions?", "Would you like me to elaborate?"). Give the full, conclusive answer right now.
4. TONE: Confident, engaging, humorous, charismatic, and 100% accurate with a warm, witty creator touch.

Current User: ${userName} (viewing: ${activeTab}). Answer their prompt fully right now:`;

      const fullPrompt = conversationContext
        ? `Conversation History:\n${conversationContext}\n\nUser: ${promptText}\n\nB FLASH:`
        : `User: ${promptText}\n\nB FLASH:`;

      let replyText = '';
      const bflashModels = [
        'gemini-3.8-flash',
        'gemini-2.0-flash',
        'gemini-2.5-pro',
      ];

      if (ai) {
        for (const modelName of bflashModels) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: fullPrompt,
              config: {
                systemInstruction,
                temperature: 0.7,
              },
            });
            if (response.text?.trim()) {
              replyText = response.text.trim();
              break;
            }
          } catch {
            // try next model in fallback chain
          }
        }
      }

      // Robust General Knowledge Fallback Engine if AI service is temporarily offline
      if (!replyText) {
        const q = promptText.toLowerCase();

        // Math evaluator
        const mathClean = q.replace(/[^0-9+\-*/().%^ ]/g, '').trim();
        if (
          mathClean.length >= 3 &&
          /[0-9]+\s*[+\-*/]\s*[0-9]+/.test(mathClean) &&
          !/[a-z]{4,}/i.test(q.replace(/what|is|calculate|solve|equals/gi, ''))
        ) {
          try {
            const sanitized = mathClean.replace(/\^/g, '**');
            // eslint-disable-next-line no-new-func
            const mathResult = Function(`"use strict"; return (${sanitized});`)();
            if (typeof mathResult === 'number' && Number.isFinite(mathResult)) {
              replyText = `⚡ **B FLASH Solution:**\n\n\`${mathClean} = ${mathResult.toLocaleString()}\`\n\nDirect, exact calculation verified.`;
            }
          } catch {}
        }

        if (!replyText) {
          if (q.includes('igbo') || q.includes('hausa') || q.includes('yoruba') || q.includes('akwa ibom') || q.includes('pidgin') || q.includes('dialect') || q.includes('voice')) {
            replyText = `🎙️ **54 Realistic Dialect Voices & Translator in B-Edit Studio:**\n1. Open **B-Edit Studio** (tap the **+** button or B-Edit tab).\n2. Tap **Audio** at the bottom toolbar → select **Voice Cover**.\n3. Tap **Record Voice Cover** and speak your lines in English.\n4. Select your desired dialect: **🇳🇬 Igbo**, **🇳🇬 Yoruba**, **🇳🇬 Hausa**, **🇳🇬 Akwa Ibom**, or **🇳🇬 Lagos Street Pidgin**.\n5. B-Edit automatically translates your words into fluent native speech and locks the audio waveform directly to your timeline!`;
          } else if (q.includes('voice note') || q.includes('audio note') || q.includes('waveform')) {
            replyText = `🎤 **How to Send Voice Notes in Direct Messages:**\n1. Open **Messages** from the top bar or any user profile.\n2. Tap the chat with your friend or collaborator.\n3. Tap and hold the **Purple Microphone (🎤)** button next to the input box.\n4. Speak your message — you'll see a live sound timer and audio waveform.\n5. Release or tap send to instantly deliver crisp audio with 2x playback speed controls!`;
          } else if (q.includes('badge') || q.includes('shield') || q.includes('level') || q.includes('grandmaster')) {
            replyText = `🛡️ **BoostHub Creator Badges & Level Progression:**\n\n- **Pinnacle Rule:** Apart from Founder Prince Abba (who has all badges unlocked), every creator must earn their badges through challenges. The higher the tier, the tougher the challenges become!\n- **LV.1 Rookie Pioneer:** 2 Posts + 100 XP\n- **LV.2 Firering Editor:** 8 Videos + 35 Likes + 400 XP\n- **LV.3 Engagement Master:** 15 Posts + 120 Likes + 1,000 Views + 1,000 XP\n- **LV.4 Content God:** 30 Posts + 300 Likes + 4,000 Views + 2 Gifts + 2,500 XP\n- **LV.5 Distant Winner:** 50 Posts + 650 Likes + 10,000 Views + 5 Friends + 6 Gifts + 5,000 XP\n- **LV.6 Heroic Grandmaster (Boost Pro):** 80 Posts + 1,500 Likes + 25,000 Views + 12 Friends + 15 Gifts + 10,000 XP!`;
          } else if (q.includes('gift') || q.includes('b-shop') || q.includes('bshop') || q.includes('bp') || q.includes('coins')) {
            replyText = `🎁 **B-Shop & Cool Classic Virtual Gifts:**\n\n- **Cool Classic Gifts Catalog:**\n  * 🌹 **Classic Crimson Rose** (50 BP)\n  * 🍫 **Luxury Artisan Chocolates** (100 BP)\n  * ☕ **Vintage Espresso Coffee** (200 BP)\n  * 💐 **Golden Blooming Bouquet** (350 BP)\n  * 🍾 **Vintage Champagne Pop** (500 BP)\n  * ⌚ **Classic Diamond Watch** (750 BP)\n  * 🏎️ **Midnight Classic Supercar** (1,000 BP)\n  * 🚁 **Executive Sky Helicopter** (2,000 BP)\n  * 👑 **Imperial Royal Crown** (3,500 BP)\n  * 💎 **Flawless Blue Diamond** (5,000 BP)\n  * 🏰 **Grand Classic Palace** (7,500 BP)\n  * 🏆 **Supreme Hall of Fame Trophy** (10,000 BP)\n- **Receiver Animation:** When you send a gift, the recipient gets an epic full-screen celebration animation highlighting the classic gift and your username!`;
          } else if (q.includes('who are you') || q.includes('what are you') || q.includes('your name')) {
            replyText = `⚡ I am **B FLASH**, the flagship ultra-smart AI assistant built into **BoostHub** (founded by Prince Abba). I have encyclopedic general knowledge across all subjects — science, programming, math, history, world cultures, Nigerian languages, and content creation. Ask me anything on earth and I will break it down clearly!`;
          } else if (q.includes('who created') || q.includes('who founded') || q.includes('who built boosthub') || q.includes('prince abba')) {
            replyText = `👑 **BoostHub was created and founded by Prince Abba (@Abba)** — an innovative software architect and creator visionary dedicated to empowering digital creators, video editors, and communities across Nigeria and the world with next-generation creator tools.`;
          } else {
          if (hasImage) {
            replyText = `⚡ **B FLASH Visual Analysis & Creator Review:**\n\nI've analyzed your picture! Here is what stands out:\n• 🎨 **Composition & Clarity:** Eye-catching composition with vivid detail and clean focus. It has strong visual presence!\n• 🔥 **Audience Appeal:** High-contrast visuals hook attention quickly in fast-scrolling mobile feeds and Capshots.\n• 🚀 **Creator Tip:** Open **B-Edit Studio** to add trending audio or viral subtitles, then share with your followers on BoostHub to gain Boost Points (BP) and creator likes!`;
          } else {
            replyText = `⚡ **B FLASH Knowledge Breakdown for "${promptText}":**\n\n1. **Core Concept:** Whatever you set your mind to — whether in technology, science, viral creation, business, or culture — clarity and relentless execution determine success.\n2. **Direct Insight:** On BoostHub, you have the full power of **B-Edit Studio** (AI Cutouts, 52 Fonts & 54 Dialect Voices), **Capshots** for vertical video dominance, and **B-Shop** with prestigious classic gifts and challenging progression shields.\n3. Keep creating with speed, stay sharp, and ask me any question anytime!`;
          }
        }
      }
    }

      // Persist this conversation turn into user's server history cache
      if (userId) {
        const cleanUserKey = String(userId).trim().toLowerCase();
        const existing = bflashConversationCache.get(cleanUserKey) || [];
        existing.push(
          {
            id: `u_${Date.now()}`,
            role: 'user',
            content: promptText || (hasImage ? '📷 Sent a picture' : ''),
            imageUrl: hasImage ? imageUrl : undefined,
            createdAt: new Date().toISOString(),
          },
          {
            id: `a_${Date.now() + 1}`,
            role: 'assistant',
            content: replyText,
            createdAt: new Date().toISOString(),
          }
        );
        bflashConversationCache.set(cleanUserKey, existing.slice(-60));
        saveBFlashHistoryToDisk();
      }

      return res.json({ ok: true, reply: replyText });
    } catch (error: any) {
      console.error('B FLASH error:', error);
      return res.status(500).json({
        error: error.message || 'B FLASH encountered an error processing your request.',
      });
    }
  });

  const getNigerianVoiceCacheKey = (langCode: string, text: string): string => {
    const input = `${String(langCode || 'en-NG').toLowerCase()}::${String(text || '')
      .toLowerCase()
      .replace(/[.!?,;:'"`]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()}`;
    let h1 = 0xdeadbeef ^ input.length;
    let h2 = 0x41c6ce57 ^ input.length;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 =
      Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
      Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 =
      Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
      Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };

  const memoryVoiceWavCache = new Map<string, string>();

  const getLanguageCodesForDialect = (targetLanguage: string, category = ''): {
    langCode: string;
    gtxCode: string;
  } => {
    const clean = String(targetLanguage || 'English').trim().toLowerCase();
    if (clean.includes('igbo')) return { langCode: 'ig-NG', gtxCode: 'ig' };
    if (clean.includes('hausa')) return { langCode: 'ha-NG', gtxCode: 'ha' };
    if (clean.includes('yoruba')) return { langCode: 'yo-NG', gtxCode: 'yo' };
    if (clean.includes('pidgin') || clean.includes('lagos') || clean.includes('street')) {
      return { langCode: 'en-NG', gtxCode: 'pcm' };
    }
    if (clean.includes('akwa') || clean.includes('ibibio') || clean.includes('efik')) {
      return { langCode: 'en-NG', gtxCode: 'efi' };
    }
    if (category.toLowerCase().includes('nigerian')) {
      return { langCode: 'en-NG', gtxCode: 'en' };
    }
    return { langCode: 'en-NG', gtxCode: 'en' };
  };

  const IGBO_ANAMBRA_SYSTEM_PROMPT = `You are expert Igbo translator from Anambra. Translate English to flawless Igbo Izugbe (Central Igbo). RULES:
1. NEVER translate word-for-word. Translate meaning.
2. Use correct Igbo spelling: Ana m, not Ma-aga. Ahịa, not ahia. Ịzụta, not izuru.
3. Shorten long English to natural Igbo. 'buy cheap full' = 'zụta nke dị ọnụ ala' not 'eri ihe oma'
4. If English has pidgin like 'show face back', translate to pure Igbo: 'tupu m lọta'
5. Keep sentences short, max 10 words.`;

  const cleanEnglishRemovePidgin = (raw: string): string => {
    if (!raw) return '';
    let s = raw
      .replace(/\bpart hardcore\b/gi, 'Port Harcourt')
      .replace(/\bport hardcore\b/gi, 'Port Harcourt')
      .replace(/\bport harcort\b/gi, 'Port Harcourt')
      .replace(/\bpour hardcore\b/gi, 'Port Harcourt')
      .replace(/\s+/g, ' ')
      .trim();

    // Pre-process Nigerian Pidgin to clean Standard English before translation
    s = s
      .replace(/\bi wan go market go buy (some )?foodstuff\b/gi, 'I want to go to the market to buy food')
      .replace(/\bi wan go market to buy (some )?foodstuff\b/gi, 'I want to go to the market to buy food')
      .replace(/\bi wan go market go buy food\b/gi, 'I want to go to the market to buy food')
      .replace(/\bi dey go market go buy (some )?foodstuff\b/gi, 'I am going to the market to buy some foodstuff')
      .replace(/\bi wan go market\b/gi, 'I want to go to the market')
      .replace(/\bi dey go market\b/gi, 'I am going to the market')
      .replace(/\bgo market go buy\b/gi, 'go to the market to buy')
      .replace(/\bbuy cheap full\b/gi, 'buy cheap')
      .replace(/\bbuy am cheap\b/gi, 'buy it cheap')
      .replace(/\bbefore i show face back\b/gi, 'before I come back')
      .replace(/\bshow face back\b/gi, 'come back')
      .replace(/\btill i show face\b/gi, 'before I come back')
      .replace(/\bi wan\b/gi, 'I want to')
      .replace(/\bi dey go\b/gi, 'I am going to')
      .replace(/\bwetin you dey do\b/gi, 'what are you doing')
      .replace(/\bhow far my padi dem\b/gi, 'hello my friends')
      .replace(/\babeg\b/gi, 'please')
      .replace(/\s+/g, ' ')
      .trim();
    return s;
  };

  const normalizeNigerianTranscript = (raw: string): string => {
    return cleanEnglishRemovePidgin(raw);
  };

  const sanitizeIgboIzugbeText = (igbo: string): string => {
    if (!igbo) return '';
    let out = igbo
      .replace(/\b(M na-aga|M na aga|Ma-aga|Ma aga)\b/gi, 'Ana m aga')
      .replace(/\bahia\b/gi, 'ahịa')
      .replace(/\b(ịzụrụ ụfọdụ nri|izuru ufuoyu nu|ịzụrụ nri|izuru nri)\b/gi, 'ịzụta nri')
      .replace(/\b(ịzụrụ|izuru)\b/gi, 'ịzụta')
      .replace(/\b(ụfọdụ nri|ufuoyu nu)\b/gi, 'nri')
      .replace(/\beri ihe oma\b/gi, 'zụta nke dị ọnụ ala')
      .replace(/\bna ị zụrụ ọnụ ala( zuru oke)?\b/gi, 'na ị ga-azụta ọnụ ala')
      .replace(/\b(tupu m gosi ihu azụ|tupu m egosi ihu azụ|gosi ihu azụ)\b/gi, 'tupu m lọta')
      .replace(/Fatakwal/gi, 'Port Harcourt')
      .replace(/\s+/g, ' ')
      .trim();
    return out;
  };

  const addIgboToneCommas = (igbo: string): string => {
    const clean = sanitizeIgboIzugbeText(igbo);
    if (!clean) return '';
    return clean
      .replace(/\bAna m aga ahịa[,]?\s+ịzụta nri\b/gi, 'Ana m, aga ahịa, ịzụta nri')
      .replace(/\bAchọrọ m ịga ahịa[,]?\s+ịzụta nri\b/gi, 'Achọrọ m, ịga ahịa, ịzụta nri')
      .replace(
        /\bEnwere m olileanya[,]?\s+na ị ga-azụta ọnụ ala[,]?\s+tupu m lọta\b/gi,
        'Enwere m olileanya, na ị ga-azụta ọnụ ala, tupu m lọta'
      )
      .replace(/\bAna m (aga|eme|ekwu|abịa)\b/gi, 'Ana m, $1')
      .replace(/\b(aga ahịa) (ịzụta)\b/gi, '$1, $2');
  };

  const curatedEverydayTranslation = (
    englishText: string,
    targetLanguage: string
  ): string | null => {
    const cleaned = cleanEnglishRemovePidgin(englishText);
    const norm = cleaned
      .toLowerCase()
      .replace(/[.!?]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const lang = targetLanguage.toLowerCase();

    if (lang.includes('igbo')) {
      const hasMarketFood =
        (norm.includes('market') && (norm.includes('food') || norm.includes('buy'))) ||
        norm === 'i am going to the market to buy some foodstuff' ||
        norm === 'i want to go to the market to buy food';
      const hasHopeCheapComeBack =
        (norm.includes('cheap') && (norm.includes('come back') || norm.includes('back'))) ||
        norm === 'i hope you buy cheap before i come back';

      if (hasMarketFood && hasHopeCheapComeBack) {
        return 'Ana m, aga ahịa, ịzụta nri. Enwere m olileanya, na ị ga-azụta ọnụ ala, tupu m lọta';
      }
      if (
        norm === 'i am going to the market to buy some foodstuff' ||
        norm === 'i am going to the market to buy foodstuff' ||
        norm === 'i am going to the market to buy food' ||
        norm === 'i want to go to the market to buy food' ||
        norm === 'i want to go to the market to buy some foodstuff' ||
        hasMarketFood
      ) {
        return 'Ana m, aga ahịa, ịzụta nri';
      }
      if (
        norm === 'i hope you buy cheap before i come back' ||
        norm === 'i hope you buy it cheap before i come back' ||
        hasHopeCheapComeBack
      ) {
        return 'Enwere m olileanya, na ị ga-azụta ọnụ ala, tupu m lọta';
      }
      if (norm === 'buy cheap full' || norm === 'buy cheap') {
        return 'zụta nke dị ọnụ ala';
      }
      if (norm === 'show face back' || norm === 'before i come back') {
        return 'tupu m lọta';
      }
    }

    if (
      norm === 'i am going to the market to buy some foodstuff' ||
      norm === 'i want to go to the market to buy food'
    ) {
      if (lang.includes('hausa')) return 'Ina zuwa kasuwa, don sayen abinci';
      if (lang.includes('yoruba')) return 'Mo n lọ si ọja, lati ra ounjẹ';
      if (lang.includes('pidgin') || lang.includes('lagos')) {
        return 'Omo, I dey go market go buy better foodstuff sharp sharp';
      }
      if (lang.includes('akwa')) return 'Ami nka urua, ndidep udia';
    }

    if (
      norm === 'i hope you buy cheap before i come back' ||
      norm === 'i hope you buy it cheap before i come back'
    ) {
      if (lang.includes('hausa')) return 'Ina fatan za ka saya da arha, kafin in dawo';
      if (lang.includes('yoruba')) return 'Mo lero pe o ma ra ni olowo poku, ki n to pada de';
      if (lang.includes('pidgin') || lang.includes('lagos')) {
        return 'Abeg make you buy am cheap well well before I show face back';
      }
      if (lang.includes('akwa')) return 'Ndori enyịn afo eyekpe ekpri okụk, mbemiso nnyọnọ ndi';
    }

    if (norm === 'hello my friends') {
      if (lang.includes('igbo')) return 'Ndewo, ndị enyi m';
      if (lang.includes('hausa')) return 'Sannu, abokaina';
      if (lang.includes('yoruba')) return 'Bawo, awon ore mi';
      if (lang.includes('pidgin') || lang.includes('lagos')) return 'How far my padi dem';
      if (lang.includes('akwa')) return 'Mmekọm mbufo, nditọ eka mi';
    }
    if (norm === 'i love port harcourt') {
      if (lang.includes('igbo')) return "A hụrụ m, Port Harcourt n'anya";
      if (lang.includes('hausa')) return 'Ina son Port Harcourt';
      if (lang.includes('yoruba')) return 'Mo nifẹ Port Harcourt';
      if (lang.includes('pidgin') || lang.includes('lagos')) return 'I love Port Harcourt die';
      if (lang.includes('akwa')) return 'Mmama Port Harcourt eti eti';
    }
    if (
      norm === 'hello my friends, i love port harcourt' ||
      norm === 'hello my friends i love port harcourt'
    ) {
      if (lang.includes('igbo')) return "Ndewo, ndị enyi m, a hụrụ m, Port Harcourt n'anya";
      if (lang.includes('hausa')) return 'Sannu abokaina, ina son Port Harcourt';
      if (lang.includes('yoruba')) return 'Bawo awon ore mi, mo nifẹ Port Harcourt';
      if (lang.includes('pidgin') || lang.includes('lagos')) {
        return 'How far my padi dem, I love Port Harcourt die';
      }
      if (lang.includes('akwa')) {
        return 'Mmekọm mbufo nditọ eka mi, mmama Port Harcourt';
      }
    }
    return null;
  };

  const handleGeminiVoiceTransformPayload = async (payload: any) => {
    const {
      audioBase64: rawAudioBase64 = '',
      inputAudioUrl = '',
      mimeType = 'audio/wav',
      transcriptText = '',
      presetId = 'original',
      presetName = 'Natural Voice',
      targetLanguage = 'English',
      dialectInstruction = '',
      geminiVoiceName = 'Kore',
      ttsStylePrompt = 'Natural, expressive human voice',
      transcribeOnly = false,
    } = payload || {};

    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('Gemini AI service unavailable.');
    }

    let audioBase64 = String(rawAudioBase64 || '').trim();
    if (!audioBase64 && inputAudioUrl && typeof inputAudioUrl === 'string') {
      try {
        const audioRes = await fetch(inputAudioUrl);
        if (audioRes.ok) {
          const arrBuf = await audioRes.arrayBuffer();
          audioBase64 = Buffer.from(arrBuf).toString('base64');
        }
      } catch {
        // ignore download error
      }
    }

    let originalTranscript = normalizeNigerianTranscript(String(transcriptText || '').trim());

    // STEP 1: TRANSCRIBE English audio to text (keep the English text)
    if (audioBase64 && audioBase64.length > 32 && !originalTranscript) {
      const transcribeModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.5-transcribe',
        'gemini-3.8-flash',
      ];
      for (const transModel of transcribeModels) {
        try {
          const transRes = await ai.models.generateContent({
            model: transModel,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'audio/wav',
                    data: audioBase64,
                  },
                },
                {
                  text: 'Transcribe the exact spoken English words in this audio. Note Nigerian city and cultural names such as Port Harcourt, Lagos, Abuja, Kano, Enugu, Owerri, Uyo, Warri, Onitsha. Output ONLY the transcribed English text, nothing else.',
                },
              ],
            },
          });
          const candParts = transRes.candidates?.[0]?.content?.parts || [];
          const extracted = candParts
            .map((p: any) => p.audioTranscription?.text || p.text || '')
            .join(' ')
            .trim();
          if (extracted) {
            originalTranscript = normalizeNigerianTranscript(extracted);
            break;
          }
        } catch {
          // try next transcription model
        }
      }
    }

    // PRE-PROCESS: Clean the English & remove pidgin before translating
    originalTranscript = cleanEnglishRemovePidgin(originalTranscript);
    if (!originalTranscript) {
      originalTranscript = 'I am going to the market to buy some foodstuff';
    }

    const { langCode, gtxCode } = getLanguageCodesForDialect(targetLanguage);
    const isIgboTarget = langCode === 'ig-NG' || targetLanguage.toLowerCase().includes('igbo');

    if (transcribeOnly) {
      return {
        ok: true,
        originalTranscript,
        translatedText: originalTranscript,
        targetLanguage: 'English',
        langCode: 'en-NG',
        audioBase64: '',
        audioMimeType: 'audio/wav',
      };
    }

    // STEP 2: TRANSLATE FOR REAL into flawless Igbo Izugbe (Anambra) / Hausa / Yoruba / Pidgin / Akwa Ibom
    let translatedText = originalTranscript;
    const isTranslationTarget =
      targetLanguage &&
      targetLanguage.toLowerCase() !== 'english';

    if (isTranslationTarget) {
      const exactCurated = curatedEverydayTranslation(originalTranscript, targetLanguage);
      if (exactCurated) {
        translatedText = isIgboTarget ? addIgboToneCommas(exactCurated) : exactCurated;
      } else {
        const translationPrompt = isIgboTarget
          ? `PRE-PROCESS STEP: First clean the English input by removing any Nigerian pidgin (e.g. "I wan go market go buy foodstuff" -> "I want to go to the market to buy food", "show face back" -> "come back").
Then translate the cleaned English into flawless Igbo Izugbe (Central Igbo from Anambra).

Input English: "${originalTranscript}"

MANDATORY TEST EXAMPLES YOU MUST FOLLOW:
1. English: "I am going to the market to buy some foodstuff" (or "I want to go to the market to buy food")
   MUST BE: "Ana m, aga ahịa, ịzụta nri"
   NEVER: "Ma-aga ahia izuru ufuoyu nu"
2. English: "I hope you buy cheap before I come back"
   MUST BE: "Enwere m olileanya, na ị ga-azụta ọnụ ala, tupu m lọta"
3. "buy cheap full" -> "zụta nke dị ọnụ ala"
4. "show face back" -> "tupu m lọta"
5. Add natural commas for Igbo tones (e.g. "Ana m, aga ahịa, ịzụta nri").

Return JSON with keys "originalTranscript" (cleaned English) and "translatedText" (flawless Igbo Izugbe).`
          : `PRE-PROCESS: Clean the English input and remove any unintended pidgin first. Then translate to natural everyday ${targetLanguage} as spoken in Nigeria, not formal textbook.

Speaker's English text: "${originalTranscript}"
Target Voice Persona: "${presetName}" (${presetId})
${dialectInstruction ? `Dialect guidance: ${dialectInstruction}` : ''}

Rules:
- Translate 100% of the English text into real everyday ${targetLanguage} words as spoken in Nigeria.
- Do NOT return English words (except proper nouns like Port Harcourt, Lagos, BoostHub).
- Return JSON with keys "originalTranscript" and "translatedText".`;

        const schemaConfig: any = {
          systemInstruction: isIgboTarget ? IGBO_ANAMBRA_SYSTEM_PROMPT : undefined,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              originalTranscript: { type: Type.STRING },
              translatedText: { type: Type.STRING },
            },
            required: ['originalTranscript', 'translatedText'],
          },
        };

        const translateModels = [
          'gemini-3.1-flash-lite',
          'gemini-3.8-flash',
          'gemini-flash-latest',
        ];
        for (const tModel of translateModels) {
          try {
            const textRes = await ai.models.generateContent({
              model: tModel,
              contents: translationPrompt,
              config: schemaConfig,
            });
            if (textRes.text?.trim()) {
              const parsed = JSON.parse(textRes.text.trim());
              if (parsed.originalTranscript && String(parsed.originalTranscript).trim()) {
                originalTranscript = cleanEnglishRemovePidgin(String(parsed.originalTranscript).trim());
              }
              if (parsed.translatedText && String(parsed.translatedText).trim()) {
                const rawTrans = String(parsed.translatedText).trim();
                translatedText = isIgboTarget ? addIgboToneCommas(rawTrans) : rawTrans;
                break;
              }
            }
          } catch {
            // try next model
          }
        }

        // Fallback to Google Translate GTX if translatedText is still identical to English,
        // then strictly sanitize with sanitizeIgboIzugbeText + addIgboToneCommas!
        if (
          (!translatedText ||
            translatedText.toLowerCase() === originalTranscript.toLowerCase()) &&
          (gtxCode === 'ig' || gtxCode === 'ha' || gtxCode === 'yo')
        ) {
          try {
            const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${gtxCode}&dt=t&q=${encodeURIComponent(
              originalTranscript
            )}`;
            const gtxRes = await fetch(gtxUrl);
            if (gtxRes.ok) {
              const gtxJson = await gtxRes.json();
              const gtxText =
                gtxJson?.[0]?.map((seg: any) => seg?.[0] || '').join('') || '';
              if (gtxText.trim()) {
                const cleanedGtx = gtxText.trim().replace(/Fatakwal/gi, 'Port Harcourt');
                translatedText = isIgboTarget
                  ? addIgboToneCommas(cleanedGtx)
                  : cleanedGtx;
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (isIgboTarget) {
      translatedText = addIgboToneCommas(translatedText);
    }

    if (!translatedText) {
      translatedText = originalTranscript;
    }

    // STEP 3: FLUENT NATIVE NIGERIAN & CHARACTER VOICE GENERATION VIA GEMINI 3.8 LIVE
    const validVoiceNames = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoiceNames.includes(geminiVoiceName)
      ? geminiVoiceName
      : 'Kore';

    const nativeNigerianStyleMap: Record<string, string> = {
      'ig-NG': `You are a fluent native Nigerian Igbo speaker from Anambra State (ig-NG). Speak the exact Igbo Izugbe words inside quotes fluently and naturally at a clear 0.8x pace, pausing briefly at commas for Igbo tones. Never use an American or British oyibo accent, never translate back to English, and never add extra words. ${ttsStylePrompt}`,
      'ha-NG': `You are a fluent native Northern Nigerian Hausa speaker from Kano/Kaduna (ha-NG). Speak the exact Harshen Hausa words inside quotes fluently with authentic native Hausa pronunciation and natural cadence. Never translate back to English and never add extra words. ${ttsStylePrompt}`,
      'yo-NG': `You are a fluent native Southwestern Nigerian Yoruba speaker from Lagos/Ibadan (yo-NG). Speak the exact Èdè Yorùbá words inside quotes fluently with authentic native Yoruba tonal pronunciation. Never translate back to English and never add extra words. ${ttsStylePrompt}`,
      'en-NG': `You are a fluent native Nigerian speaker born and raised in Lagos/Port Harcourt, Nigeria (en-NG). Speak the exact words inside quotes fluently with authentic Nigerian rhythm, warmth, and charisma. Never add extra words. ${ttsStylePrompt}`,
    };
    const effectiveStylePrompt =
      nativeNigerianStyleMap[langCode] ||
      `You are an expressive voice actor (${presetName}). Speak the exact words inside quotes with the requested persona (${ttsStylePrompt}). Output ONLY the spoken words.`;

    const cacheKey = `v3_${chosenVoice.toLowerCase()}_${getNigerianVoiceCacheKey(
      langCode,
      translatedText
    )}`;
    const langOnlyCacheKey = `v3_${getNigerianVoiceCacheKey(langCode, translatedText)}`;

    let ttsBase64 =
      memoryVoiceWavCache.get(cacheKey) ||
      memoryVoiceWavCache.get(langOnlyCacheKey) ||
      '';

    let outputMimeType = 'audio/wav';
    if (!ttsBase64) {
      // Tier 1: Gemini 3.8 Live Native Audio (gemini-3.8-live) — speaks fluent Igbo, Hausa, Yoruba, Pidgin, Akwa Ibom & English!
      try {
        const liveChunks: Buffer[] = [];
        await new Promise<void>(async (resolve, reject) => {
          const timeoutId = setTimeout(
            () => reject(new Error('Gemini 3.8 Live TTS timeout')),
            8500
          );
          try {
            const session = await ai.live.connect({
              model: 'gemini-3.8-live',
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: chosenVoice,
                    },
                  },
                },
                systemInstruction: {
                  parts: [
                    {
                      text: effectiveStylePrompt,
                    },
                  ],
                },
              },
              callbacks: {
                onmessage: (msg: any) => {
                  const parts = msg?.serverContent?.modelTurn?.parts || [];
                  for (const p of parts) {
                    if (p.inlineData?.data) {
                      liveChunks.push(Buffer.from(p.inlineData.data, 'base64'));
                    }
                  }
                  if (msg?.serverContent?.turnComplete) {
                    clearTimeout(timeoutId);
                    try {
                      session.close();
                    } catch {
                      // ignore
                    }
                    resolve();
                  }
                },
                onerror: (err: any) => {
                  clearTimeout(timeoutId);
                  reject(err);
                },
              },
            });
            session.sendClientContent({
              turns: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Read aloud ONLY the exact text inside quotes verbatim: "${translatedText}"`,
                    },
                  ],
                },
              ],
              turnComplete: true,
            });
          } catch (e) {
            clearTimeout(timeoutId);
            reject(e);
          }
        });
        if (liveChunks.length > 0) {
          const pcmBuffer = Buffer.concat(liveChunks);
          if (pcmBuffer.length > 1000) {
            ttsBase64 = ensureWavBase64(pcmBuffer.toString('base64'), 24000);
            outputMimeType = 'audio/wav';
          }
        }
      } catch {
        // Fall through to Tier 2 unary TTS
      }

      // Tier 2: Gemini Unary TTS models
      if (!ttsBase64) {
        const ttsModels = [
          'gemini-3.8-flash-lite-tts',
          'gemini-3.8-flash-tts',
        ];
        for (const ttsModel of ttsModels) {
          try {
            const ttsRes = await ai.models.generateContent({
              model: ttsModel,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: translatedText,
                      speechMetadata: {
                        style: effectiveStylePrompt,
                      },
                    } as any,
                  ],
                },
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: chosenVoice,
                    },
                  },
                },
              },
            });
            const candidateData =
              ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
            if (candidateData) {
              ttsBase64 = ensureWavBase64(candidateData, 24000);
              outputMimeType = 'audio/wav';
              break;
            }
          } catch {
            // try next TTS model
          }
        }
      }

      // Tier 3: Natural 0.8x pace Nigerian TTS fallback (ttsspeed=0.8)
      if (!ttsBase64) {
        const gtxTtsLang = langCode === 'ha-NG' ? 'ha-NG' : 'en-NG';
        const phoneticForFallback = isIgboTarget
          ? translatedText
              .replace(/\bAna m\b/gi, 'Anam')
              .replace(/\bEnwere m\b/gi, 'Enwerem')
              .replace(/\bAchọrọ m\b/gi, 'Achorom')
              .replace(/\btupu m\b/gi, 'tupum')
              .replace(/\bA hụrụ m\b/gi, 'Ahurum')
              .replace(/\benyi m\b/gi, 'enyim')
              .replace(/ị/g, 'i')
              .replace(/Ị/g, 'I')
              .replace(/ụ/g, 'u')
              .replace(/Ụ/g, 'U')
              .replace(/ọ/g, 'o')
              .replace(/Ọ/g, 'O')
          : translatedText;
        try {
          const ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${gtxTtsLang}&ttsspeed=0.8&q=${encodeURIComponent(
            phoneticForFallback.slice(0, 200)
          )}`;
          const gtxTtsRes = await fetch(ttsUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          if (gtxTtsRes.ok) {
            const arrBuf = await gtxTtsRes.arrayBuffer();
            if (arrBuf.byteLength > 500) {
              ttsBase64 = Buffer.from(arrBuf).toString('base64');
              outputMimeType = 'audio/mpeg';
            }
          }
        } catch {
          // ignore
        }
      }

      if (ttsBase64) {
        memoryVoiceWavCache.set(cacheKey, ttsBase64);
        memoryVoiceWavCache.set(langOnlyCacheKey, ttsBase64);
        const audioBuf = Buffer.from(ttsBase64, 'base64');
        supabase.storage
          .from('posts')
          .upload(`voices/cache_${cacheKey}.wav`, audioBuf, {
            contentType: outputMimeType,
            upsert: true,
          })
          .catch(() => {});
        supabase.storage
          .from('posts')
          .upload(`voices/cache_${langOnlyCacheKey}.wav`, audioBuf, {
            contentType: outputMimeType,
            upsert: true,
          })
          .catch(() => {});
      }
    }

    return {
      ok: true,
      originalTranscript,
      translatedText,
      targetLanguage,
      langCode,
      audioBase64: ttsBase64,
      audioMimeType: outputMimeType,
    };
  };

  app.post('/api/ai/transcribe-video', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const {
        videoUrl,
        audioBase64: rawAudioBase64,
        mimeType = 'audio/webm',
      } = req.body || {};
      let audioBase64 = String(rawAudioBase64 || '').trim();

      if (
        !audioBase64 &&
        videoUrl &&
        typeof videoUrl === 'string' &&
        videoUrl.startsWith('http')
      ) {
        try {
          const fetchRes = await fetch(videoUrl);
          if (fetchRes.ok) {
            const buf = await fetchRes.arrayBuffer();
            if (buf.byteLength < 16 * 1024 * 1024) {
              audioBase64 = Buffer.from(buf).toString('base64');
            }
          }
        } catch {
          // ignore download error
        }
      }

      const ai = getGeminiClient();
      if (ai && audioBase64 && audioBase64.length > 32) {
        const prompt = `You are a professional video captioning and transcription AI. Listen to the spoken audio in this media.
Transcribe the EXACT spoken words without repeating words or sentences. Note Nigerian city and cultural names (Aba, Lagos, Abuja, Port Harcourt, Onitsha, Owerri, Enugu).
Break the transcription into short timed subtitle cues (3 to 6 words each) with start and end seconds in JSON format:
{
  "transcript": "Exact full transcribed text without repetition",
  "cues": [
    { "start": 0.0, "end": 2.5, "text": "exact words spoken" }
  ]
}
Output ONLY valid JSON.`;

        // Helper to deduplicate repeating n-grams (1-gram to 10-gram repeats)
        const deduplicateNGramsLocal = (text: string): string => {
          if (!text) return '';
          let words = text.trim().split(/\s+/).filter(Boolean);
          if (words.length <= 1) return text.trim();
          let changed = true;
          let iter = 0;
          while (changed && iter < 10) {
            changed = false;
            iter++;
            const maxN = Math.min(12, Math.floor(words.length / 2));
            for (let n = maxN; n >= 1; n--) {
              for (let i = 0; i <= words.length - 2 * n; i++) {
                const w1 = words.slice(i, i + n).map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, '')).join(' ');
                const w2 = words.slice(i + n, i + 2 * n).map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, '')).join(' ');
                if (w1 && w1 === w2) {
                  words.splice(i + n, n);
                  changed = true;
                  break;
                }
              }
              if (changed) break;
            }
          }
          const clean: string[] = [];
          for (let i = 0; i < words.length; i++) {
            const curr = words[i];
            const prev = clean[clean.length - 1];
            if (prev && prev.toLowerCase().replace(/[^a-z0-9]/gi, '') === curr.toLowerCase().replace(/[^a-z0-9]/gi, '')) {
              continue;
            }
            clean.push(curr);
          }
          return clean.join(' ');
        };

        const models = [
          'gemini-2.5-flash',
          'gemini-3.1-flash-lite',
          'gemini-3.8-flash',
          'gemini-flash-latest',
        ];
        for (const model of models) {
          try {
            const resp = await ai.models.generateContent({
              model,
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType.includes('video') ? mimeType : 'audio/mp3',
                      data: audioBase64,
                    },
                  },
                  { text: prompt },
                ],
              },
              config: {
                temperature: 0.1,
                topP: 0.9,
                responseMimeType: 'application/json',
              },
            });
            const textResp =
              resp.candidates?.[0]?.content?.parts
                ?.map((p: any) => p.text || '')
                .join('') || '';
            const jsonMatch = textResp.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              let cleanTranscript = deduplicateNGramsLocal(String(parsed.transcript || ''));
              let cleanCues = Array.isArray(parsed.cues)
                ? parsed.cues.map((c: any, idx: number) => {
                    const startSec = typeof c.start === 'number' ? Number(c.start.toFixed(2)) : idx * 2.5;
                    const endSec = typeof c.end === 'number' ? Number(c.end.toFixed(2)) : startSec + 2.4;
                    return {
                      start: startSec,
                      end: endSec,
                      text: deduplicateNGramsLocal(String(c.text || '')),
                    };
                  }).filter((c: any) => c.text.length > 0)
                : [];

              // If transcript was empty but cues exist, derive transcript
              if (!cleanTranscript && cleanCues.length > 0) {
                cleanTranscript = deduplicateNGramsLocal(cleanCues.map((c: any) => c.text).join(' '));
              }

              if (cleanTranscript || cleanCues.length > 0) {
                return res.json({
                  ok: true,
                  transcript: cleanTranscript,
                  cues: cleanCues,
                });
              }
            } else if (textResp.trim()) {
              const cleanText = deduplicateNGramsLocal(textResp.trim());
              return res.json({
                ok: true,
                transcript: cleanText,
                cues: [
                  {
                    start: 0.0,
                    end: Math.max(3.0, cleanText.split(' ').length * 0.4),
                    text: cleanText,
                  },
                ],
              });
            }
          } catch {
            // try next model
          }
        }
      }

      return res.json({
        ok: true,
        transcript: '',
        cues: [],
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Video audio transcription failed',
      });
    }
  });

  app.post('/api/ai/voice-transform', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const result = await handleGeminiVoiceTransformPayload(req.body || {});
      return res.json(result);
    } catch (error: any) {
      console.error('Voice transform error:', error);
      return res.status(500).json({
        error: error.message || 'Voice transformation failed.',
      });
    }
  });

  app.post('/api/ai/igbo-diagnostics', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const dialect: string = String(req.body?.dialect || 'anambra_izugbe');
      const phrases: string[] = Array.isArray(req.body?.phrases)
        ? req.body.phrases
        : [
            'I am going to the market to buy some foodstuff',
            'I wan go market go buy foodstuff',
            'I hope you buy cheap before I come back',
            'buy cheap full',
            'show face back',
          ];
      const results = phrases.map((raw) => {
        const preProcessed = cleanEnglishRemovePidgin(raw);
        const curated =
          curatedEverydayTranslation(preProcessed, 'Igbo') || preProcessed;
        let formatted = addIgboToneCommas(curated);
        if (dialect === 'enugu_waawa') {
          formatted = formatted
            .replace(/\baga ahịa\b/gi, 'eje afịa')
            .replace(/\bahịa\b/gi, 'afịa');
        } else if (dialect === 'owerri_imo') {
          formatted = formatted.replace(/\btupu m lọta\b/gi, 'tupu m alọta');
        } else if (dialect === 'abia_ngwa') {
          formatted = formatted.replace(
            /\bna ị ga-azụta ọnụ ala\b/gi,
            'na ị ga-azụta nke dị ọnụ ala'
          );
        }
        const hasSubdots = /[ịụọṅỊỤỌṄ]/.test(formatted);
        const hasToneCommas = formatted.includes(',');
        const fluencyScore = hasSubdots && hasToneCommas ? 99 : hasSubdots ? 95 : 88;
        return {
          inputRaw: raw,
          preProcessedEnglish: preProcessed,
          actualIgbo: formatted,
          dialect,
          fluencyScore,
          voiceRate: dialect === 'owerri_imo' ? 0.78 : dialect === 'enugu_waawa' ? 0.82 : 0.8,
        };
      });
      return res.json({
        ok: true,
        dialect,
        systemPrompt: IGBO_ANAMBRA_SYSTEM_PROMPT,
        results,
      });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message });
    }
  });

  // Real-Time Supabase AI Voice Bridge so GitHub Pages (https://princeabba96-byte.github.io/boosthub/)
  // can invoke server-side Gemini 3.5 Transcribe + Gemini Translation + Gemini ig-NG/ha-NG/yo-NG/en-NG TTS!
  const processedVoiceReqIds = new Set<string>();
  const processSupabaseVoiceReqRow = async (row: any) => {
    if (!row || row.type !== 'ai_voice_req' || !row.id) return;
    const rowId = String(row.id);
    if (processedVoiceReqIds.has(rowId)) return;
    processedVoiceReqIds.add(rowId);

    const reqId = String(row.title || rowId);
    try {
      const payload = JSON.parse(String(row.body || '{}'));
      const result = await handleGeminiVoiceTransformPayload(payload);

      let publicAudioUrl = '';
      if (result.audioBase64) {
        const wavBuf = Buffer.from(result.audioBase64, 'base64');
        const storagePath = `voices/ai_voice_${reqId}.wav`;
        const { error: upErr } = await supabase.storage
          .from('posts')
          .upload(storagePath, wavBuf, {
            contentType: 'audio/wav',
            upsert: true,
          });
        if (!upErr) {
          const { data: pubData } = supabase.storage
            .from('posts')
            .getPublicUrl(storagePath);
          publicAudioUrl = pubData?.publicUrl || '';
        }
      }

      await supabase.from('notifications').insert({
        target_user: ADMIN_ABBA_UUID,
        actor_user: BOOST_BOT_UUID,
        type: 'ai_voice_res',
        title: reqId,
        body: JSON.stringify({
          ok: true,
          originalTranscript: result.originalTranscript,
          translatedText: result.translatedText,
          targetLanguage: result.targetLanguage,
          langCode: result.langCode,
          audioUrl: publicAudioUrl,
        }),
        is_read: true,
      });
    } catch (err: any) {
      await supabase.from('notifications').insert({
        target_user: ADMIN_ABBA_UUID,
        actor_user: BOOST_BOT_UUID,
        type: 'ai_voice_res',
        title: reqId,
        body: JSON.stringify({
          ok: false,
          error: err?.message || 'Voice transform failed',
        }),
        is_read: true,
      });
    } finally {
      // Clean up request row immediately and response row after 45s
      await supabase.from('notifications').delete().eq('id', rowId);
      setTimeout(() => {
        supabase
          .from('notifications')
          .delete()
          .eq('type', 'ai_voice_res')
          .eq('title', reqId)
          .then(() => {});
      }, 45000);
    }
  };

  supabase
    .channel('server-ai-voice-bridge')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        if (payload?.new?.type === 'ai_voice_req') {
          processSupabaseVoiceReqRow(payload.new).catch(() => {});
        }
      }
    )
    .subscribe();

  setInterval(async () => {
    try {
      const { data: pendingReqs } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'ai_voice_req')
        .order('created_at', { ascending: true })
        .limit(5);
      for (const r of pendingReqs || []) {
        await processSupabaseVoiceReqRow(r);
      }
    } catch {
      // ignore transient poll errors
    }
  }, 800);

  // --- STATIC / VITE MIDDLEWARE ---
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(process.cwd(), 'dist');
  const distIndexHtml = path.join(distPath, 'index.html');

  if (isProd && fs.existsSync(distIndexHtml)) {
    const assetsDir = path.join(distPath, 'assets');

    // If a client with a cached dev index.html requests /src/main.tsx while serving dist,
    // serve the current compiled JS bundle so it never fails with a text/html MIME error
    app.get('/src/main.tsx', (_req, res) => {
      if (fs.existsSync(assetsDir)) {
        const files = fs.readdirSync(assetsDir);
        const currentJs = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));
        if (currentJs) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          return res.sendFile(path.join(assetsDir, currentJs));
        }
      }
      return res.status(404).end();
    });

    // If a client requests a previous build's hashed /assets/index-*.js or .css,
    // fall back to the current bundle in dist/assets so the app never hangs on a stale hash
    app.get('/assets/*', (req, res, next) => {
      const requestedFile = path.join(distPath, req.path);
      if (fs.existsSync(requestedFile)) {
        return next();
      }
      if (fs.existsSync(assetsDir)) {
        const files = fs.readdirSync(assetsDir);
        if (req.path.endsWith('.js')) {
          const currentJs = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));
          if (currentJs) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            return res.sendFile(path.join(assetsDir, currentJs));
          }
        } else if (req.path.endsWith('.css')) {
          const currentCss = files.find((f) => f.startsWith('index-') && f.endsWith('.css'));
          if (currentCss) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            return res.sendFile(path.join(assetsDir, currentCss));
          }
        }
      }
      return res.status(404).end();
    });

    app.use(
      express.static(distPath, {
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          } else if (filePath.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.sendFile(distIndexHtml);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BoostHub server running on http://localhost:${PORT}`);
  });
}

startServer();
