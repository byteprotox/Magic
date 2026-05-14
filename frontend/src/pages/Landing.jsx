import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  MessageCircle,
  ShoppingCart,
  Check,
  Star,
  ChevronDown,
  Minus,
  Plus,
  Sparkles,
  Truck,
  ShieldCheck,
  Lock,
  Award,
  Facebook,
  Package as PackageIcon,
  Heart,
  Zap,
  Gift,
  Clock,
  Phone as PhoneIcon,
} from "lucide-react";

const ICONS = {
  ShieldCheck,
  Award,
  Lock,
  Truck,
  Package: PackageIcon,
  Heart,
  Zap,
  Gift,
  Clock,
  Phone: PhoneIcon,
};

const COLOR_CLASSES = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-green-50 text-green-700 border-green-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  red: "bg-red-50 text-red-700 border-red-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
};
import Countdown from "../components/Countdown";
import Reveal from "../components/Reveal";
import { getProduct, createOrder } from "../lib/api";
import { useFacebookPixel, fbqTrack } from "../lib/fbPixel";
import { initFirebaseAnalytics, logEvent as gaLog } from "../lib/firebase";

const toBn = (val) => {
  const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(val).replace(/[0-9]/g, (d) => map[Number(d)]);
};

const STAR = ({ filled, size = 16 }) =>
  filled ? (
    <Star size={size} className="star-on" fill="currentColor" />
  ) : (
    <Star size={size} className="star-off" />
  );

