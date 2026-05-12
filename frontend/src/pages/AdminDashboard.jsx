import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  LogOut,
  Trash2,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminVerify,
  adminLogout,
  onAdminAuthState,
  getStats,
  listOrders,
  updateOrderStatus,
  deleteOrder,
  getProduct,
} from "../lib/api";
import ProductEditor from "../components/admin/ProductEditor";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const STATUS_COLOR = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
};

function isAuthError(err) {
  const code = err?.code || "";
  return (
    code === "auth/not-authenticated" ||
    code === "auth/not-admin" ||
    code === "permission-denied" ||
    code === "unauthenticated"
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await adminLogout();
    } catch (_) {
      // ignore
    }
    try {
      localStorage.removeItem("admin_token");
    } catch (_) {}
    navigate("/admin/login");
  };

  const refresh = async () => {
    try {
      const [s, o, p] = await Promise.all([getStats(), listOrders(), getProduct()]);
      setStats(s);
      setOrders(o);
      setProduct(p);
    } catch (err) {
      if (isAuthError(err)) {
        logout();
      } else {
        console.error("admin refresh failed", err);
        toast.error("ডেটা লোড করতে সমস্যা হয়েছে");
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await adminVerify();
        if (cancelled) return;
        await refresh();
      } catch (err) {
        if (!cancelled) {
          navigate("/admin/login", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    // Reactively log the user out if Firebase Auth state changes (e.g.
    // password reset on another tab, token revocation, etc.).
    const unsub = onAdminAuthState((user) => {
      if (!user) {
        navigate("/admin/login", { replace: true });
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-zinc-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" data-testid="admin-dashboard">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-zinc-900 bg-[#080808] p-4 sticky top-0">
          <div className="px-2 pb-6">
            <div className="font-en font-black text-lg">MAGIC TISSUE</div>
            <div className="text-xs text-zinc-500 font-en uppercase tracking-wider">Admin</div>
          </div>
          <nav className="space-y-1 flex-1">
            <SideBtn icon={LayoutDashboard} label="Dashboard" active={tab === "dashboard"} onClick={() => setTab("dashboard")} testid="nav-dashboard" />
            <SideBtn icon={ShoppingBag} label="Orders" active={tab === "orders"} onClick={() => setTab("orders")} testid="nav-orders" />
            <SideBtn icon={Package} label="Product" active={tab === "product"} onClick={() => setTab("product")} testid="nav-product" />
          </nav>
          <button onClick={logout} className="btn-ghost mt-auto" data-testid="logout-button">
            <LogOut size={16} /> Logout
          </button>
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#080808] border-b border-zinc-900 p-3 flex items-center justify-between">
          <div className="font-en font-black">MAGIC TISSUE Admin</div>
          <button onClick={logout} className="text-zinc-400">
            <LogOut size={18} />
          </button>
        </div>

        {/* Main */}
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 max-w-full overflow-x-hidden">
          {/* Mobile tabs */}
          <div className="md:hidden mb-4 flex gap-2 overflow-x-auto">
            {[
              { k: "dashboard", l: "Dashboard" },
              { k: "orders", l: "Orders" },
              { k: "product", l: "Product" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`px-3 py-2 rounded-md text-sm font-en whitespace-nowrap ${
                  tab === t.k ? "bg-[#ff5722] text-white" : "bg-zinc-900 text-zinc-300"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          {tab === "dashboard" && <DashboardTab stats={stats} />}
          {tab === "orders" && <OrdersTab orders={orders} onChange={refresh} />}
          {tab === "product" && product && (
            <ProductEditor product={product} onChange={refresh} />
          )}
        </main>
      </div>
    </div>
  );
}

function SideBtn({ icon: Icon, label, active, onClick, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors font-en ${
        active
          ? "bg-[#ff5722]/10 text-[#ff5722] border-l-2 border-[#ff5722]"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );
}

function DashboardTab({ stats }) {
  if (!stats) return null;
  const cards = [
    { label: "Total Orders", value: stats.total_orders, icon: ShoppingBag, color: "text-blue-400" },
    { label: "Revenue", value: `৳${stats.total_revenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-400" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-400" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-en font-black text-2xl md:text-3xl">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1 font-en">Overview of your store performance</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card p-5" data-testid={`stat-${c.label.replace(/\s/g, "-").toLowerCase()}`}>
            <div className="flex items-center justify-between">
              <c.icon size={20} className={c.color} />
              <TrendingUp size={14} className="text-zinc-600" />
            </div>
            <div className="mt-3 font-en font-black text-2xl md:text-3xl">{c.value}</div>
            <div className="text-xs text-zinc-500 mt-1 font-en">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-en font-bold">Last 7 Days</div>
            <div className="text-xs text-zinc-500 font-en">Orders & Revenue</div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5722" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FF5722" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#52525b" fontSize={11} />
              <YAxis stroke="#52525b" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8 }}
                labelStyle={{ color: "#fafafa" }}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#FF5722"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#g1)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <MiniStat label="Confirmed" value={stats.confirmed} color="text-blue-400" />
        <MiniStat label="Shipped" value={stats.shipped} color="text-purple-400" />
        <MiniStat label="Cancelled" value={stats.cancelled} color="text-red-400" />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="card p-4">
      <div className={`font-en font-black text-2xl ${color}`}>{value}</div>
      <div className="text-xs text-zinc-500 font-en mt-1">{label}</div>
    </div>
  );
}

function OrdersTab({ orders, onChange }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const handleStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      toast.success("Status updated");
      onChange();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await deleteOrder(id);
      toast.success("Order deleted");
      onChange();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-en font-black text-2xl md:text-3xl">Orders</h1>
          <p className="text-zinc-400 text-sm mt-1 font-en">{filtered.length} order(s)</p>
        </div>
        <select
          className="input max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          data-testid="orders-filter"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-zinc-500 font-en">No orders found</div>
      ) : (
        <div className="card overflow-x-auto" data-testid="orders-table">
          <table className="w-full text-sm">
            <thead className="bg-[#0d0d0e] text-zinc-400 text-xs uppercase tracking-wider font-en">
              <tr>
                <th className="text-left p-4">Order</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Package</th>
                <th className="text-left p-4">Total</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Created</th>
                <th className="text-right p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-zinc-900 hover:bg-zinc-900/40" data-testid={`order-row-${o.id}`}>
                  <td className="p-4 font-en text-xs text-zinc-500">
                    #{o.id.slice(0, 8)}
                  </td>
                  <td className="p-4">
                    <div className="font-bn">{o.name || "—"}</div>
                    <div className="text-xs text-zinc-500 font-en">{o.phone}</div>
                    <div className="text-xs text-zinc-600 font-bn line-clamp-1 max-w-[200px]">
                      {o.address}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bn text-xs">{o.package_name}</div>
                    <div className="text-xs text-zinc-500 font-en">
                      × {o.quantity} · {o.delivery_area === "inside_dhaka" ? "ঢাকা" : "ঢাকার বাইরে"}
                    </div>
                  </td>
                  <td className="p-4 font-en font-bold">৳{o.total}</td>
                  <td className="p-4">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatus(o.id, e.target.value)}
                      className={`text-xs font-en font-semibold px-2 py-1.5 rounded border ${STATUS_COLOR[o.status]}`}
                      data-testid={`status-${o.id}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="bg-zinc-900 text-white">
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-xs text-zinc-500 font-en">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="text-red-400 hover:text-red-300 p-2"
                      data-testid={`delete-${o.id}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
