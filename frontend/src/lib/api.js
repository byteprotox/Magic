// Firebase-backed API layer for Magic Tissue.
//
// In production (Firebase Spark / no-billing), the frontend talks directly
// to Firestore and Firebase Auth — no Cloud Run / FastAPI
// server is required. The exported function names and return shapes mirror
// the legacy REST API so the rest of the React app is unchanged.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { auth, db } from "./firebase";
import {
  ADMIN_EMAIL,
  hasFirebaseConfig,
  ORDERS_COLLECTION,
  PRODUCTS_COLLECTION,
  PRODUCT_DOC_ID,
  isAdminEmail,
} from "./config";
import { mergeWithDefault } from "./defaultProduct";

// -------- Helpers --------
function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // RFC4122-ish fallback for very old browsers.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowIso() {
  return new Date().toISOString();
}

function productRef() {
  return doc(db, PRODUCTS_COLLECTION, PRODUCT_DOC_ID);
}

function ordersRef() {
  return collection(db, ORDERS_COLLECTION);
}

function orderRef(id) {
  return doc(db, ORDERS_COLLECTION, id);
}

function adminRef(email) {
  return doc(db, "admins", String(email || "").trim().toLowerCase());
}

// Strip undefined values (Firestore rejects undefined) and normalize numeric
// fields that may have come from <input type="number"> as strings.
function cleanForFirestore(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined) continue;
    out[k] = v;
  }
  return out;
}

// -------- Product --------
export async function getProduct() {
  if (!hasFirebaseConfig) {
    return mergeWithDefault({ id: PRODUCT_DOC_ID });
  }
  const snap = await getDoc(productRef());
  if (!snap.exists()) {
    // Surface a sensible default so the landing page renders before an admin
    // has saved any data. Once the admin saves once, this fallback is no
    // longer used.
    return mergeWithDefault({ id: PRODUCT_DOC_ID });
  }
  return mergeWithDefault({ id: PRODUCT_DOC_ID, ...snap.data() });
}

export async function updateProduct(payload) {
  if (!hasFirebaseConfig) {
    throw new Error("Firebase is not configured. Add frontend/.env before saving product data.");
  }
  const data = cleanForFirestore({
    ...payload,
    id: PRODUCT_DOC_ID,
    updated_at: nowIso(),
    updated_at_ts: serverTimestamp(),
  });
  // merge so the admin can save partial updates without losing other fields,
  // and so the document is created on first save.
  await setDoc(productRef(), data, { merge: true });
  return getProduct();
}

// -------- Orders --------
function buildOrderDoc(payload) {
  const id = uuid();
  return {
    id,
    name: (payload.name || "").toString(),
    phone: (payload.phone || "").toString(),
    address: (payload.address || "").toString(),
    note: (payload.note || "").toString(),
    package_id: (payload.package_id || "").toString(),
    package_name: (payload.package_name || "").toString(),
    package_price: Number(payload.package_price) || 0,
    quantity: Number(payload.quantity) || 1,
    delivery_area: payload.delivery_area === "outside_dhaka"
      ? "outside_dhaka"
      : "inside_dhaka",
    delivery_charge: Number(payload.delivery_charge) || 0,
    total: Number(payload.total) || 0,
    status: "pending",
    created_at: nowIso(),
  };
}

export async function createOrder(payload) {
  if (!hasFirebaseConfig) {
    throw new Error("Firebase is not configured. Add frontend/.env before accepting orders.");
  }
  // Frontend-side validation mirrors the legacy FastAPI checks. Firestore
  // security rules apply the same checks server-side.
  if (!payload || !payload.phone || payload.phone.trim().length < 6) {
    const err = new Error("Phone number is required");
    err.response = { data: { detail: "Phone number is required" } };
    throw err;
  }
  if (!payload.address || payload.address.trim().length < 3) {
    const err = new Error("Address is required");
    err.response = { data: { detail: "Address is required" } };
    throw err;
  }

  const order = buildOrderDoc(payload);
  await setDoc(orderRef(order.id), order);
  return order;
}