export default function Landing() {
  const [product, setProduct] = useState(null);
  const [selectedPkgId, setSelectedPkgId] = useState(null);
  const [qty, setQty] = useState(1);
  const [area, setArea] = useState("inside_dhaka");
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Initialize Facebook Pixel once product loads
  useFacebookPixel(product?.fb_pixel_id || process.env.REACT_APP_META_PIXEL_ID);

  // Initialize Firebase Analytics (Google Analytics 4) and log page_view
  useEffect(() => {
    if (!product) return;
    initFirebaseAnalytics().then((a) => {
      if (a) {
        gaLog("page_view", {
          page_title: product.title,
          page_location: window.location.href,
        });
      }
    });
  }, [product]);

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
    return area === "inside_dhaka" ? product.delivery_inside_dhaka : product.delivery_outside_dhaka;
  }, [product, area]);
  const total = useMemo(() => {
    if (!selectedPkg) return 0;
    return selectedPkg.price * qty + deliveryCharge;
  }, [selectedPkg, qty, deliveryCharge]);

  const scrollToOrder = () => {
    document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth" });
    // Track ad funnel event — FB Pixel
    fbqTrack("InitiateCheckout", {
      content_name: product?.title,
      content_ids: selectedPkg ? [selectedPkg.id] : [],
      value: total,
      currency: "BDT",
      num_items: qty,
    });
    // Track ad funnel event — Firebase / GA4
    gaLog("begin_checkout", {
      currency: "BDT",
      value: total,
      items: selectedPkg ? [{ item_id: selectedPkg.id, item_name: selectedPkg.name, price: selectedPkg.price, quantity: qty }] : [],
    });
  };

  const submitOrder = async (e) => {
    e?.preventDefault();
    if (!selectedPkg) return toast.error("একটি প্যাকেজ নির্বাচন করুন");
    if (!form.phone.trim() || form.phone.trim().length < 6) return toast.error("সঠিক মোবাইল নম্বর দিন");
    if (!form.address.trim() || form.address.trim().length < 3) return toast.error("আপনার ঠিকানা লিখুন");
    setSubmitting(true);
    try {
      const created = await createOrder({
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
      // Fire Facebook Pixel Purchase event for conversion tracking
      fbqTrack("Purchase", {
        content_name: product?.title,
        content_ids: [selectedPkg.id],
        content_type: "product",
        value: total,
        currency: "BDT",
        num_items: qty,
        order_id: created?.id,
      });
      // Fire Firebase / GA4 purchase event
      gaLog("purchase", {
        transaction_id: created?.id,
        currency: "BDT",
        value: total,
        items: [
          {
            item_id: selectedPkg.id,
            item_name: selectedPkg.name,
            price: selectedPkg.price,
            quantity: qty,
          },
        ],
      });
      toast.success("অর্ডার সফল হয়েছে! আমরা শীঘ্রই কল করব।");
      setForm({ name: "", phone: "", address: "", note: "" });
      setQty(1);
    } catch (err) {
      console.error("create order failed", err);
      toast.error(
        err?.response?.data?.detail || err?.message || "অর্ডার সাবমিট করতে সমস্যা হয়েছে"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-zinc-600">
        <div className="font-bn">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] pb-28 md:pb-0" data-testid="landing-page">
      {/* ==== Top urgency banner ==== */}
      <div className="bg-[var(--primary)] text-white text-center py-2 px-3 text-sm font-bold flex items-center justify-center gap-3 flex-wrap" data-testid="top-banner">
        <Sparkles size={14} />
        <span className="font-bn">{product.banner_text}</span>
        {product.offer_end_iso && <Countdown endIso={product.offer_end_iso} />}
      </div>

      {/* ==== Marquee ticker ==== */}
      <div className="bg-yellow-300 border-y-2 border-yellow-500 py-1.5 ticker-wrap text-sm font-bn font-bold text-[#7c2d12]">
        <div className="ticker">
          {product.ticker_text}
        </div>
      </div>

      {/* ==== Hero ==== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <Reveal>
          <div className="text-center">
            <div className="inline-block bg-yellow-300 border-2 border-yellow-500 px-3 py-1 rounded-md text-xs font-bn font-bold text-[#7c2d12] mb-3">
              {product.hero_badge_text}
            </div>
            <h1 className="font-bn text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight" data-testid="hero-title">
              {product.title}
            </h1>
            <p className="font-bn text-lg sm:text-xl mt-3 text-[var(--ink-soft)]" data-testid="hero-subtitle">
              {product.subtitle}
            </p>
            <div className="flex items-center justify-center gap-1 mt-3" data-testid="hero-rating">
              {[1, 2, 3, 4, 5].map((i) => (
                <STAR key={i} filled={i <= Math.round(product.rating)} size={18} />
              ))}
              <span className="ml-2 font-en text-sm text-[var(--ink-soft)]">
                {product.rating} ({toBn(product.review_count)} রিভিউ)
              </span>
            </div>
          </div>
        </Reveal>

        {/* Product images stacked grid (nooranishop style) */}
        <Reveal delay={100}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
            {product.images.slice(0, 6).map((src, i) => (
              <div key={i} className="card-white overflow-hidden aspect-square bg-gradient-to-br from-pink-50 to-orange-50" data-testid={`hero-image-${i}`}>
                <img src={src} alt={`product-${i}`} className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
        </Reveal>

        {/* Urgent callout */}
        <Reveal>
          <div className="mt-8 callout-danger text-center text-base sm:text-lg font-bn">
            ⚠️ {product.urgency_text}
            <div className="mt-2 text-sm font-semibold">এখন অর্ডার করলে পাচ্ছেন <span className="text-[var(--primary)]">বিশাল ছাড়।</span></div>
          </div>
        </Reveal>

        {/* Price callout */}
        <Reveal>
          <div className="mt-6 text-center space-y-2">
            {product.packages.map((p, i) => (
              <div key={p.id} className={`inline-block px-4 py-2 rounded-md font-bn font-extrabold text-lg sm:text-2xl mr-2 ${p.popular ? "bg-[var(--primary)] text-white border-2 border-[#7f1d1d]" : "bg-yellow-300 text-[#7c2d12] border-2 border-yellow-500"}`} data-testid={`price-callout-${i}`}>
                {p.popular && "🔥 "}
                {p.pieces > 1 ? `${toBn(p.pieces)} পিস` : "১ প্যাক"} = {toBn(p.price)} টাকা
                {p.save_label && <span className="block text-xs font-normal mt-1">({p.save_label})</span>}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-6 max-w-md mx-auto">
            <button onClick={scrollToOrder} className="btn-cta pulse-cta font-bn" data-testid="hero-cta">
              <ShoppingCart size={20} /> প্রথমে দেখুন, তারপর টাকা দিন!
            </button>
          </div>
        </Reveal>
      </section>

      {/* ==== Why use this — nooranishop-style colorful box ==== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Reveal>
          <div className="text-center mb-6">
            <div className="shop-heading text-2xl sm:text-3xl font-bn">
              {product.why_use_title}
            </div>
          </div>
          <div className="card-white p-6 sm:p-8">
            <ul className="space-y-3">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 font-bn text-base sm:text-lg" data-testid={`why-feature-${i}`}>
                  <span className="text-2xl">👉</span>
                  <span className="text-[var(--ink-soft)]">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ==== Trust badges ==== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(product.trust_badges || []).map((b, i) => {
            const Icon = ICONS[b.icon] || ShieldCheck;
            const color = COLOR_CLASSES[b.color] || COLOR_CLASSES.blue;
            return (
              <div key={b.id || i} className={`border-2 rounded-lg p-4 text-center ${color}`} data-testid={`trust-${i}`}>
                <Icon size={28} className="mx-auto mb-2" />
                <div className="text-sm font-bn font-bold">{b.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==== Quality focus banner ==== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Reveal>
          <div className="text-center mb-3">
            <div className="shop-heading-yellow inline-block text-xl sm:text-2xl font-bn">
              {product.quality_title}
            </div>
          </div>
          <div className="card-white p-6 text-center font-bn text-[var(--ink-soft)]">
            <p className="text-base sm:text-lg">{product.quality_message}</p>
            <p className="mt-2 text-sm">আমাদের প্রোডাক্ট কিনে তারা এখন খুশি!</p>
            <div className="mt-4 font-en font-black text-4xl sm:text-5xl text-[var(--green)]">
              {toBn(product.customer_count)}+
            </div>
            <div className="text-sm font-bn font-bold mt-1">{product.customer_count_label}</div>
            <div className="mt-5 pt-5 border-t-2 border-dashed border-[var(--border-strong)]">
              <p className="font-bn text-sm">যে কোনো প্রয়োজনে কল করুন</p>
              <a href={`tel:${product.phone}`} className="font-en font-black text-2xl text-[var(--primary)] mt-1 inline-block" data-testid="phone-link">
                {toBn(product.phone)}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ==== Packages selection ==== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Reveal>
          <div className="text-center mb-6">
            <div className="shop-heading text-xl sm:text-2xl font-bn">
              যেকোনো একটি সিলেক্ট করুন
            </div>
          </div>
          <div className="space-y-3">
            {product.packages.map((pkg) => {
              const isSelected = selectedPkgId === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => {
                    setSelectedPkgId(pkg.id);
                    setQty(1);
                  }}
                  className={`w-full card-white p-4 flex items-center gap-4 text-left ${
                    isSelected ? "ring-2 ring-[var(--primary)] border-[var(--primary)]" : ""
                  }`}
                  data-testid={`package-${pkg.pieces}pcs`}
                >
                  <img src={product.images[0]} alt={pkg.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-bn font-bold text-base sm:text-lg">{pkg.name}</div>
                    {pkg.popular && <span className="inline-block mt-1 text-xs font-bn font-bold bg-[var(--primary)] text-white px-2 py-0.5 rounded">🔥 জনপ্রিয়</span>}
                    {pkg.save_label && <span className="inline-block mt-1 ml-1 text-xs font-bn font-bold bg-[var(--green)] text-white px-2 py-0.5 rounded">{pkg.save_label}</span>}
                  </div>
                  <div className="text-right">
                    <div className="font-en font-black text-xl sm:text-2xl text-[var(--primary)]">৳ {toBn(pkg.price)}</div>
                    {pkg.original_price && (
                      <div className="text-sm font-en text-[var(--ink-muted)] line-through">৳ {toBn(pkg.original_price)}</div>
                    )}
                  </div>
                  <div className={`hidden sm:flex h-7 w-7 items-center justify-center rounded-full border-2 flex-shrink-0 ${
                    isSelected ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-[var(--border-strong)]"
                  }`}>
                    {isSelected && <Check size={14} />}
                  </div>
                </button>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* ==== Order form ==== */}
      <section id="order-form" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Reveal>
          <div className="text-center mb-6">
            <div className="shop-heading text-xl sm:text-2xl font-bn">
              📝 Billing details
            </div>
          </div>
          <form onSubmit={submitOrder} className="card-white p-5 sm:p-7 space-y-4" data-testid="order-form">
            <div>
              <label className="label font-bn">আপনার নাম</label>
              <input className="input" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="আপনার পুরো নাম" data-testid="order-name-input" />
            </div>
            <div>
              <label className="label font-bn">মোবাইল নাম্বার <span className="text-[var(--primary)]">*</span></label>
              <input className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" required data-testid="order-phone-input" />
            </div>
            <div>
              <label className="label font-bn">আপনার সম্পূর্ন ঠিকানা লিখুন <span className="text-[var(--primary)]">*</span></label>
              <textarea className="input" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="বাসা, রোড, এলাকা, থানা, জেলা" required data-testid="order-address-input" />
            </div>

            {/* Shipping selector */}
            <div>
              <label className="label font-bn">Shipping</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button type="button" onClick={() => setArea("inside_dhaka")} className={`chip text-left font-bn ${area === "inside_dhaka" ? "active" : ""}`} data-testid="area-inside-dhaka">
                  ঢাকার ভিতরে: <strong>৳ {toBn(product.delivery_inside_dhaka)}</strong>
                </button>
                <button type="button" onClick={() => setArea("outside_dhaka")} className={`chip text-left font-bn ${area === "outside_dhaka" ? "active" : ""}`} data-testid="area-outside-dhaka">
                  ঢাকার বাহিরে: <strong>৳ {toBn(product.delivery_outside_dhaka)}</strong>
                </button>
              </div>
            </div>

            {/* Order summary table */}
            <div className="border-2 border-[var(--border-strong)] rounded-lg overflow-hidden">
              <div className="bg-[var(--bg-soft)] px-4 py-2.5 font-bn font-bold border-b-2 border-[var(--border-strong)]">
                Your order
              </div>
              <div className="divide-y-2 divide-[var(--bg-soft)]">
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img src={product.images[0]} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bn text-sm truncate">{selectedPkg?.name}</div>
                      <div className="text-xs text-[var(--ink-muted)] font-en">× {qty}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="btn-outline px-2 py-1" data-testid="qty-decrease"><Minus size={14} /></button>
                    <div className="font-en font-bold w-6 text-center" data-testid="qty-value">{qty}</div>
                    <button type="button" onClick={() => setQty(qty + 1)} className="btn-outline px-2 py-1" data-testid="qty-increase"><Plus size={14} /></button>
                  </div>
                  <div className="font-en font-bold text-right whitespace-nowrap">৳ {toBn((selectedPkg?.price ?? 0) * qty)}</div>
                </div>

                {/* Package switcher */}
                <div className="px-4 py-3">
                  <label className="label font-bn text-xs">প্যাকেজ পরিবর্তন</label>
                  <select className="input" value={selectedPkgId || ""} onChange={(e) => setSelectedPkgId(e.target.value)} data-testid="order-package-select">
                    {product.packages.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — ৳{p.price}</option>
                    ))}
                  </select>
                </div>

                <div className="px-4 py-2.5 flex justify-between font-bn text-sm">
                  <span>Subtotal</span>
                  <span className="font-en font-bold">৳ {toBn((selectedPkg?.price ?? 0) * qty)}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between font-bn text-sm">
                  <span>Shipment</span>
                  <span className="font-en font-bold">৳ {toBn(deliveryCharge)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center bg-[var(--bg-soft)]">
                  <span className="font-bn font-bold text-base">Total</span>
                  <span className="font-en font-black text-2xl text-[var(--primary)]" data-testid="order-total">৳ {toBn(total)}</span>
                </div>
              </div>
            </div>

            {/* COD note */}
            <div className="callout-warning text-sm font-bn">
              💵 <strong>Cash on delivery</strong> — Pay with cash upon delivery. পণ্যটি হাতে নিয়ে চেক করে পেমেন্ট করুন।
            </div>

            <button type="submit" disabled={submitting} className="btn-cta pulse-cta font-bn text-lg" data-testid="order-submit-button">
              {submitting ? "সাবমিট হচ্ছে..." : <>অর্ডার প্লেস করুন — ৳ {toBn(total)}</>}
            </button>
            <p className="text-center text-xs text-[var(--ink-muted)] font-bn">আপনার পার্সোনাল ডাটা সম্পূর্ণ গোপনীয় থাকবে।</p>
          </form>
        </Reveal>
      </section>

      {/* ==== Reviews ==== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Reveal>
          <div className="text-center mb-6">
            <div className="shop-heading-green text-xl sm:text-2xl font-bn">⭐ গ্রাহকদের মতামত</div>
            <div className="mt-3 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => <STAR key={i} filled={i <= Math.round(product.rating)} size={18} />)}
              <span className="ml-2 font-en font-bold">{product.rating}/5 ({toBn(product.review_count)})</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {product.reviews.map((r, i) => (
              <div key={r.id} className="card-white p-5" data-testid={`review-${i}`}>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => <STAR key={s} filled={s <= r.rating} />)}
                </div>
                <p className="font-bn text-[var(--ink-soft)] text-sm leading-relaxed">{r.text}</p>
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="font-bn font-bold text-sm">{r.name}</span>
                  {r.verified && <span className="text-xs font-bn text-[var(--green)] inline-flex items-center gap-1"><Check size={12} /> যাচাইকৃত ক্রয়</span>}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ==== FAQ ==== */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Reveal>
          <div className="text-center mb-6">
            <div className="shop-heading text-xl sm:text-2xl font-bn">❓ সাধারণ প্রশ্নোত্তর</div>
          </div>
          <div className="space-y-2">
            {product.faqs.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full card-white p-4 text-left"
                data-testid={`faq-${i}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bn font-bold text-sm sm:text-base">{f.question}</span>
                  <ChevronDown size={20} className={`flex-shrink-0 text-[var(--primary)] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </div>
                {openFaq === i && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] text-[var(--ink-soft)] font-bn text-sm leading-relaxed">
                    {f.answer}
                  </div>
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ==== Final CTA ==== */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
        <Reveal>
          <div className="shop-heading-yellow text-lg sm:text-xl font-bn inline-block">
            {product.final_cta_eyebrow}
          </div>
          <h2 className="font-bn text-3xl sm:text-4xl font-extrabold mt-4 mb-2">{product.final_cta_title}</h2>
          <p className="font-bn text-[var(--ink-soft)] mb-4">{product.final_cta_subtitle}</p>
          <p className="font-bn text-base mb-1">এখনই অর্ডার করুন — <span className="font-en font-black text-[var(--primary)]">{product.packages[0]?.name} মাত্র ৳{toBn(product.packages[0]?.price ?? 0)}</span></p>
          <p className="font-bn text-xs text-[var(--ink-muted)] mb-6">{product.final_cta_note}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <a href={`tel:${product.phone}`} className="btn-outline" data-testid="cta-call">
              <Phone size={16} /> 📞 কল
            </a>
            <button onClick={scrollToOrder} className="btn-cta" data-testid="cta-order">
              <ShoppingCart size={18} /> অর্ডার — ৳{toBn(product.packages[0].price)}
            </button>
            <a href={`https://wa.me/${product.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="btn-outline" data-testid="cta-whatsapp">
              <MessageCircle size={16} /> 💬 WhatsApp
            </a>
            <a href={product.facebook} target="_blank" rel="noreferrer" className="btn-outline" data-testid="cta-facebook">
              <Facebook size={16} /> Facebook
            </a>
          </div>
        </Reveal>
      </section>

      {/* ==== Footer ==== */}
      <footer className="bg-[var(--ink)] text-white/80 mt-6">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <div className="font-bn font-bold text-base sm:text-lg text-white mb-2">
            {product.footer_message}
          </div>
          <p className="font-bn text-sm">যে কোনো প্রয়োজনে কল করুন: <a href={`tel:${product.phone}`} className="text-yellow-300 font-en font-bold">{toBn(product.phone)}</a></p>
          <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
            <a href={product.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-yellow-300 font-bn" data-testid="footer-facebook">
              <Facebook size={16} /> Facebook
            </a>
            <span className="text-white/30">•</span>
            <a href={`https://wa.me/${product.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-yellow-300 font-bn" data-testid="footer-whatsapp">
              <MessageCircle size={16} /> WhatsApp
            </a>
          </div>
          <p className="font-bn text-xs mt-4 text-white/50">© {new Date().getFullYear()} {product.site_name} — সব অধিকার সংরক্ষিত</p>
        </div>
      </footer>

      {/* ==== Sticky mobile bar ==== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t-2 border-[var(--border-strong)] mobile-bar shadow-2xl" data-testid="mobile-sticky-bar">
        <div className="grid grid-cols-3 gap-2 p-2.5">
          <a href={`tel:${product.phone}`} className="btn-outline py-2.5 text-xs" data-testid="mobile-call">
            <Phone size={14} /> কল
          </a>
          <button onClick={scrollToOrder} className="btn-cta py-2.5 text-xs" data-testid="mobile-order">
            <ShoppingCart size={14} /> অর্ডার ৳{toBn(total)}
          </button>
          <a href={`https://wa.me/${product.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="btn-outline py-2.5 text-xs" data-testid="mobile-whatsapp">
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
