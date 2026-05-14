// Centralized app configuration constants. All deployment-specific values come
// from .env so the repository can stay public-safe.

export const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "";

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "",
};

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

export const PRODUCT_DOC_ID = "main";
export const PRODUCTS_COLLECTION = "products";
export const ORDERS_COLLECTION = "orders";

// Returns true when the provided email matches the configured admin email
// (case-insensitive, trims whitespace). Mirrors the rule in firestore.rules.
export function isAdminEmail(email) {
  if (!ADMIN_EMAIL) return true;
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
