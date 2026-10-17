# Vibely — Full-Stack Firebase + Cloudflare Pages Social App

Vibely is a React 19 + Vite + Tailwind CSS v4 social application connected end-to-end to **Firebase Authentication**, **Cloud Firestore**, and **Firebase Storage** (with **Cloudinary** and client-side compressed Data URL fallbacks), pre-configured for **Cloudflare Pages** hosting.

## Connected Features & Firestore Collections

1. **Authentication & Profiles (`users/{uid}` & `profiles/{uid}`)**:
   - Email/Password registration, login, password update, and password reset via Firebase Auth.
   - Public discoverable profiles (`profiles/{uid}`) and private user settings (`users/{uid}`) with real-time online status and current Vibe status selector.
2. **Real-Time Chats (`chats/{chatId}` & `chats/{chatId}/messages/{messageId}`)**:
   - Start 1-on-1 Direct Chats or multi-member Group Chats from the Messages screen or Discover page.
   - Real-time `onSnapshot` listeners, photo attachments, voice note recording with AI transcripts, interactive live polls (`castPollVote` transactions), message translations, emoji reactions, disappearing message mode, and chat search/filtering.
3. **Vibe Stories (`stories/{storyId}`)**:
   - Upload photo stories with captions and vibe tags, track story views (`viewedBy`), like stories (`likedBy` / `likes`), delete own stories, and reply to stories (automatically delivers the reply to a 1-on-1 Firestore chat with the story author).
4. **Private Circles (`circles/{circleId}`)**:
   - Create custom Private Circles, join/leave circles, invite/add members from Firestore profiles, browse circle-specific Moments, and open a dedicated Circle Group Chat.
5. **Shared Moments (`moments/{momentId}`)**:
   - Upload Moments to the public feed or a specific Circle, filter by Circle, like moments (`likedBy` / `likes`), post and read comments (`commentsList`), delete own moments, or report moments to moderators (`reports/{reportId}`).
6. **Discover & Mood Match (`profiles` & `connections/{connectionId}`)**:
   - Filter community members by Vibe (`💻 Coding`, `☕ Coffee`, `🎧 Music`, `✈️ Travel`, `🔥 Focused`, `😴 Tired`, or `Same Vibe as Me`), send connection requests, accept/decline incoming requests, or launch a direct chat immediately.
7. **Real-Time Notifications (`notifications/{notificationId}`)**:
   - Live notification feed for connection requests, story likes/replies, circle invitations, and moment likes/comments.
8. **Starred Messages & Settings (`users/{uid}`)**:
   - Bookmark/star messages across chats (synced to Firestore `users/{uid}.savedMessages` and `localStorage`) and persist Privacy, Notification, Security, and Storage preferences to Firestore.
9. **1-Click Sample Data Seeder**:
   - Click **"Seed Sample Firebase Data"** on the Home Dashboard or in **Settings → Seed Demo Data** to populate `profiles`, `circles`, `stories`, `moments`, `chats`, and `connections` in your Firestore database.

## 1. Firebase Setup (`vibely-1d289`)

1. In the [Firebase Console](https://console.firebase.google.com/), open project **`vibely-1d289`**.
2. **Authentication**: Go to **Build → Authentication → Sign-in method** and enable **Email/Password**. Also add your Cloudflare Pages domain (e.g. `vibely.pages.dev`) under **Authentication → Settings → Authorized domains**.
3. **Cloud Firestore**: Go to **Build → Firestore Database → Rules** and paste the contents of `firestore.rules` (or run `npx firebase deploy --only firestore`), then click **Publish**.
4. **Storage**: Go to **Build → Storage → Rules** and paste the contents of `storage.rules` (or run `npx firebase deploy --only storage`). If Firebase Storage is not enabled on your plan, Vibely automatically falls back to Cloudinary (`src/cloudinaryConfig.js`) and compressed Data URLs so uploads still work out of the box.

## 2. Cloudflare Pages Deployment

This project includes `wrangler.toml`, `public/_redirects` (for SPA routing), and `public/_headers`.

### Option A: Git Integration (Cloudflare Dashboard)
1. Push this repository to GitHub/GitLab and connect it in **Cloudflare Dashboard → Workers & Pages → Create → Pages**.
2. Set the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Under **Settings → Environment variables**, add the variables from `.env.example` (already defaulted in `firebase.js` and `wrangler.toml`).

### Option B: Direct CLI Deploy via Wrangler
```bash
npm install
npm run build
npx wrangler pages deploy dist --project-name vibely
```
