// Centralized app configuration constants.
//
// IMPORTANT: keep ADMIN_EMAIL in sync with firestore.rules.
// Only this email is treated as an admin in production.

export const ADMIN_EMAIL = "arnosbolti@gmail.com";

// Firebase web client config for the production project.
// These values are public by design — security is enforced via Firestore rules,
// not by hiding the apiKey.
export const firebaseConfig = {
  apiKey: "AIzaSyBtZ8_XhVx_fl9jQ33sn4hccPkPC0W4Xqc",
  authDomain: "magic-tissue.firebaseapp.com",
  projectId: "magic-tissue",
  messagingSenderId: "802636203666",
  appId: "1:802636203666:web:e24d0c68710c22cc3ac84b",
  measurementId: "G-C2KWDRKM1K",
};

export const PRODUCT_DOC_ID = "main";
export const PRODUCTS_COLLECTION = "products";
export const ORDERS_COLLECTION = "orders";

// Returns true when the provided email matches the configured admin email
// (case-insensitive, trims whitespace). Mirrors the rule in firestore.rules.
export function isAdminEmail(email) {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
