import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { adminLogin } from "../lib/api";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("পাসওয়ার্ড দিন");
      return;
    }
    setLoading(true);
    try {
      const { token } = await adminLogin(password);
      localStorage.setItem("admin_token", token);
      toast.success("লগইন সফল!");
      navigate("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "ভুল পাসওয়ার্ড");
    } finally {
      setLoading(false);
    }
  };

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
        <form onSubmit={handleSubmit} className="card p-6 space-y-4" data-testid="admin-login-form">
          <div>
            <label className="label">পাসওয়ার্ড</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
