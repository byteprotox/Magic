# Firebase Hosting + Cloud Run deployment

This project deploys as:

- React frontend on Firebase Hosting
- FastAPI backend on Cloud Run
- Firestore as the database
- Firebase Storage for admin product image uploads
- Firebase Analytics in the frontend

## Required one-time setup

Install CLIs and authenticate:

```bash
npm install -g firebase-tools
firebase login
gcloud auth login
gcloud config set project magic-tissue
```

Enable required services:

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  firestore.googleapis.com \
  firebasehosting.googleapis.com
```

Create or confirm both Firestore and Firebase Storage in the Firebase console for project `magic-tissue`.

## Required secrets

Generate strong values locally. Do not commit them.

```bash
ADMIN_PASSWORD='replace-with-a-strong-admin-password'
ADMIN_TOKEN="$(openssl rand -hex 32)"
```

The previously committed Firebase service account key must be considered exposed. Delete that key in Google Cloud IAM and create a new one only if you need local development credentials. Cloud Run should use Application Default Credentials instead of a JSON key.

## Deploy backend to Cloud Run

```bash
gcloud run deploy magic-tissue-api \
  --source backend \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars ADMIN_PASSWORD="$ADMIN_PASSWORD",ADMIN_TOKEN="$ADMIN_TOKEN",FIREBASE_PROJECT_ID="magic-tissue",FIREBASE_STORAGE_BUCKET="magic-tissue.firebasestorage.app",CORS_ORIGINS="https://magic-tissue.web.app,https://magic-tissue.firebaseapp.com"
```

The backend container listens on the Cloud Run `PORT` env var and initializes Firebase Admin using Cloud Run's default service account. That service account needs permission to read/write Firestore and Storage objects.

## Deploy frontend to Firebase Hosting

The frontend defaults API calls to `/api`; Firebase Hosting rewrites `/api/**` to the Cloud Run service configured in `firebase.json`.

```bash
cd frontend
yarn install
yarn build
cd ..
firebase deploy --only hosting
```

## Verify production

```bash
curl https://magic-tissue.web.app/api/product
```

Then open:

- `https://magic-tissue.web.app/`
- `https://magic-tissue.web.app/admin/login`

Submit a test order from the landing page, log into admin, confirm the order appears, then delete the test order.
Upload a product image from `/admin` → Product Editor → Product Images, save the product, and confirm the image renders on the landing page.

## Local backend credentials

For local development only, put a fresh service account key at `backend/secrets/firebase-admin.json` or set `FIREBASE_CREDENTIALS_PATH`. The `backend/secrets/` directory is ignored and excluded from Docker builds.
