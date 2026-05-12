import { initializeApp, getApps } from "firebase/app";
import {
  getAnalytics,
  isSupported,
  logEvent as fbLogEvent,
  setUserProperties,
} from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBtZ8_XhVx_fl9jQ33sn4hccPkPC0W4Xqc",
  authDomain: "magic-tissue.firebaseapp.com",
  projectId: "magic-tissue",
  storageBucket: "magic-tissue.firebasestorage.app",
  messagingSenderId: "802636203666",
  appId: "1:802636203666:web:e24d0c68710c22cc3ac84b",
  measurementId: "G-C2KWDRKM1K",
};

let analyticsInstance = null;
let initPromise = null;

export function initFirebaseAnalytics() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (typeof window === "undefined") return null;
    try {
      const supported = await isSupported();
      if (!supported) return null;
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
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

export { firebaseConfig };
