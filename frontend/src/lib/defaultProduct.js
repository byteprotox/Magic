// Default product fallback used by getProduct() when the Firestore doc at
// products/main does not yet exist. This keeps the landing page renderable
// on a fresh project before an admin has saved any product data.
//
// Once an admin signs in and saves the product editor, this fallback is
// replaced by the real Firestore document.

export const DEFAULT_PRODUCT = {
  id: "main",
  title: "ম্যাজিক টিস্যু",
  subtitle: "পুরুষদের আত্মবিশ্বাসের সেরা সঙ্গী",
  tagline: "অরিজিনাল জার্মান প্রোডাক্ট — ১০০% কার্যকর",
  description:
    "জার্মান ল্যাব টেস্টেড ম্যাজিক টিস্যু — সাইড ইফেক্ট মুক্ত, ভিটামিন E সমৃদ্ধ। সহবাসে ৩০–৪০ মিনিট দীর্ঘস্থায়িত্বের গ্যারান্টি।",
  images: [
    "https://blade-x.vercel.app/assets/product-1.jpg",
    "https://blade-x.vercel.app/assets/product-2.jpg",
    "https://blade-x.vercel.app/assets/product-3.jpg",
    "https://blade-x.vercel.app/assets/product-4.jpg",
  ],
  features: [
    "সহবাসে ৩০–৪০ মিনিট দীর্ঘস্থায়িত্বের গ্যারান্টি",
    "ভিটামিন E সমৃদ্ধ — কোনো ক্ষতি ছাড়াই কাজ করে",
    "জার্মান ল্যাব টেস্টেড — পার্শ্বপ্রতিক্রিয়ামুক্ত",
    "ডায়াবেটিস ও হার্টের রোগীরাও ব্যবহার করতে পারবেন",
    "মাত্র ২ মিনিটে কাজ শুরু করে",
    "পকেট সাইজ — সহজে বহনযোগ্য",
  ],
  packages: [
    {
      id: "pkg-starter",
      name: "Starter Pack — ১০ পিস",
      pieces: 10,
      price: 490,
      original_price: 690,
      save_label: "সাশ্রয় ৳২০০",
      popular: true,
    },
    {
      id: "pkg-premier",
      name: "Premier Pack — ২০ পিস",
      pieces: 20,
      price: 900,
      original_price: 1380,
      save_label: "সর্বোচ্চ সাশ্রয়",
      popular: false,
    },
  ],
  delivery_inside_dhaka: 60,
  delivery_outside_dhaka: 120,
  phone: "01336580900",
  whatsapp: "01336580900",
  facebook: "https://www.facebook.com/share/1CRYF44Qed/",
  rating: 4.8,
  review_count: 2847,
  reviews: [
    {
      id: "r1",
      name: "রাহাত হোসেন",
      rating: 5,
      text:
        "অসাধারণ প্রোডাক্ট! সত্যিই কাজ করে। ৩৫ মিনিট পর্যন্ত পার্থক্য টের পাই। রেকমেন্ড করছি।",
      verified: true,
    },
    {
      id: "r2",
      name: "ইমরান কবির",
      rating: 5,
      text:
        "২ বছর ধরে ব্যবহার করছি। কোনো সাইড ইফেক্ট নেই, অরিজিনাল প্রোডাক্ট। ডেলিভারিও দ্রুত।",
      verified: true,
    },
    {
      id: "r3",
      name: "সাকিব আহমেদ",
      rating: 5,
      text:
        "প্রথমে সন্দেহ ছিল, কিন্তু ব্যবহার করে সত্যিই অবাক হলাম। দারুণ কাজ করে।",
      verified: true,
    },
    {
      id: "r4",
      name: "তানভীর রহমান",
      rating: 5,
      text:
        "গোপনীয় প্যাকেজিংয়ে ডেলিভারি পেয়েছি, খুব ভালো লাগলো। প্রোডাক্টও অরিজিনাল।",
      verified: true,
    },
  ],
  faqs: [
    {
      id: "f1",
      question: "কিভাবে ব্যবহার করব?",
      answer:
        "প্রতিবার সহবাসের ২-৩ মিনিট আগে লিঙ্গ ধুয়ে শুকনো কাপড় বা টিস্যু দিয়ে মুছে নেবেন। তারপর লিঙ্গের আগা থেকে অর্ধেক পর্যন্ত ২-৩ বার মুছবেন টিস্যুটি দিয়ে এবং চারপাশে একটু মালিশ করবেন। ৩০ সেকেন্ডের মধ্যে শুকিয়ে যাবে। ২ মিনিট অপেক্ষা করে সহবাসে যাবেন।",
    },
    {
      id: "f2",
      question: "এটা কি অরিজিনাল প্রোডাক্ট?",
      answer:
        "হ্যাঁ, ১০০% অরিজিনাল জার্মান ল্যাব টেস্টেড প্রোডাক্ট। আমরা সরাসরি ইম্পোর্টেড স্টক বিক্রি করি।",
    },
    {
      id: "f3",
      question: "কোনো সাইড ইফেক্ট আছে কি?",
      answer:
        "না, এটি ভিটামিন E সমৃদ্ধ এবং সম্পূর্ণ সাইড ইফেক্ট মুক্ত। ডায়াবেটিস ও হার্টের রোগীরাও নিশ্চিন্তে ব্যবহার করতে পারবেন।",
    },
    {
      id: "f4",
      question: "ডেলিভারি কতদিনে পাব?",
      answer:
        "ঢাকার ভিতরে ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ২-৪ কর্মদিবস। সম্পূর্ণ গোপন প্যাকেজিংয়ে ডেলিভারি দেওয়া হয়।",
    },
    {
      id: "f5",
      question: "পেমেন্ট কিভাবে করব?",
      answer:
        "ক্যাশ অন ডেলিভারি। পণ্যটি হাতে পেয়ে চেক করে তারপর পেমেন্ট করবেন।",
    },
    {
      id: "f6",
      question: "অর্ডার কিভাবে করব?",
      answer:
        "এই পেইজের অর্ডার ফর্মে নাম, ফোন নম্বর ও ঠিকানা দিয়ে সাবমিট করুন। আমরা শীঘ্রই কনফার্ম কল করব।",
    },
  ],
  offer_end_iso: null,
  banner_text: "অফার সীমিত সময়ের জন্য! আজই অর্ডার করুন — ক্যাশ অন ডেলিভারি",
  ticker_text:
    "🔥 আজকের স্পেশাল অফার — Starter Pack মাত্র ৳৪৯০ ✦ গোপন প্যাকেজিং ✦ ক্যাশ অন ডেলিভারি ✦ জার্মান ল্যাব টেস্টেড ✦ সাইড ইফেক্ট মুক্ত ✦ ২৪-৭২ ঘণ্টায় ডেলিভারি ✦",
  hero_badge_text: "⭐ অরিজিনাল জার্মান প্রোডাক্ট • ১০০% কার্যকর",
  why_use_title: "✨ কেন ব্যবহার করবেন?",
  quality_title: "দামে নয়—আপনি ফোকাস করুন কোয়ালিটিতে",
  quality_message:
    "এখনো ভাবছেন কিনবেন কিনা? প্রথমবার আপনার মত চিন্তা করেছিল।",
  customer_count: 10000,
  customer_count_label: "মানুষ এখন খুশি!",
  urgency_text:
    "নকল কিনে পরে আফসোস নয়—শুরুতেই অরিজিনাল কোয়ালিটি নিন।",
  final_cta_eyebrow: "সীমিত সময়ের অফার",
  final_cta_title: "আজই আত্মবিশ্বাস ফিরে পান!",
  final_cta_subtitle: "হাজার হাজার পুরুষ ইতিমধ্যে উপকৃত হয়েছেন — আপনার পালা!",
  final_cta_note: "ক্যাশ অন ডেলিভারি | গোপন প্যাকেজিং | ১০০% অরিজিনাল",
  footer_message: "বিশ্বাসের আরেক নাম — শতভাগ কোয়ালিটি গ্যারান্টিসহ",
  site_name: "ম্যাজিক টিস্যু",
  fb_pixel_id: null,
  trust_badges: [
    { id: "tb1", label: "জার্মান ল্যাব টেস্টেড", icon: "Award", color: "blue" },
    { id: "tb2", label: "সাইড ইফেক্ট মুক্ত", icon: "ShieldCheck", color: "green" },
    { id: "tb3", label: "গোপন প্যাকেজিং", icon: "Lock", color: "purple" },
    { id: "tb4", label: "ক্যাশ অন ডেলিভারি", icon: "Truck", color: "orange" },
  ],
  updated_at: null,
};

// Convenience: shallow-merge an arbitrary product doc on top of the default
// so newly added fields always have a sane fallback even if Firestore is
// missing them (e.g. older docs from before a feature was added).
export function mergeWithDefault(doc) {
  if (!doc || typeof doc !== "object") return { ...DEFAULT_PRODUCT };
  return { ...DEFAULT_PRODUCT, ...doc };
}
