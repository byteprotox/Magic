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

## Important security notes

- Do not commit `.env`, service-account JSON, or Firebase CLI tokens.
- Firebase web config is not a server secret, but this repo still reads it from `.env` so you can keep the repository clean/public.
- Firestore rules protect admin actions by checking `/admins/{lowercase-admin-email}`.
- Product image editing uses image URLs instead of Firebase Storage because Storage can require billing depending on project setup.

## Admin URL

- Login: `/admin/login`
- Dashboard: `/admin`