export async function listOrders() {
  if (!hasFirebaseConfig) return [];
  const q = query(ordersRef(), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

export async function updateOrderStatus(id, status) {
  if (!hasFirebaseConfig) {
    throw new Error("Firebase is not configured.");
  }
  const allowed = new Set([
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ]);
  if (!allowed.has(status)) {
    const err = new Error("Invalid status");
    err.response = { data: { detail: "Invalid status" } };
    throw err;
  }
  await updateDoc(orderRef(id), { status });
  const snap = await getDoc(orderRef(id));
  return snap.data();
}

export async function deleteOrder(id) {
  if (!hasFirebaseConfig) {
    throw new Error("Firebase is not configured.");
  }
  await deleteDoc(orderRef(id));
  return { ok: true };
}

// -------- Stats (computed client-side from orders) --------
function startsWithDate(iso, dayStr) {
  return typeof iso === "string" && iso.startsWith(dayStr);
}

export async function getStats() {
  const orders = await listOrders();

  const total_orders = orders.length;
  const total_revenue = orders.reduce(
    (sum, o) => (o.status !== "cancelled" ? sum + (Number(o.total) || 0) : sum),
    0
  );
  const count = (status) =>
    orders.reduce((n, o) => (o.status === status ? n + 1 : n), 0);
  const pending = count("pending");
  const confirmed = count("confirmed");
  const shipped = count("shipped");
  const delivered = count("delivered");
  const cancelled = count("cancelled");

  // Last 7 days (UTC). Mirror server format: day key is YYYY-MM-DD.
  const todayUtc = new Date();
  const daily = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(
      Date.UTC(
        todayUtc.getUTCFullYear(),
        todayUtc.getUTCMonth(),
        todayUtc.getUTCDate() - i
      )
    );
    const dayStr = d.toISOString().slice(0, 10);
    let dayOrders = 0;
    let dayRevenue = 0;
    for (const o of orders) {
      if (!startsWithDate(o.created_at, dayStr)) continue;
      dayOrders += 1;
      if (o.status !== "cancelled") dayRevenue += Number(o.total) || 0;
    }
    daily.push({ date: dayStr, orders: dayOrders, revenue: dayRevenue });
  }

  return {
    total_orders,
    total_revenue,
    pending,
    confirmed,
    shipped,
    delivered,
    cancelled,
    daily,
  };
}

// -------- Auth (Firebase Auth) --------
export async function adminLogin(email, password) {
  if (!hasFirebaseConfig) {
    const err = new Error("Firebase is not configured. Add frontend/.env first.");
    err.code = "auth/not-configured";
    throw err;
  }
  const trimmed = (email || "").trim();
  if (!trimmed || !password) {
    const err = new Error("Email and password are required");
    err.code = "auth/invalid-input";
    throw err;
  }
  if (!isAdminEmail(trimmed)) {
    const err = new Error("Only the configured admin can sign in");
    err.code = "auth/not-admin";
    throw err;
  }
  const cred = await signInWithEmailAndPassword(auth, trimmed, password);
  if (!isAdminEmail(cred.user?.email)) {
    // Defensive: sign back out if Firebase returned a non-admin account.
    await signOut(auth).catch(() => {});
    const err = new Error("Account is not authorized as admin");
    err.code = "auth/not-admin";
    throw err;
  }
  const allowlistSnap = await getDoc(adminRef(cred.user.email));
  if (!allowlistSnap.exists()) {
    await signOut(auth).catch(() => {});
    const err = new Error(`Admin allowlist document is missing: admins/${cred.user.email.toLowerCase()}`);
    err.code = "auth/not-admin-allowlisted";
    throw err;
  }
  return { user: cred.user, email: cred.user.email };
}

export async function adminLogout() {
  await signOut(auth);
}

// Returns true when an admin is currently signed in. Resolves after Firebase
// Auth has finished restoring its persisted state on first call.
export function adminVerify() {
  if (!hasFirebaseConfig) {
    const err = new Error("Firebase is not configured");
    err.code = "auth/not-configured";
    return Promise.reject(err);
  }
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        unsub();
        if (user && isAdminEmail(user.email)) {
          resolve({ ok: true, email: user.email });
        } else {
          const err = new Error("Not authenticated");
          err.code = "auth/not-authenticated";
          reject(err);
        }
      },
      (err) => {
        unsub();
        reject(err);
      }
    );
  });
}

// Subscribe to admin auth-state changes. Returns the Firebase unsubscribe fn.
export function onAdminAuthState(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user && isAdminEmail(user.email) ? user : null);
  });
}

// Re-export so callers can read the admin email without importing config.
export { ADMIN_EMAIL };
