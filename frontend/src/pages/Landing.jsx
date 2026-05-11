import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  MessageCircle,
  Facebook,
  ShoppingCart,
  Check,
  ShieldCheck,
  Truck,
  PackageCheck,
  Sparkles,
  Star,
  ChevronDown,
  Zap,
  Lock,
  Award,
  Pencil,
  Scissors,
  RotateCcw,
} from "lucide-react";
import Countdown from "../components/Countdown";
import Reveal from "../components/Reveal";
import { getProduct, createOrder } from "../lib/api";

const toBnDigits = (val) => {
  const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(val).replace(/[0-9]/g, (d) => map[Number(d)]);
};

const STAR = ({ filled }) =>
  filled ? (
    <Star size={16} className="star-on fill-yellow-400" />
  ) : (
    <Star size={16} className="star-off" />
  );

const TRUST = [
  { icon: ShieldCheck, label: "স্টেইনলেস স্টিল" },
  { icon: PackageCheck, label: "অরিজিনাল প্রোডাক্ট" },
  { icon: Truck, label: "ক্যাশ অন ডেলিভারি" },
  { icon: Lock, label: "গোপন প্যাকেজিং" },
];

const HOW = [
  {
    icon: Pencil,
    title: "পেন মোড",
    desc: "বাইরে থেকে দেখলে সম্পূর্ণ সাধারণ স্টাইলিশ পেন — কেউ বুঝতেই পারবে না।",
  },
  {
    icon: Scissors,
    title: "ক্যাপ খুলুন",
    desc: "প্রয়োজনের সময় পেনের ক্যাপটি খুললেই ধারালো স্টেইনলেস ব্লেড রেডি।",
  },
  {
    icon: RotateCcw,
    title: "আবার পকেটে",
    desc: "কাজ শেষে ক্যাপ লাগিয়ে পেনের মতো করেই পকেটে রেখে দিন।",
  },
];

const WHY = [
  { icon: Award, title: "প্রিমিয়াম বিল্ড", desc: "মেটাল বডি, স্ক্র্যাচ-রেজিস্ট্যান্ট ফিনিশ" },
  { icon: Zap, title: "শার্প ব্লেড", desc: "একবারে কাটে — অফিস, কুরিয়ার, ফল কাটা সবই" },
  { icon: Lock, title: "গোপন ডিজাইন", desc: "দেখতে পেন — বহন করা সহজ ও নিরাপদ" },
  { icon: ShieldCheck, title: "রাস্ট-প্রুফ", desc: "স্টেইনলেস স্টিল ব্লেড — মরিচা পড়বে না" },
];

