# Firebase Spark deployment guide

This app is built for Firebase's free Spark plan:

- Firebase Hosting serves the React build.
- Firestore stores orders and editable landing-page content.
- Firebase Auth handles admin login.
- Meta Pixel runs in the browser for ads tracking.

## 1. Create Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Create a project or select an existing project.
3. Add a Web App and copy the Firebase web config values.
4. Build → Authentication → Sign-in method → enable **Email/Password**.
5. Authentication → Users → add your admin user.
6. Build → Firestore Database → create database in **production mode**.

## 2. Configure environment variables

Create `frontend/.env` from the example:

```bash
cd frontend
cp .env.example .env
```

Fill these values from Firebase Project Settings → Your apps → Web app config:

```bash
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=... # optional
REACT_APP_ADMIN_EMAIL=you@example.com
REACT_APP_META_PIXEL_ID=... # optional; can also be set in admin panel
```

`frontend/.env` is gitignored. Keep it local or in your hosting/build environment only.

## 3. Add the Firestore admin allowlist doc

Firestore rules treat a signed-in user as admin only if this document exists:

```text
admins/{lowercase-admin-email}
```

Example for `you@example.com`:

1. Firestore Database → Start collection.
2. Collection ID: `admins`.
3. Document ID: `you@example.com`.
4. Add any harmless field, for example `role` = `owner`.
5. Save.

The Firebase Console can create this first admin document even though client writes to `/admins` are blocked by rules.

## 4. Install and build

```bash
cd frontend
npm install
npm run build
cd ..
```

## 5. Select Firebase project and deploy

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy
```

The deploy publishes:

- Hosting from `frontend/build`
- Firestore rules from `firestore.rules`
- Firestore indexes from `firestore.indexes.json`

To deploy separately:

```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 6. Verify after deploy

1. Open your Hosting URL, for example `https://your-project-id.web.app/`.
2. Submit a test order from the landing page.
3. Open `/admin/login` and sign in with the Firebase Auth admin user.
4. Confirm the order appears in **Orders**.
5. Open **Product**, edit text/images/packages/Facebook Pixel ID, save, and reload the landing page.

## 7. Facebook/Meta Pixel setup

From Meta Events Manager, create/select a Pixel and copy the Pixel ID. You can add it either way:

- Put it in `REACT_APP_META_PIXEL_ID` before build, or
- Log into `/admin`, open **Product**, paste it into **Facebook Pixel ID**, and save.

The app loads the standard Meta Pixel base script, tracks `PageView`, tracks `InitiateCheckout` when a visitor clicks an order CTA, and tracks `Purchase` when an order is submitted.
