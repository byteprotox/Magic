import { useEffect } from "react";

// Load Facebook Pixel base code once and track PageView
export function useFacebookPixel(pixelId) {
  useEffect(() => {
    if (!pixelId || typeof window === "undefined") return;
    if (window.__fbpInitialized === pixelId) return;

    // Standard Meta Pixel snippet
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js"
    );
    /* eslint-enable */

    if (window.fbq) {
      window.fbq("init", pixelId);
      window.fbq("track", "PageView");
      window.__fbpInitialized = pixelId;
    }
  }, [pixelId]);
}

// Fire a standard event (e.g. "Purchase", "InitiateCheckout", "Lead")
export function fbqTrack(event, params = {}) {
  if (typeof window === "undefined") return;
  if (window.fbq) {
    window.fbq("track", event, params);
  }
}
