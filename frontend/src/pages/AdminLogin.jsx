import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, Mail } from "lucide-react";
import { toast } from "sonner";
import { adminLogin, adminVerify, ADMIN_EMAIL } from "../lib/api";

function friendlyError(err) {
  const code = err?.code || "";
  if (code === "auth/not-admin") return "এই অ্যাকাউন্ট অ্যাডমিন হিসেবে অনুমোদিত নয়";
  if (code === "auth/not-admin-allowlisted") return "Firestore এ admins/{email} ডকুমেন্ট নেই";
  if (code === "auth/operation-not-allowed") return "Firebase Auth এ Email/Password sign-in চালু করুন";
  if (code === "permission-denied") return "Firestore rules/admin allowlist ঠিক নেই";
  if (code === "auth/invalid-credential" || code === "auth/invalid-login-credentials")
    return "ভুল ইমেইল বা পাসওয়ার্ড";
  if (code === "auth/wrong-password") return "ভুল পাসওয়ার্ড";
  if (code === "auth/user-not-found") return "অ্যাকাউন্ট পাওয়া যায়নি";
  if (code === "auth/invalid-email") return "সঠিক ইমেইল দিন";
  if (code === "auth/too-many-requests")
    return "অনেকবার চেষ্টা — কিছুক্ষণ পরে আবার চেষ্টা করুন";
  if (code === "auth/network-request-failed")
    return "নেটওয়ার্ক সমস্যা — পরে আবার চেষ্টা করুন";
  return err?.message || "লগইন ব্যর্থ";
}

export default function AdminLogin() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // If we're already signed in as the admin, skip the login page.
  useEffect(() => {
    let cancelled = false;
    adminVerify()
      .then(() => {
        if (!cancelled) navigate("/admin", { replace: true });
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("ইমেইল দিন");
      return;
    }
    if (!password.trim()) {
      toast.error("পাসওয়ার্ড দিন");
      return;
    }
    setLoading(true);
    try {
      await adminLogin(email, password);
      // Clean up any legacy token from the previous REST-API flow.
      try {
        localStorage.removeItem("admin_token");
      } catch (_) {}
      toast.success("লগইন সফল!");
      navigate("/admin");
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-zinc-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#ff5722]/10 text-[#ff5722] mb-4">
            <Lock size={26} />
          </div>
          <h1 className="font-en font-black text-3xl mb-2">Admin Panel</h1>
          <p className="text-zinc-400 font-bn">অ্যাডমিন প্যানেলে প্রবেশ করুন</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="card p-6 space-y-4"
          data-testid="admin-login-form"
        >
          <div>
            <label className="label">ইমেইল</label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <input
                type="email"
                className="input pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                data-testid="admin-email-input"
              />
            </div>
          </div>
          <div>
            <label className="label">পাসওয়ার্ড</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
              data-testid="admin-password-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            data-testid="admin-login-button"
          >
            {loading ? "Loading..." : "Login"} <ArrowRight size={18} />
          </button>
        </form>
        <p className="text-center mt-6 text-xs text-zinc-600 font-en">
          ম্যাজিক টিস্যু Admin
        </p>
      </div>
    </div>
  );
}
