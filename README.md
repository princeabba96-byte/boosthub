# BoostHub — Full-Stack Social Media & Creator Platform

BoostHub is a full-stack social media, short-form vertical video (**Capshots**), 24-hour stories, real-time messaging, creator missions, and community platform built with React 19, TypeScript, Tailwind CSS, Express, Drizzle ORM, and PostgreSQL.

## Key Features
- **Personalized Home Feed & Capshots**: Vertical short videos, photo/text posts, watch-time scoring, likes, shares, threaded comments, and saved bookmarks.
- **Profile Picture Selection & Facebook-Style Avatars**: Choose or upload a profile picture right on Sign-In / Sign-Up, displayed across Account headers, navigation bars, feeds, and Direct Messages.
- **Real-Time Direct Messaging & BOOST BOT**: Instant messaging with photo/video attachments, reactions, typing indicators, and official **BOOST BOT** admin broadcasts (to all users or selected users) formatted with `BOOST BOT` on top and the message below.
- **Native Phone Notification Tray Alerts (Web Push + PWA)**: Service Worker (`public/sw.js`) and VAPID Web Push integration so notifications appear in your phone's system notification tray even when the browser is in the background.
- **Creator Studio & Admin Moderation Console**: Real-time analytics, XP/Boost Points missions, user verification, role management, and content moderation.

## Getting Started Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and set your PostgreSQL `DATABASE_URL`:
   ```bash
   cp .env.example .env
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

4. **Production build & start**:
   ```bash
   npm run build
   npm start
   ```
