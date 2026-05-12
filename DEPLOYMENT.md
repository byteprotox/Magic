# Deployment — Firebase Spark / no-billing

This project is deployable entirely on the **Firebase free (Spark) plan**:

- React frontend on **Firebase Hosting**
- **Firestore** for products & orders (called directly from the browser)
- **Firebase Storage** for product images (uploaded directly from the admin editor)
- **Firebase Authentication** (email/password) for admin login
- **Firebase Analytics** for page/event tracking

> **No Cloud Run / no Cloud Build / no FastAPI backend is required in production.**
> The FastAPI server under `backend/` is preserved only for local development;
> it is **not** invoked in production. See [Optional: local FastAPI backend](#optional-local-fastapi-backend) below.

---

## 1. One-time CLI setup

```bash
npm install -g firebase-tools
firebase login
firebase use magic-tissue   # project id is set in .firebaserc
```

You do **not** need `gcloud` or to enable billing/Cloud Run.

## 2. One-time Firebase Console setup

In the [Firebase Console](https://console.firebase.google.com/project/magic-tissue) (free / Spark plan):

1. **Build → Authentication → Get started → Sign-in method**
   - Enable **Email/Password** (the basic option, not the passwordless link).
2. **Build → Authentication → Users → Add user**
   - Email: `arnosbolti@gmail.com`
   - Password: pick a strong password (store in your password manager).
   - This single account is the only one allowed to act as admin.
     The allowed email is centralized in
     [`frontend/src/lib/config.js`](frontend/src/lib/config.js) (`ADMIN_EMAIL`) and
     mirrored in [`firestore.rules`](firestore.rules) and [`storage.rules`](storage.rules).
     If you ever change it, update **all three** locations together.
3. **Build → Firestore Database → Create database**
   - Start in **production mode**. Region: any (asia-south1 / us-central etc.).
   - Rules will be replaced by `firestore.rules` on the next deploy.
4. **Build → Storage → Get started**
   - Choose the default bucket `magic-tissue.firebasestorage.app`.
   - Rules will be replaced by `storage.rules` on the next deploy.

That's all the manual setup needed.

## 3. Deploy

Build the frontend and deploy Hosting + Firestore rules + Storage rules in one step:

```bash
cd frontend
yarn install
yarn build
cd ..
firebase deploy --only hosting,firestore:rules,storage
```

The first deploy will:

- Push the production React bundle to Firebase Hosting (`magic-tissue.web.app`, `magic-tissue.firebaseapp.com`).
- Activate [`firestore.rules`](firestore.rules) (public read of `products/main`,
  public create of validated orders, admin-only everything else).
- Activate [`storage.rules`](storage.rules) (public read of `product-images/**`,
  admin-only writes capped at 5MB image uploads).

You can deploy each piece individually if you only changed one:

```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 4. Verify

Visit:

- `https://magic-tissue.web.app/` — landing page should render. If Firestore is empty,
  it shows seeded default content. Submit a test order from the order form.
- `https://magic-tissue.web.app/admin/login` — log in with `arnosbolti@gmail.com` and the
  password you set in step 2.
- In the admin dashboard:
  - **Orders** — your test order should appear; change its status, then delete it.
  - **Product** — open the Product Editor, upload an image under "Product Images"
    (it goes to Firebase Storage), tweak any text, click **Save All Changes**.
    Reload the landing page to confirm the new content renders.

You can also smoke-check from a terminal:

```bash
# Hosting is up
curl -sI https://magic-tissue.web.app/ | head -1

# Product doc is readable without auth (Firestore REST)
curl -s "https://firestore.googleapis.com/v1/projects/magic-tissue/databases/(default)/documents/products/main" | head -20
```

## 5. Updating the admin email

The admin allowlist is centralized in **three** files:

- `frontend/src/lib/config.js` — `ADMIN_EMAIL`
- `firestore.rules` — `adminEmail()`
- `storage.rules` — `adminEmail()`

To change the admin:

1. Create the new admin user in Firebase Auth → Users.
2. Update all three files with the new email (case-insensitive — rules use `.lower()`).
3. Re-run `yarn build` in `frontend/` and `firebase deploy --only hosting,firestore:rules,storage`.

## 6. Security model

| Resource | Public | Admin (`arnosbolti@gmail.com`) |
| --- | --- | --- |
| `products/main` (Firestore) | read | read, create, update, delete |
| `orders/*` (Firestore) | create (validated) | read, update, delete |
| `product-images/**` (Storage) | read | upload (≤5MB images), delete |
| All other Firestore paths | denied | denied |
| All other Storage paths | denied | denied |

Order creation is validated server-side (in Firestore rules): required fields, phone ≥6 chars,
address ≥3 chars, `status == 'pending'`, sensible numeric bounds, and `delivery_area` ∈
`{inside_dhaka, outside_dhaka}`. The same checks run client-side for nicer UX.

> The Firebase web `apiKey` in `frontend/src/lib/config.js` is **public by design**.
> It is not a secret; access is gated by the rules above, not by hiding the key.
> Never commit a Firebase **service account** JSON to the repo (see `.gitignore`).

## Optional: local FastAPI backend

The `backend/` FastAPI service is **only** for local development and is **not deployed**.
If you need to run it locally against Firestore:

```bash
cd backend
pip install -r requirements.txt

# Set local admin secrets (any values — only used by your local box)
export ADMIN_PASSWORD='choose-something'
export ADMIN_TOKEN="$(openssl rand -hex 32)"
export FIREBASE_PROJECT_ID=magic-tissue
export FIREBASE_STORAGE_BUCKET=magic-tissue.firebasestorage.app

# For Firestore access, place a service account key at backend/secrets/firebase-admin.json
# (ignored by git). Production does NOT need this — the browser SDK uses the user's auth.

uvicorn server:app --reload --port 8001
```

The production frontend ignores `REACT_APP_BACKEND_URL` because it no longer makes REST calls;
all data access goes through the Firebase Web SDK.

---

## Rollback

```bash
# Roll back hosting to the previous release from the Hosting → Release History UI,
# or via CLI:
firebase hosting:clone magic-tissue:live magic-tissue:live --version <previous-version-id>

# Rules can be reverted by checking out the previous firestore.rules / storage.rules
# and re-running:
firebase deploy --only firestore:rules,storage
```
