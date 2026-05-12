import { useState } from "react";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
  GripVertical,
  Image as ImageIcon,
  Tag,
  MessageSquare,
  HelpCircle,
  Megaphone,
  Sparkles,
  Phone,
  ShieldCheck,
  Type,
  ListChecks,
} from "lucide-react";
import { updateProduct, uploadImage } from "../../lib/api";

const ICON_OPTIONS = [
  "ShieldCheck",
  "Award",
  "Lock",
  "Truck",
  "Package",
  "Heart",
  "Zap",
  "Gift",
  "Clock",
  "Phone",
];

const COLOR_OPTIONS = ["blue", "green", "purple", "orange", "red", "yellow"];

// Static class map so Tailwind JIT keeps these in production
const COLOR_PREVIEW = {
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  green: "bg-green-500/20 text-green-400 border-green-500/40",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  orange: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  red: "bg-red-500/20 text-red-400 border-red-500/40",
  yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
};

function Section({ icon: Icon, title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-admin border border-zinc-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <span className="h-9 w-9 rounded-md bg-[#ff5722]/10 text-[#ff5722] flex items-center justify-center">
            <Icon size={18} />
          </span>
          <div>
            <div className="font-en font-bold text-white">{title}</div>
            {subtitle && (
              <div className="text-xs text-zinc-500 font-en mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {open ? <ChevronUp size={20} className="text-zinc-400" /> : <ChevronDown size={20} className="text-zinc-400" />}
      </button>
      {open && <div className="border-t border-zinc-800 p-4 md:p-5 bg-[#0a0a0a]/40">{children}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", step, placeholder, hint }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        step={step}
        className="input"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-xs text-zinc-500 mt-1 font-en">{hint}</p>}
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        rows={rows}
        className="input"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ListRowControls({ onUp, onDown, onDelete, canUp, canDown }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onUp} disabled={!canUp} className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30">
        <ChevronUp size={14} />
      </button>
      <button type="button" onClick={onDown} disabled={!canDown} className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30">
        <ChevronDown size={14} />
      </button>
      <button type="button" onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-300">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function move(arr, from, to) {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function ProductEditor({ product, onChange }) {
  const [form, setForm] = useState({
    site_name: product.site_name || "",
    title: product.title,
    subtitle: product.subtitle,
    tagline: product.tagline,
    description: product.description,
    phone: product.phone,
    whatsapp: product.whatsapp,
    facebook: product.facebook,
    fb_pixel_id: product.fb_pixel_id || "",
    delivery_inside_dhaka: product.delivery_inside_dhaka,
    delivery_outside_dhaka: product.delivery_outside_dhaka,
    rating: product.rating,
    review_count: product.review_count,
    offer_end_iso: product.offer_end_iso?.slice(0, 16) || "",
    // copy
    banner_text: product.banner_text || "",
    ticker_text: product.ticker_text || "",
    hero_badge_text: product.hero_badge_text || "",
    why_use_title: product.why_use_title || "",
    quality_title: product.quality_title || "",
    quality_message: product.quality_message || "",
    customer_count: product.customer_count || 0,
    customer_count_label: product.customer_count_label || "",
    urgency_text: product.urgency_text || "",
    final_cta_eyebrow: product.final_cta_eyebrow || "",
    final_cta_title: product.final_cta_title || "",
    final_cta_subtitle: product.final_cta_subtitle || "",
    final_cta_note: product.final_cta_note || "",
    footer_message: product.footer_message || "",
  });
  const [images, setImages] = useState([...product.images]);
  const [features, setFeatures] = useState([...product.features]);
  const [packages, setPackages] = useState([...product.packages]);
  const [reviews, setReviews] = useState([...(product.reviews || [])]);
  const [faqs, setFaqs] = useState([...(product.faqs || [])]);
  const [trustBadges, setTrustBadges] = useState([...(product.trust_badges || [])]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const setF = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProduct({
        ...form,
        delivery_inside_dhaka: Number(form.delivery_inside_dhaka),
        delivery_outside_dhaka: Number(form.delivery_outside_dhaka),
        rating: Number(form.rating),
        review_count: Number(form.review_count),
        customer_count: Number(form.customer_count),
        offer_end_iso: form.offer_end_iso ? new Date(form.offer_end_iso).toISOString() : null,
        images: images.filter((s) => s.trim()),
        features: features.filter((s) => s.trim()),
        packages: packages.map((p) => ({
          ...p,
          pieces: Number(p.pieces),
          price: Number(p.price),
          original_price: p.original_price ? Number(p.original_price) : null,
        })),
        reviews: reviews.map((r) => ({ ...r, rating: Number(r.rating) })),
        faqs,
        trust_badges: trustBadges,
      });
      toast.success("সব পরিবর্তন সংরক্ষিত হয়েছে");
      onChange();
    } catch (err) {
      console.error("save product failed", err);
      toast.error(
        err?.response?.data?.detail || err?.message || "সেভ করতে সমস্যা হয়েছে"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploaded = await uploadImage(file);
      setImages((current) => [...current, uploaded.url]);
      toast.success("ছবি আপলোড হয়েছে");
    } catch (err) {
      console.error("image upload failed", err);
      toast.error(
        err?.response?.data?.detail || err?.message || "ছবি আপলোড করতে সমস্যা হয়েছে"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3 sticky top-0 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-[#0a0a0a]/95 backdrop-blur border-b border-zinc-900">
        <div>
          <h1 className="font-en font-black text-2xl md:text-3xl">Product Editor</h1>
          <p className="text-zinc-400 text-sm mt-1 font-en">Edit everything that appears on the landing page</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary max-w-xs" data-testid="save-product">
          <Save size={16} /> {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {/* ===== Basic Info ===== */}
      <Section icon={Type} title="Basic Info" subtitle="Site name, product title, subtitle, description" defaultOpen>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Site Name (Footer & Title)" value={form.site_name} onChange={(v) => setF("site_name", v)} />
          <Field label="Product Title (H1)" value={form.title} onChange={(v) => setF("title", v)} />
          <Field label="Subtitle" value={form.subtitle} onChange={(v) => setF("subtitle", v)} />
          <Field label="Tagline" value={form.tagline} onChange={(v) => setF("tagline", v)} />
          <div className="md:col-span-2">
            <TextArea label="Description (used in 'why use it' section)" value={form.description} onChange={(v) => setF("description", v)} rows={3} />
          </div>
          <Field label="Star Rating (1–5)" type="number" step="0.1" value={form.rating} onChange={(v) => setF("rating", v)} />
          <Field label="Review Count" type="number" value={form.review_count} onChange={(v) => setF("review_count", v)} />
        </div>
      </Section>

      {/* ===== Banner / Ticker / Hero Badge ===== */}
      <Section icon={Megaphone} title="Top Banner, Ticker & Badge" subtitle="Sticky banner, scrolling marquee text, hero badge">
        <div className="grid md:grid-cols-2 gap-4">
          <TextArea label="Top Banner Text" value={form.banner_text} onChange={(v) => setF("banner_text", v)} rows={2} />
          <TextArea label="Marquee Ticker Text" value={form.ticker_text} onChange={(v) => setF("ticker_text", v)} rows={2} />
          <Field label="Hero Badge Text (small label above title)" value={form.hero_badge_text} onChange={(v) => setF("hero_badge_text", v)} />
          <Field label="Offer End (local time)" type="datetime-local" value={form.offer_end_iso} onChange={(v) => setF("offer_end_iso", v)} hint="Used by the countdown next to top banner" />
        </div>
      </Section>

      {/* ===== Contact & Delivery ===== */}
      <Section icon={Phone} title="Contact & Delivery" subtitle="Phone, WhatsApp, Facebook, delivery charges">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Phone" value={form.phone} onChange={(v) => setF("phone", v)} />
          <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setF("whatsapp", v)} />
          <Field label="Facebook URL" value={form.facebook} onChange={(v) => setF("facebook", v)} placeholder="https://facebook.com/..." />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inside Dhaka (৳)" type="number" value={form.delivery_inside_dhaka} onChange={(v) => setF("delivery_inside_dhaka", v)} />
            <Field label="Outside Dhaka (৳)" type="number" value={form.delivery_outside_dhaka} onChange={(v) => setF("delivery_outside_dhaka", v)} />
          </div>
        </div>
      </Section>

      {/* ===== Facebook Pixel (Ads tracking) ===== */}
      <Section icon={ShieldCheck} title="Facebook Pixel (Ads Conversion Tracking)" subtitle="Track PageView, InitiateCheckout, and Purchase events">
        <div className="space-y-3">
          <Field
            label="Facebook Pixel ID"
            value={form.fb_pixel_id}
            onChange={(v) => setF("fb_pixel_id", v)}
            placeholder="e.g. 1234567890123456"
            hint="Get this from Meta Events Manager → Data Sources → your Pixel → Settings. Leave empty to disable tracking."
          />
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-md p-4 text-sm text-zinc-300 font-en">
            <div className="font-bold text-white mb-2">Events sent automatically:</div>
            <ul className="space-y-1.5 list-disc list-inside text-zinc-400">
              <li><code className="text-[#ff5722]">PageView</code> — when landing page loads</li>
              <li><code className="text-[#ff5722]">InitiateCheckout</code> — when user clicks any "Order Now" CTA</li>
              <li><code className="text-[#ff5722]">Purchase</code> — when order submits successfully (with value, currency=BDT, order_id)</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              In Meta Ads Manager, optimize your campaigns for the <strong className="text-zinc-300">Purchase</strong> event for best results.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== Packages ===== */}
      <Section icon={Tag} title="Packages" subtitle={`${packages.length} package(s) — name, price, label, popular flag`}>
        <div className="space-y-3">
          {packages.map((p, idx) => (
            <div key={p.id} className="card-admin border border-zinc-800 rounded-lg p-4 bg-[#0d0d0e]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-zinc-500 font-en">#{idx + 1}</div>
                <ListRowControls
                  canUp={idx > 0}
                  canDown={idx < packages.length - 1}
                  onUp={() => setPackages(move(packages, idx, idx - 1))}
                  onDown={() => setPackages(move(packages, idx, idx + 1))}
                  onDelete={() => setPackages(packages.filter((_, i) => i !== idx))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <label className="label">Name</label>
                  <input className="input" value={p.name} onChange={(e) => setPackages(packages.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))} />
                </div>
                <div className="md:col-span-1">
                  <label className="label">Pcs</label>
                  <input type="number" className="input" value={p.pieces} onChange={(e) => setPackages(packages.map((x, i) => (i === idx ? { ...x, pieces: e.target.value } : x)))} />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Price ৳</label>
                  <input type="number" className="input" value={p.price} onChange={(e) => setPackages(packages.map((x, i) => (i === idx ? { ...x, price: e.target.value } : x)))} />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Original ৳</label>
                  <input type="number" className="input" value={p.original_price || ""} onChange={(e) => setPackages(packages.map((x, i) => (i === idx ? { ...x, original_price: e.target.value } : x)))} />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Save Label</label>
                  <input className="input" value={p.save_label || ""} placeholder="সেভ ৳১০০" onChange={(e) => setPackages(packages.map((x, i) => (i === idx ? { ...x, save_label: e.target.value } : x)))} />
                </div>
                <div className="md:col-span-12">
                  <label className="flex items-center gap-2 text-sm text-zinc-300 font-en mt-2">
                    <input type="checkbox" checked={p.popular} onChange={(e) => setPackages(packages.map((x, i) => (i === idx ? { ...x, popular: e.target.checked } : x)))} />
                    Mark as Popular (🔥)
                  </label>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPackages([...packages, { id: crypto.randomUUID(), name: "New Package", pieces: 1, price: 0, original_price: 0, save_label: "", popular: false }])}
            className="btn-ghost"
            data-testid="add-package"
          >
            <Plus size={14} /> Add Package
          </button>
        </div>
      </Section>

      {/* ===== Images ===== */}
      <Section icon={ImageIcon} title="Product Images" subtitle={`${images.length} image(s) — URLs displayed in the hero grid`}>
        <div className="space-y-3">
          {images.map((u, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-14 h-14 rounded bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {u ? <img src={u} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-zinc-600" />}
              </div>
              <input className="input flex-1" value={u} placeholder="https://..." onChange={(e) => setImages(images.map((x, idx) => (idx === i ? e.target.value : x)))} />
              <ListRowControls
                canUp={i > 0}
                canDown={i < images.length - 1}
                onUp={() => setImages(move(images, i, i - 1))}
                onDown={() => setImages(move(images, i, i + 1))}
                onDelete={() => setImages(images.filter((_, idx) => idx !== i))}
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <label className={`btn-ghost cursor-pointer ${uploadingImage ? "opacity-60 pointer-events-none" : ""}`}>
              <ImageIcon size={14} /> {uploadingImage ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="upload-image" />
            </label>
            <button type="button" onClick={() => setImages([...images, ""])} className="btn-ghost" data-testid="add-image">
              <Plus size={14} /> Add Image URL
            </button>
          </div>
        </div>
      </Section>

      {/* ===== Features ===== */}
      <Section icon={ListChecks} title="Features (Why Use)" subtitle={`${features.length} bullet point(s) in 'কেন ব্যবহার করবেন' section`}>
        <Field label="Section Title" value={form.why_use_title} onChange={(v) => setF("why_use_title", v)} />
        <div className="mt-4 space-y-2">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-en w-6">{i + 1}.</span>
              <input className="input flex-1" value={f} onChange={(e) => setFeatures(features.map((x, idx) => (idx === i ? e.target.value : x)))} />
              <ListRowControls
                canUp={i > 0}
                canDown={i < features.length - 1}
                onUp={() => setFeatures(move(features, i, i - 1))}
                onDown={() => setFeatures(move(features, i, i + 1))}
                onDelete={() => setFeatures(features.filter((_, idx) => idx !== i))}
              />
            </div>
          ))}
          <button type="button" onClick={() => setFeatures([...features, ""])} className="btn-ghost mt-2" data-testid="add-feature">
            <Plus size={14} /> Add Feature
          </button>
        </div>
      </Section>

      {/* ===== Trust Badges ===== */}
      <Section icon={ShieldCheck} title="Trust Badges" subtitle={`${trustBadges.length} badge(s) — small icon + label cards`}>
        <div className="space-y-3">
          {trustBadges.map((b, i) => (
            <div key={b.id || i} className="card-admin border border-zinc-800 rounded-lg p-4 bg-[#0d0d0e]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-zinc-500 font-en">Badge #{i + 1}</div>
                <ListRowControls
                  canUp={i > 0}
                  canDown={i < trustBadges.length - 1}
                  onUp={() => setTrustBadges(move(trustBadges, i, i - 1))}
                  onDown={() => setTrustBadges(move(trustBadges, i, i + 1))}
                  onDelete={() => setTrustBadges(trustBadges.filter((_, idx) => idx !== i))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="label">Label</label>
                  <input className="input" value={b.label} onChange={(e) => setTrustBadges(trustBadges.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))} />
                </div>
                <div>
                  <label className="label">Icon</label>
                  <select className="input" value={b.icon} onChange={(e) => setTrustBadges(trustBadges.map((x, idx) => (idx === i ? { ...x, icon: e.target.value } : x)))}>
                    {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="label">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTrustBadges(trustBadges.map((x, idx) => (idx === i ? { ...x, color: c } : x)))}
                        className={`px-3 py-1.5 rounded-md border-2 text-xs font-en capitalize ${
                          b.color === c ? "ring-2 ring-white/60" : ""
                        } ${COLOR_PREVIEW[c]}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setTrustBadges([...trustBadges, { id: crypto.randomUUID(), label: "নতুন badge", icon: "ShieldCheck", color: "blue" }])}
            className="btn-ghost"
            data-testid="add-trust-badge"
          >
            <Plus size={14} /> Add Trust Badge
          </button>
        </div>
      </Section>

      {/* ===== Quality / Social Proof ===== */}
      <Section icon={Sparkles} title="Quality / Social Proof Box" subtitle="The yellow-heading section with customer count">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Section Title" value={form.quality_title} onChange={(v) => setF("quality_title", v)} />
          <Field label="Customer Count Number" type="number" value={form.customer_count} onChange={(v) => setF("customer_count", v)} />
          <div className="md:col-span-2">
            <TextArea label="Body Message" value={form.quality_message} onChange={(v) => setF("quality_message", v)} rows={2} />
          </div>
          <Field label="Customer Count Label" value={form.customer_count_label} onChange={(v) => setF("customer_count_label", v)} />
          <Field label="Urgency Callout (red box above prices)" value={form.urgency_text} onChange={(v) => setF("urgency_text", v)} />
        </div>
      </Section>

      {/* ===== Reviews ===== */}
      <Section icon={MessageSquare} title="Customer Reviews" subtitle={`${reviews.length} review(s) — name, stars, text, verified flag`}>
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div key={r.id || i} className="card-admin border border-zinc-800 rounded-lg p-4 bg-[#0d0d0e]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-zinc-500 font-en">Review #{i + 1}</div>
                <ListRowControls
                  canUp={i > 0}
                  canDown={i < reviews.length - 1}
                  onUp={() => setReviews(move(reviews, i, i - 1))}
                  onDown={() => setReviews(move(reviews, i, i + 1))}
                  onDelete={() => setReviews(reviews.filter((_, idx) => idx !== i))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <label className="label">Name</label>
                  <input className="input" value={r.name} onChange={(e) => setReviews(reviews.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} />
                </div>
                <div className="md:col-span-3">
                  <label className="label">Rating</label>
                  <select className="input" value={r.rating} onChange={(e) => setReviews(reviews.map((x, idx) => (idx === i ? { ...x, rating: Number(e.target.value) } : x)))}>
                    {[5, 4, 3, 2, 1].map((s) => (
                      <option key={s} value={s}>{"★".repeat(s)} ({s})</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4 flex items-end pb-2.5">
                  <label className="flex items-center gap-2 text-sm text-zinc-300 font-en">
                    <input type="checkbox" checked={!!r.verified} onChange={(e) => setReviews(reviews.map((x, idx) => (idx === i ? { ...x, verified: e.target.checked } : x)))} />
                    Verified Purchase
                  </label>
                </div>
                <div className="md:col-span-12">
                  <label className="label">Review Text</label>
                  <textarea rows={2} className="input" value={r.text} onChange={(e) => setReviews(reviews.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)))} />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setReviews([...reviews, { id: crypto.randomUUID(), name: "নাম", rating: 5, text: "রিভিউ লিখুন...", verified: true }])}
            className="btn-ghost"
            data-testid="add-review"
          >
            <Plus size={14} /> Add Review
          </button>
        </div>
      </Section>

      {/* ===== FAQs ===== */}
      <Section icon={HelpCircle} title="FAQs" subtitle={`${faqs.length} question(s) shown in accordion`}>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={f.id || i} className="card-admin border border-zinc-800 rounded-lg p-4 bg-[#0d0d0e]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-zinc-500 font-en">FAQ #{i + 1}</div>
                <ListRowControls
                  canUp={i > 0}
                  canDown={i < faqs.length - 1}
                  onUp={() => setFaqs(move(faqs, i, i - 1))}
                  onDown={() => setFaqs(move(faqs, i, i + 1))}
                  onDelete={() => setFaqs(faqs.filter((_, idx) => idx !== i))}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label">Question</label>
                  <input className="input" value={f.question} onChange={(e) => setFaqs(faqs.map((x, idx) => (idx === i ? { ...x, question: e.target.value } : x)))} />
                </div>
                <div>
                  <label className="label">Answer</label>
                  <textarea rows={3} className="input" value={f.answer} onChange={(e) => setFaqs(faqs.map((x, idx) => (idx === i ? { ...x, answer: e.target.value } : x)))} />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFaqs([...faqs, { id: crypto.randomUUID(), question: "নতুন প্রশ্ন?", answer: "উত্তর লিখুন..." }])}
            className="btn-ghost"
            data-testid="add-faq"
          >
            <Plus size={14} /> Add FAQ
          </button>
        </div>
      </Section>

      {/* ===== Final CTA + Footer ===== */}
      <Section icon={Star} title="Final CTA & Footer" subtitle="Bottom call-to-action and footer text">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Final CTA Eyebrow (small label)" value={form.final_cta_eyebrow} onChange={(v) => setF("final_cta_eyebrow", v)} />
          <Field label="Final CTA Title" value={form.final_cta_title} onChange={(v) => setF("final_cta_title", v)} />
          <div className="md:col-span-2">
            <TextArea label="Final CTA Subtitle" value={form.final_cta_subtitle} onChange={(v) => setF("final_cta_subtitle", v)} rows={2} />
          </div>
          <Field label="Final CTA Note" value={form.final_cta_note} onChange={(v) => setF("final_cta_note", v)} />
          <Field label="Footer Message" value={form.footer_message} onChange={(v) => setF("footer_message", v)} />
        </div>
      </Section>

      <div className="text-center pt-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary max-w-md" data-testid="save-product-bottom">
          <Save size={16} /> {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}
