import express, { Response } from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
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
} from './src/lib/webPushServer.ts';

dotenv.config();

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
      const detail = await getCommunityDetail(
        Number(req.params.id),
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
      const communityId = Number(req.params.id);
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
        broadcastRealtimeEvent(
          'gift_received',
          {
            senderId: req.user!.uid,
            receiverId,
            itemCode,
            quantity: Number(quantity) || 1,
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

  // --- STATIC / VITE MIDDLEWARE ---
  const distPath = path.join(process.cwd(), 'dist');
  const distIndexHtml = path.join(distPath, 'index.html');

  if (fs.existsSync(distIndexHtml)) {
    const assetsDir = path.join(distPath, 'assets');

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
