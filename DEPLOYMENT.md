# Deployment — Firebase Spark / no-billing

This project is deployable on the **Firebase free (Spark) plan** without Cloud Run, Cloud Build, Google Cloud billing, or Firebase Storage:

- React frontend on **Firebase Hosting**
- **Firestore** for products and orders, called directly from the browser
- **Firebase Authentication** email/password for admin login
- **Firebase Analytics** for page/event tracking

Product images are stored as normal image URLs in the product document. Because Firebase Storage requires billing for this project, the admin editor supports adding image URLs instead of uploading files.

> **No Cloud Run / no Cloud Build / no FastAPI backend is required in production.**
> The FastAPI server under `backend/` is preserved only for local development and is not invoked in production.

## 1. One-time CLI setup

```bash
npm install -g firebase-tools
firebase login
firebase use magic-tissue
```

You do **not** need `gcloud`, billing, Cloud Run, Cloud Build, or Storage.

## 2. One-time Firebase Console setup

In the [Firebase Console](https://console.firebase.google.com/project/magic-tissue) on the Spark plan:

1. **Build → Authentication → Sign-in method**
   - Enable **Email/Password**.
2. **Build → Authentication → Users → Add user**
   - Email: `arnosbolti@gmail.com`
   - Password: pick a strong password.
   - This single account is the only admin account. The allowed email is mirrored in `frontend/src/lib/config.js` and `firestore.rules`.
3. **Build → Firestore Database → Create database**
   - Start in **production mode**.
   - Rules will be replaced by `firestore.rules` on deploy.
4. **Build → Hosting**
   - No manual setup is required if you deploy with the Firebase CLI.

Skip **Storage**. It is not required for this no-billing deployment.

## 3. Deploy

From the repo root:

```bash
cd frontend
yarn install
yarn build
cd ..
firebase deploy
```

The deploy will publish:

- Firebase Hosting site: `magic-tissue.web.app` / `magic-tissue.firebaseapp.com`
- Firestore rules from `firestore.rules`
- Firestore indexes from `firestore.indexes.json`

You can deploy each piece individually if needed:

```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 4. Verify

Visit:

- `https://magic-tissue.web.app/` — landing page should render. If Firestore is empty, the app shows seeded default content. Submit a test order.
- `https://magic-tissue.web.app/admin/login` — log in with `arnosbolti@gmail.com` and the password you set in Firebase Auth.
- In admin:
  - **Orders** — confirm the test order appears, change status, then delete it.
  - **Product** — edit text or paste image URLs under Product Images, click **Save All Changes**, then reload the landing page.

Terminal smoke check:

```bash
curl -sI https://magic-tissue.web.app/ | head -1
curl -s "https://firestore.googleapis.com/v1/projects/magic-tissue/databases/(default)/documents/products/main" | head -20
```

## 5. Updating the admin email

The admin allowlist is in two files:

- `frontend/src/lib/config.js` — `ADMIN_EMAIL`
- `firestore.rules` — `adminEmail()`

To change the admin:

1. Create the new admin user in Firebase Auth → Users.
2. Update both files with the new email.
3. Re-run `yarn build` in `frontend/` and `firebase deploy`.

## 6. Security model

| Resource | Public | Admin (`arnosbolti@gmail.com`) |
| --- | --- | --- |
| `products/main` | read | read, create, update, delete |
| `orders/*` | create validated orders | read, update, delete |
| All other Firestore paths | denied | denied |

Order creation is validated in Firestore rules: required fields, phone ≥6 chars, address ≥3 chars, `status == 'pending'`, sensible numeric bounds, `delivery_area` ∈ `{inside_dhaka, outside_dhaka}`, and payload `id` must match the Firestore document ID.

The Firebase web `apiKey` in `frontend/src/lib/config.js` is public by design. Access is controlled by Firestore rules, not by hiding the key. Never commit a Firebase service-account JSON to the repo.
