import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser, getProfileById } from '../db/users.ts';

export interface AuthUserPayload {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

const TOKEN_SECRET = process.env.SESSION_SECRET || 'boosthub-production-hmac-secret-key-2026';

export function signCustomToken(payload: AuthUserPayload): string {
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 14, // 14 days
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(data)
    .digest('base64url');
  return `bh.${data}.${signature}`;
}

export function verifyCustomToken(token: string): AuthUserPayload | null {
  if (!token.startsWith('bh.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, data, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(data)
    .digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const decoded = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch {
    return null;
  }
}

export async function resolveTokenUser(token: string): Promise<AuthUserPayload | null> {
  const custom = verifyCustomToken(token);
  if (custom) {
    return custom;
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || `${decoded.uid}@boosthub.app`,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  const rawToken =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split('Bearer ')[1]
      : queryToken;

  if (!rawToken) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const userPayload = await resolveTokenUser(rawToken);
  if (!userPayload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  try {
    await getOrCreateUser(
      userPayload.uid,
      userPayload.email,
      userPayload.name,
      userPayload.picture
    );
    req.user = userPayload;
    next();
  } catch (error) {
    console.error('Error syncing authenticated user:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const profile = await getProfileById(req.user.uid);
    const isOwnerEmail =
      String(profile?.email || req.user.email || '')
        .trim()
        .toLowerCase() === 'princeabba96@gmail.com';
    if (!profile || !isOwnerEmail || (!profile.isAdmin && profile.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden: Administrator access required' });
    }
    next();
  } catch (error) {
    console.error('Admin verification failed:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
