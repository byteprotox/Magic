import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAnalytics,
  isSupported,
  logEvent as fbLogEvent,
  setUserProperties,
} from "firebase/analytics";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { firebaseConfig } from "./config";

// Initialize the Firebase app exactly once. The web client config is public
// by design — production access is gated by Firestore security
// rules, not by hiding the apiKey.
function ensureApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

const app = ensureApp();

// Eagerly construct the core SDK singletons so any module that imports them
// gets the same instance bound to the single app.
export const auth = getAuth(app);
export const db = getFirestore(app);

// Persist the admin session across reloads in the browser; fall back to
// in-memory persistence during SSR / tests where window is undefined.
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((e) => {
    // Persistence can fail in private-mode browser storage. Fall back silently.
    console.warn("Firebase Auth persistence init failed:", e);
  });
} else {
  setPersistence(auth, inMemoryPersistence).catch(() => {});
}

// -------- Analytics (optional, only when supported in the current env) ----
let analyticsInstance = null;
let initPromise = null;

export function initFirebaseAnalytics() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (typeof window === "undefined") return null;
    try {
      const supported = await isSupported();
      if (!supported) return null;
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    } catch (e) {
      console.warn("Firebase Analytics init failed:", e);
      return null;
    }
  })();
  return initPromise;
}

export async function logEvent(name, params = {}) {
  const analytics = await initFirebaseAnalytics();
  if (!analytics) return;
  try {
    fbLogEvent(analytics, name, params);
  } catch (e) {
    // swallow
  }
}

export async function setUserProps(props) {
  const analytics = await initFirebaseAnalytics();
  if (!analytics) return;
  try {
    setUserProperties(analytics, props);
  } catch (e) {
    // swallow
  }
}

export { app, firebaseConfig };