export default function Landing() {
  const [product, setProduct] = useState(null);
  const [selectedPkgId, setSelectedPkgId] = useState(null);
  const [qty, setQty] = useState(1);
  const [area, setArea] = useState("inside_dhaka");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    getProduct()
      .then((p) => {
        setProduct(p);
        const popular = p.packages.find((x) => x.popular) || p.packages[0];
        if (popular) setSelectedPkgId(popular.id);
      })
      .catch(() => toast.error("প্রোডাক্ট লোড করতে সমস্যা হয়েছে"));
  }, []);

  const selectedPkg = useMemo(
    () => product?.packages.find((p) => p.id === selectedPkgId),
    [product, selectedPkgId]
  );

  const deliveryCharge = useMemo(() => {
    if (!product) return 0;
    return area === "inside_dhaka"
      ? product.delivery_inside_dhaka
      : product.delivery_outside_dhaka;
  }, [product, area]);

  const total = useMemo(() => {
    if (!selectedPkg) return 0;
    return selectedPkg.price * qty + deliveryCharge;
  }, [selectedPkg, qty, deliveryCharge]);

  const scrollToOrder = () => {
    document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const submitOrder = async (e) => {
    e?.preventDefault();
    if (!selectedPkg) {
      toast.error("একটি প্যাকেজ নির্বাচন করুন");
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length < 6) {
      toast.error("সঠিক মোবাইল নম্বর দিন");
      return;
    }
    if (!form.address.trim() || form.address.trim().length < 3) {
      toast.error("আপনার ঠিকানা লিখুন");
      return;
    }
    setSubmitting(true);
    try {
      await createOrder({
        name: form.name,
        phone: form.phone,
        address: form.address,
        note: form.note,
        package_id: selectedPkg.id,
        package_name: selectedPkg.name,
        package_price: selectedPkg.price,
        quantity: qty,
        delivery_area: area,
        delivery_charge: deliveryCharge,
        total,
      });
      toast.success("অর্ডার সফল হয়েছে! আমরা শীঘ্রই কল করব।");
      setForm({ name: "", phone: "", address: "", note: "" });
      setQty(1);
    } catch (err) {
      toast.error(
        err?.response?.data?.detail || "অর্ডার সাবমিট করতে সমস্যা হয়েছে"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-zinc-400">
        <div className="font-bn">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 md:pb-0" data-testid="landing-page">
      {/* Top banner */}
      <div className="bg-[#ff5722] text-white text-center py-2 px-3 text-sm font-semibold flex items-center justify-center gap-2 sm:gap-4 flex-wrap" data-testid="top-banner">
        <Sparkles size={14} />
        <span>সীমিত সময়ের অফার! ক্যাশ অন ডেলিভারি</span>
        {product.offer_end_iso && <Countdown endIso={product.offer_end_iso} />}
      </div>

      {/* Hero */}
      <section className="hero-grid-bg relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: text */}
          <Reveal>
            <div className="space-y-6">
              <span className="badge-pill" data-testid="hero-badge">
                <Sparkles size={12} /> অরিজিনাল প্রোডাক্ট • ১০০% গ্যারান্টি
              </span>
              <h1 className="section-title text-4xl sm:text-5xl lg:text-6xl font-bn font-bold leading-tight" data-testid="hero-title">
                {product.title}
              </h1>
              <p className="text-lg sm:text-xl text-zinc-300 font-bn max-w-xl" data-testid="hero-subtitle">
                {product.subtitle} — {product.tagline}
              </p>
              <div className="flex items-center gap-1" data-testid="hero-rating">
                {[1, 2, 3, 4, 5].map((i) => (
                  <STAR key={i} filled={i <= Math.round(product.rating)} />
                ))}
                <span className="ml-2 text-sm text-zinc-400 font-en">
                  {product.rating} ({toBnDigits(product.review_count)} রিভিউ)
                </span>
              </div>

              <ul className="space-y-2.5 pt-2">
                {product.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-200" data-testid={`hero-feature-${i}`}>
                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff5722]/15 text-[#ff5722]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span className="font-bn">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-baseline gap-3 pt-2">
                <div className="overline">আজকের অফার</div>
              </div>
              <div className="flex items-baseline gap-3">
                <div className="font-en font-black text-4xl sm:text-5xl text-white">
                  ৳{toBnDigits(product.packages[0]?.price ?? 0)}
                </div>
                {product.packages[0]?.original_price && (
                  <div className="text-zinc-500 line-through font-en text-xl">
                    ৳{toBnDigits(product.packages[0].original_price)}
                  </div>
                )}
                <div className="text-[#ff5722] font-bn font-semibold">থেকে শুরু</div>
              </div>

              <button
                onClick={scrollToOrder}
                className="btn-primary glow-pulse max-w-md text-lg"
                data-testid="hero-cta-button"
              >
                <ShoppingCart size={20} /> এখনই অর্ডার করুন
              </button>
            </div>
          </Reveal>

          {/* Right: gallery */}
          <Reveal delay={150}>
            <div className="relative" data-testid="hero-gallery">
              <div className="absolute -inset-6 bg-[#ff5722]/10 blur-3xl rounded-full" />
              <div className="relative card overflow-hidden">
                <img
                  src={product.images[activeImg]}
                  alt={product.title}
                  className="w-full aspect-square object-cover"
                  data-testid="hero-main-image"
                />
                <div className="absolute top-3 left-3 badge-pill bg-black/70 text-white border-zinc-700">
                  <Lock size={12} /> গোপন প্যাকেজিং
                </div>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.images.slice(0, 5).map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`card overflow-hidden aspect-square ${
                      activeImg === i ? "ring-2 ring-[#ff5722]" : ""
                    }`}
                    data-testid={`hero-thumb-${i}`}
                  >
                    <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust badges strip */}
      <section className="border-y border-zinc-900 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST.map((t, i) => (
            <div key={i} className="flex items-center gap-3" data-testid={`trust-${i}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff5722]/10 text-[#ff5722]">
                <t.icon size={20} />
              </span>
              <span className="text-sm sm:text-base font-bn text-zinc-200">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why use this */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="overline mb-3">কেন ব্যবহার করবেন</div>
              <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl font-bn">
                এক টুল, অসংখ্য কাজ
              </h2>
              <p className="text-zinc-400 mt-4 font-bn">
                {product.description}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY.map((w, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="card p-6 h-full" data-testid={`why-${i}`}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff5722]/10 text-[#ff5722] mb-4">
                    <w.icon size={24} />
                  </span>
                  <div className="font-bn font-bold text-lg mb-1.5">{w.title}</div>
                  <div className="text-zinc-400 text-sm font-bn">{w.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 md:py-24 bg-[#080808] border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="overline mb-3">প্যাকেজ</div>
              <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl font-bn">
                আপনার জন্য সেরা অফার বেছে নিন
              </h2>
              <p className="text-zinc-400 mt-3 font-bn text-sm">
                একসাথে যত বেশি, তত বেশি সাশ্রয়
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {product.packages.map((pkg, i) => {
              const isSelected = selectedPkgId === pkg.id;
              return (
                <Reveal key={pkg.id} delay={i * 100}>
                  <button
                    onClick={() => {
                      setSelectedPkgId(pkg.id);
                      setTimeout(scrollToOrder, 250);
                    }}
                    className={`card p-6 text-left w-full h-full relative ${
                      isSelected ? "ring-2 ring-[#ff5722] border-[#ff5722]" : ""
                    }`}
                    data-testid={`package-${pkg.pieces}pcs`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff5722] text-white text-xs font-bold px-3 py-1 rounded-full font-bn">
                        🔥 জনপ্রিয়
                      </span>
                    )}
                    <div className="font-bn text-zinc-300 text-sm">
                      {pkg.name}
                    </div>
                    <div className="flex items-baseline gap-2 mt-3">
                      <div className="font-en font-black text-4xl">
                        ৳{toBnDigits(pkg.price)}
                      </div>
                      {pkg.original_price && (
                        <div className="text-zinc-500 line-through font-en text-base">
                          ৳{toBnDigits(pkg.original_price)}
                        </div>
                      )}
                    </div>
                    {pkg.save_label && (
                      <div className="mt-2 inline-block text-xs font-semibold bg-[#10B981]/10 text-emerald-400 px-2 py-1 rounded font-bn">
                        {pkg.save_label}
                      </div>
                    )}
                    <div className="mt-4 text-sm text-zinc-400 font-bn">
                      প্রতি পিস ৳{toBnDigits(Math.round(pkg.price / pkg.pieces))}
                    </div>
                    <div className={`mt-6 text-center py-2 rounded-md text-sm font-bold transition-colors ${
                      isSelected ? "bg-[#ff5722] text-white" : "bg-zinc-800 text-zinc-300"
                    }`}>
                      {isSelected ? "✓ নির্বাচিত" : "নির্বাচন করুন"}
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-8 text-center text-sm text-zinc-400 font-bn space-y-1">
            <div>🚚 ঢাকার ভিতরে ডেলিভারি: <strong className="text-white font-en">৳{toBnDigits(product.delivery_inside_dhaka)}</strong></div>
            <div>🚚 ঢাকার বাইরে ডেলিভারি: <strong className="text-white font-en">৳{toBnDigits(product.delivery_outside_dhaka)}</strong></div>
            <div className="mt-2 text-zinc-500">💵 ক্যাশ অন ডেলিভারি — পণ্যটি হাতে নিয়ে চেক করে পেমেন্ট করুন।</div>
          </div>
        </div>
      </section>

      {/* Order Form */}
      <section id="order-form" className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="overline mb-3">ক্যাশ অন ডেলিভারি</div>
              <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl font-bn">
                অর্ডার ফর্ম
              </h2>
              <p className="text-zinc-400 mt-3 font-bn text-sm">
                নিচের তথ্য দিন, আমরা দ্রুত কনফার্ম কল করব
              </p>
            </div>
          </Reveal>

          <Reveal>
            <form
              onSubmit={submitOrder}
              className="card p-6 md:p-8 grid lg:grid-cols-2 gap-8"
              data-testid="order-form"
            >
              {/* Left: Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="label">আপনার নাম (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="আপনার পুরো নাম"
                    data-testid="order-name-input"
                  />
                </div>
                <div>
                  <label className="label">মোবাইল নাম্বার *</label>
                  <input
                    type="tel"
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    required
                    data-testid="order-phone-input"
                  />
                </div>
                <div>
                  <label className="label">সম্পূর্ণ ঠিকানা *</label>
                  <textarea
                    rows={3}
                    className="input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="বাসা, রোড, এলাকা, থানা, জেলা"
                    required
                    data-testid="order-address-input"
                  />
                </div>
                <div>
                  <label className="label">ডেলিভারি এলাকা</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setArea("inside_dhaka")}
                      className={`card p-3 text-sm font-bn ${
                        area === "inside_dhaka"
                          ? "ring-2 ring-[#ff5722] border-[#ff5722]"
                          : ""
                      }`}
                      data-testid="area-inside-dhaka"
                    >
                      ঢাকার ভিতরে
                      <div className="text-xs text-zinc-400 mt-1 font-en">
                        ৳{toBnDigits(product.delivery_inside_dhaka)}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setArea("outside_dhaka")}
                      className={`card p-3 text-sm font-bn ${
                        area === "outside_dhaka"
                          ? "ring-2 ring-[#ff5722] border-[#ff5722]"
                          : ""
                      }`}
                      data-testid="area-outside-dhaka"
                    >
                      ঢাকার বাইরে
                      <div className="text-xs text-zinc-400 mt-1 font-en">
                        ৳{toBnDigits(product.delivery_outside_dhaka)}
                      </div>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">নোট / অতিরিক্ত তথ্য (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    className="input"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="বিশেষ কোনো নির্দেশনা থাকলে"
                    data-testid="order-note-input"
                  />
                </div>
              </div>

              {/* Right: Summary */}
              <div className="space-y-4">
                <div className="card p-5 bg-[#0d0d0e]">
                  <div className="overline mb-3">আপনার অর্ডার</div>
                  <div>
                    <label className="label">প্যাকেজ</label>
                    <select
                      className="input"
                      value={selectedPkgId || ""}
                      onChange={(e) => setSelectedPkgId(e.target.value)}
                      data-testid="order-package-select"
                    >
                      {product.packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ৳{p.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3">
                    <label className="label">পরিমাণ</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="btn-ghost h-10 w-10 p-0"
                        data-testid="qty-decrease"
                      >
                        −
                      </button>
                      <div className="font-en font-bold text-xl w-10 text-center" data-testid="qty-value">
                        {qty}
                      </div>
                      <button
                        type="button"
                        onClick={() => setQty(qty + 1)}
                        className="btn-ghost h-10 w-10 p-0"
                        data-testid="qty-increase"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 text-sm font-bn">
                    <div className="flex justify-between text-zinc-400">
                      <span>সাবটোটাল</span>
                      <span className="font-en text-white">
                        ৳{toBnDigits((selectedPkg?.price ?? 0) * qty)}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>ডেলিভারি চার্জ</span>
                      <span className="font-en text-white">৳{toBnDigits(deliveryCharge)}</span>
                    </div>
                    <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
                      <span className="text-zinc-300 font-bold">মোট</span>
                      <span className="font-en font-black text-2xl text-[#ff5722]" data-testid="order-total">
                        ৳{toBnDigits(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-lg"
                  data-testid="order-submit-button"
                >
                  {submitting ? "সাবমিট হচ্ছে..." : "অর্ডার সাবমিট করুন"}
                </button>
                <p className="text-xs text-zinc-500 text-center font-bn">
                  পণ্যটি হাতে পেয়ে চেক করে পেমেন্ট করবেন
                </p>
              </div>
            </form>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-[#080808] border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="overline mb-3">ব্যবহারবিধি</div>
              <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl font-bn">
                কিভাবে ব্যবহার করবেন?
              </h2>
              <p className="text-zinc-400 mt-3 font-bn text-sm">৩টি সহজ ধাপে</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {HOW.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="card p-6 h-full relative" data-testid={`how-step-${i}`}>
                  <div className="absolute top-4 right-5 font-en font-black text-7xl text-[#ff5722]/10">
                    {i + 1}
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff5722]/10 text-[#ff5722]">
                    <s.icon size={24} />
                  </span>
                  <div className="font-bn font-bold text-xl mt-4">{s.title}</div>
                  <div className="text-zinc-400 mt-2 font-bn">{s.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="overline mb-3">রিভিউ</div>
              <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl font-bn">
                গ্রাহকদের মতামত
              </h2>
              <div className="flex items-center justify-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <STAR key={i} filled={i <= Math.round(product.rating)} />
                ))}
                <span className="ml-2 font-en text-zinc-300">
                  {product.rating}/5 ({toBnDigits(product.review_count)})
                </span>
              </div>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {product.reviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 80}>
                <div className="card p-6 h-full" data-testid={`review-${i}`}>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <STAR key={s} filled={s <= r.rating} />
                    ))}
                  </div>
                  <p className="text-zinc-300 font-bn text-sm leading-relaxed">
                    {r.text}
                  </p>
                  <div className="mt-4 pt-4 border-t border-zinc-800 text-sm">
                    <div className="font-bn font-semibold text-white">{r.name}</div>
                    {r.verified && (
                      <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-bn">
                        <Check size={12} /> যাচাইকৃত ক্রয়
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-[#080808] border-y border-zinc-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-10">
              <div className="overline mb-3">প্রশ্নোত্তর</div>
              <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl font-bn">
                সাধারণ প্রশ্নোত্তর
              </h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            {product.faqs.map((f, i) => (
              <Reveal key={f.id} delay={i * 50}>
                <button
                  className="w-full card p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  data-testid={`faq-${i}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bn font-semibold">{f.question}</span>
                    <ChevronDown
                      size={20}
                      className={`text-zinc-400 transition-transform ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {openFaq === i && (
                    <div className="mt-3 text-zinc-400 font-bn text-sm leading-relaxed">
                      {f.answer}
                    </div>
                  )}
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <div className="overline mb-3">সীমিত সময়ের অফার</div>
            <h2 className="section-title text-3xl sm:text-5xl font-bn mb-4">
              আজই অর্ডার করুন
            </h2>
            <p className="text-zinc-400 font-bn mb-2">
              হাজার হাজার মানুষ ইতিমধ্যে কিনেছেন — আপনার পালা!
            </p>
            <p className="font-en text-2xl font-black text-[#ff5722] mb-6">
              ৳{toBnDigits(product.packages[0]?.price ?? 0)} থেকে
            </p>
            <p className="text-xs text-zinc-500 font-bn mb-6">
              ক্যাশ অন ডেলিভারি • গোপন প্যাকেজিং • ১০০% অরিজিনাল
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xl mx-auto">
              <a href={`tel:${product.phone}`} className="btn-ghost" data-testid="cta-call">
                <Phone size={18} /> কল করুন
              </a>
              <button onClick={scrollToOrder} className="btn-primary" data-testid="cta-order">
                <ShoppingCart size={18} /> অর্ডার করুন — ৳{toBnDigits(product.packages[0]?.price ?? 0)}
              </button>
              <a
                href={`https://wa.me/${product.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
                data-testid="cta-whatsapp"
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-sm text-zinc-500 font-bn">
        <div className="max-w-7xl mx-auto px-4">
          © {new Date().getFullYear()} স্মার্ট পেন নাইফ — সব অধিকার সংরক্ষিত
          <div className="mt-2 flex items-center justify-center gap-4">
            <a href={`tel:${product.phone}`} className="hover:text-white">
              {product.phone}
            </a>
            <span>•</span>
            <a href={product.facebook} target="_blank" rel="noreferrer" className="hover:text-white inline-flex items-center gap-1">
              <Facebook size={14} /> Facebook
            </a>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0a0a0a]/95 backdrop-blur border-t border-zinc-800 mobile-bar" data-testid="mobile-sticky-bar">
        <div className="grid grid-cols-3 gap-2 p-2.5">
          <a href={`tel:${product.phone}`} className="btn-ghost py-2.5 text-xs" data-testid="mobile-call">
            <Phone size={16} /> কল
          </a>
          <button onClick={scrollToOrder} className="btn-primary py-2.5 text-xs" data-testid="mobile-order">
            <ShoppingCart size={16} /> অর্ডার
          </button>
          <a
            href={`https://wa.me/${product.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost py-2.5 text-xs"
            data-testid="mobile-whatsapp"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
