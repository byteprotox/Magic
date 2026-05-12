# PRD — Smart Pen Knife (স্মার্ট পেন নাইফ) Landing + Admin

## Original Problem Statement
User requested a Bengali single-product landing page for "Smart Pocket Knife" inspired by https://nooranishop.com/step/forged-mini-fruit-knife/ and structured like their existing site https://blade-x.vercel.app/. Needs an admin panel to manage orders and product details. Bengali (Bangla) language, Cash on Delivery only. Pricing: 1pc ৳690, 2pc ৳1190 (popular), 3pc ৳1590. Delivery: ৳60 inside Dhaka, ৳110 outside.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB), single-collection products, orders collection. Bearer-token admin auth (env-based password+token).
- **Frontend**: React 19 + react-router-dom v7 + Tailwind + Shadcn UI base + lucide-react icons + recharts + sonner toasts.
- **Fonts**: Hind Siliguri (Bengali) + Chivo (English display).
- **Theme**: Dark (#0a0a0a) with orange accent (#ff5722); CSS variables.

## User Personas
1. **Bengali consumer (mobile-first)** — lands from FB ad, scans product, selects package, fills name/phone/address, submits COD order.
2. **Store admin** — logs in at `/admin/login`, views dashboard stats + 7-day chart, manages orders (status updates, delete), edits product (title, packages, prices, images, FAQs).

## Core Requirements (Static)
- Bengali landing with: hero+countdown, gallery, trust badges, why-use, packages, order form with auto-total, how-it-works, why-choose-us, reviews, FAQ, sticky mobile bar.
- Admin: password-only login → dashboard (stats+chart) / orders (filter+status+delete) / product editor (basic info, contact/delivery, packages, images, features).
- COD only. MongoDB persistence. All `/api` prefixed.

## What's Been Implemented (2026-12)
- Backend models: Product, Package, Review, FAQItem, Order with full CRUD + admin auth.
- Endpoints: `/api/product`, `/api/orders`, `/api/admin/login`, `/api/admin/verify`, `/api/stats`.
- Default product seeded on startup (Bengali content for Smart Pen Knife with 3 packages, 4 reviews, 5 FAQs, real product images from nooranishop CDN).
- Frontend Landing.jsx: full Bengali landing with 11 sections, IntersectionObserver reveal animations, countdown timer.
- Frontend AdminLogin.jsx + AdminDashboard.jsx: 3-tab admin (Dashboard with recharts area chart, Orders table with inline status select + delete, Product editor with packages/images/features lists).
- Admin auth via localStorage Bearer token. Toast feedback via sonner.
- Testing: 18/18 backend tests passing; all e2e frontend flows verified.

## Test Credentials
- Admin credentials are environment-specific and must be supplied through `ADMIN_PASSWORD` and `ADMIN_TOKEN`.
- Do not commit production credentials or service account keys to this repository.

## Backlog / Next Tasks
**P1**:
- Order CSV export for admin
- Phone number validation (BD format strict)
- Image upload (currently URL-only) — integrate Cloudinary or similar
- bKash/Nagad payment number display option

**P2**:
- Multi-product support (extend Product model to list)
- FB Pixel / Google Tag for conversion tracking
- Abandoned-cart reminder (capture phone earlier and SMS follow-up via Twilio)
- Order detail modal with full address copy button
- Reviews/FAQ inline editor in admin (currently static after seed)
- Migrate FastAPI startup/shutdown to lifespan context manager
- Rate-limit admin login

**P3**:
- Multi-admin with roles
- Order notes/timeline
- Variant pricing (color/size)
