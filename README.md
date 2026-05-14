# Magic Tissue Firebase Storefront

A React/Firebase clone of `magic-tissue.web.app` with the same landing-page layout, Bengali copy, animated ticker/countdown/reveal effects, product image grid, package selector, COD order form, admin login, order management, landing-page editor, Firestore storage, and Meta/Facebook Pixel support.

## Stack

- React + Tailwind on Firebase Hosting
- Firestore for product content and orders
- Firebase Authentication email/password for admin login
- Firebase Analytics optional via `REACT_APP_FIREBASE_MEASUREMENT_ID`
- Meta Pixel via `REACT_APP_META_PIXEL_ID` or the admin product editor

No backend, Cloud Functions, Cloud Run, Firebase Storage, service-account JSON, or billing-only Firebase APIs are required.

## Local setup

```bash
cd frontend
cp .env.example .env
# fill in your Firebase web app values and admin email
npm install
npm start
```

The public landing page can render with fallback product data before Firebase is configured. Orders/admin require a real Firebase project and `.env` values.

## Deploy from Firebase/Google Cloud Shell

Use these steps if you want to do the whole deploy from the browser with Cloud Shell.

### 1. Create the Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a project, or open the project you want to use.
3. Project Overview → **Web app** (`</>`) → register an app.
4. Copy the Firebase config values. You will paste them into `.env` in step 4.
5. Build → **Authentication** → Sign-in method → enable **Email/Password**.
6. Authentication → Users → **Add user**. This is your admin login email/password.
7. Build → **Firestore Database** → Create database → start in **production mode**.

Do not enable Firebase Storage, Cloud Functions, Cloud Run, or any paid Cloud API. This project does not need them.

### 2. Open Cloud Shell

From Firebase Console or Google Cloud Console, click the Cloud Shell terminal icon. Then run:

```bash
gcloud config set project YOUR_FIREBASE_PROJECT_ID
```

Replace `YOUR_FIREBASE_PROJECT_ID` with your Firebase project ID.

### 3. Clone this repo in Cloud Shell

```bash
git clone https://github.com/byteprotox/Magic.git
cd Magic
git checkout capy/secrets-env-cleanup
```

If this branch becomes your default branch later, the `git checkout` line is not needed.

### 4. Create `frontend/.env`

```bash
cd frontend
cp .env.example .env
nano .env
```

Your terminal prompt should now end with `/Magic/frontend`. If it still shows only `/Magic`, run `cd frontend` before continuing.

Paste/fill your values:

```bash
REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
REACT_APP_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
REACT_APP_ADMIN_EMAIL=your-admin-email@example.com
REACT_APP_META_PIXEL_ID=YOUR_META_PIXEL_ID
```

Notes:

- Use `REACT_APP_...` exactly. Do **not** use `VITE_FIREBASE_...`; this is not a Vite app.
- `REACT_APP_FIREBASE_MEASUREMENT_ID` is optional if you did not enable Google Analytics.
- `REACT_APP_META_PIXEL_ID` is optional here because you can also add it later in the admin panel.
- Save in nano with `Ctrl+O`, press `Enter`, then exit with `Ctrl+X`.
- Never commit `.env`. It is already gitignored.

### 5. Add yourself to the Firestore admin allowlist

In Firebase Console → Firestore Database:

1. Start collection: `admins`
2. Document ID: your admin email in lowercase, for example `you@example.com`
3. Add field: `role` = `owner`
4. Save

This document is required because Firestore rules only allow admin reads/writes when `/admins/{your-email}` exists.

### 6. Build the frontend

Back in Cloud Shell:

```bash
pwd
# must print something ending in /Magic/frontend
npm install
npm run build
cd ..
test -d frontend/build && echo "Build folder exists"
```

If `npm run build` says `Missing script: "build"`, you are in the wrong folder. Run:

```bash
cd ~/Magic/frontend
npm run build
cd ..
```

### 7. Deploy Hosting + Firestore rules

```bash
firebase login --no-localhost
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy
```

The deploy publishes:

- Firebase Hosting from `frontend/build`
- Firestore security rules from `firestore.rules`
- Firestore indexes from `firestore.indexes.json`

If `firebase` is not installed in Cloud Shell, run this once:

```bash
npm install -g firebase-tools
```

### 8. Test after deploy

1. Open `https://YOUR_FIREBASE_PROJECT_ID.web.app/`.
2. Submit a test order from the landing page.
3. Open `https://YOUR_FIREBASE_PROJECT_ID.web.app/admin/login`.
4. Login with the Firebase Auth admin user you created.
5. Check **Orders** for the test order.
6. Open **Product**, edit landing-page content/images/packages/Pixel ID, save, then reload the public page.

### Common Cloud Shell fixes

- **`npm error Missing script: "build"`**: you ran `npm run build` from `~/Magic`. Run `cd ~/Magic/frontend`, then `npm run build`, then `cd ..` before `firebase deploy`.
- **`Directory 'frontend/build' for Hosting does not exist`**: the frontend was not built. Run `cd ~/Magic/frontend && npm install && npm run build && cd ..`, then deploy again.
- **Site still uses old Firebase values**: your env file must be `frontend/.env` and variable names must start with `REACT_APP_`, not `VITE_`.
- **Permission denied in admin panel**: check the Firestore doc path is exactly `admins/your-admin-email@example.com`, lowercase.
- **Firebase project not found**: run `firebase projects:list`, then `firebase use PROJECT_ID`.
- **Blank site after deploy**: confirm every required `REACT_APP_FIREBASE_*` value exists in `frontend/.env`, then rebuild with `npm run build` and deploy again.
- **Orders not saving**: deploy rules again with `firebase deploy --only firestore:rules` and confirm Firestore Database exists.

## Important security notes

- Do not commit `.env`, service-account JSON, or Firebase CLI tokens.
- Firebase web config is not a server secret, but this repo still reads it from `.env` so you can keep the repository clean/public.
- Firestore rules protect admin actions by checking `/admins/{lowercase-admin-email}`.
- Product image editing uses image URLs instead of Firebase Storage because Storage can require billing depending on project setup.

## Admin URL

- Login: `/admin/login`
- Dashboard: `/admin`
