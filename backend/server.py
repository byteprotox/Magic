"""Magic Tissue backend — Firestore-powered.

Migrated from MongoDB (motor) to Google Cloud Firestore via firebase-admin.
API contracts remain identical to keep the frontend untouched.
"""
import asyncio
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional
from urllib.parse import quote

import firebase_admin
from firebase_admin import credentials, firestore, storage
from fastapi import APIRouter, Depends, FastAPI, File, Header, HTTPException, UploadFile
from dotenv import load_dotenv
from google.cloud.firestore_v1 import Query
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN")

if not ADMIN_PASSWORD or not ADMIN_TOKEN:
    raise RuntimeError("ADMIN_PASSWORD and ADMIN_TOKEN environment variables must be set")

# -------- Firebase Admin / Firestore init (singleton) --------
if not firebase_admin._apps:
    cred_path = os.environ.get("FIREBASE_CREDENTIALS_PATH")
    default_cred_path = ROOT_DIR / "secrets" / "firebase-admin.json"
    selected_cred_path = Path(cred_path) if cred_path else default_cred_path
    if not selected_cred_path.is_absolute():
        selected_cred_path = ROOT_DIR / selected_cred_path
    app_options = {}
    project_id = (
        os.environ.get("FIREBASE_PROJECT_ID")
        or os.environ.get("GOOGLE_CLOUD_PROJECT")
        or os.environ.get("GCLOUD_PROJECT")
    )
    if project_id:
        app_options["projectId"] = project_id
    storage_bucket = os.environ.get("FIREBASE_STORAGE_BUCKET") or (
        f"{project_id}.firebasestorage.app" if project_id else None
    )
    if storage_bucket:
        app_options["storageBucket"] = storage_bucket

    if selected_cred_path.exists():
        cred = credentials.Certificate(str(selected_cred_path))
        firebase_admin.initialize_app(cred, app_options or None)
    else:
        firebase_admin.initialize_app(options=app_options or None)

# Sync Firestore client — we wrap each call in asyncio.to_thread() for FastAPI async routes
fs = firestore.client()
PRODUCTS = fs.collection("products")
ORDERS = fs.collection("orders")
BUCKET = storage.bucket()

app = FastAPI()
api_router = APIRouter(prefix="/api")


# -------- Models (identical to MongoDB version) --------
class Package(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    pieces: int
    price: int
    original_price: Optional[int] = None
    save_label: Optional[str] = None
    popular: bool = False


class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    rating: int = 5
    text: str
    verified: bool = True


class FAQItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    answer: str


class TrustBadge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    icon: str = "ShieldCheck"
    color: str = "blue"


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default="main")
    title: str
    subtitle: str
    tagline: str
    description: str
    images: List[str] = []
    features: List[str] = []
    packages: List[Package] = []
    delivery_inside_dhaka: int = 60
    delivery_outside_dhaka: int = 110
    phone: str = "01975490546"
    whatsapp: str = "01975490546"
    facebook: str = "https://facebook.com"
    rating: float = 4.8
    review_count: int = 2847
    reviews: List[Review] = []
    faqs: List[FAQItem] = []
    offer_end_iso: Optional[str] = None
    banner_text: str = ""
    ticker_text: str = ""
    hero_badge_text: str = ""
    why_use_title: str = ""
    quality_title: str = ""
    quality_message: str = ""
    customer_count: int = 10000
    customer_count_label: str = ""
    urgency_text: str = ""
    final_cta_eyebrow: str = ""
    final_cta_title: str = ""
    final_cta_subtitle: str = ""
    final_cta_note: str = ""
    footer_message: str = ""
    site_name: str = "ম্যাজিক টিস্যু"
    fb_pixel_id: Optional[str] = None
    trust_badges: List[TrustBadge] = []
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    features: Optional[List[str]] = None
    packages: Optional[List[Package]] = None
    delivery_inside_dhaka: Optional[int] = None
    delivery_outside_dhaka: Optional[int] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    facebook: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    reviews: Optional[List[Review]] = None
    faqs: Optional[List[FAQItem]] = None
    offer_end_iso: Optional[str] = None
    banner_text: Optional[str] = None
    ticker_text: Optional[str] = None
    hero_badge_text: Optional[str] = None
    why_use_title: Optional[str] = None
    quality_title: Optional[str] = None
    quality_message: Optional[str] = None
    customer_count: Optional[int] = None
    customer_count_label: Optional[str] = None
    urgency_text: Optional[str] = None
    final_cta_eyebrow: Optional[str] = None
    final_cta_title: Optional[str] = None
    final_cta_subtitle: Optional[str] = None
    final_cta_note: Optional[str] = None
    footer_message: Optional[str] = None
    site_name: Optional[str] = None
    fb_pixel_id: Optional[str] = None
    trust_badges: Optional[List[TrustBadge]] = None


class OrderCreate(BaseModel):
    name: Optional[str] = ""
    phone: str
    address: str
    note: Optional[str] = ""
    package_id: str
    package_name: str
    package_price: int
    quantity: int = 1
    delivery_area: str
    delivery_charge: int
    total: int


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    phone: str
    address: str
    note: str = ""
    package_id: str
    package_name: str
    package_price: int
    quantity: int
    delivery_area: str
    delivery_charge: int
    total: int
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OrderStatusUpdate(BaseModel):
    status: str


class LoginPayload(BaseModel):
    password: str


# -------- Auth dep --------
def require_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1].strip()
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")
    return True


# -------- Default product seed --------
def default_product() -> dict:
    p = Product(
        id="main",
        title="ম্যাজিক টিস্যু",
        subtitle="পুরুষদের আত্মবিশ্বাসের সেরা সঙ্গী",
        tagline="অরিজিনাল জার্মান প্রোডাক্ট — ১০০% কার্যকর",
        description="জার্মান ল্যাব টেস্টেড ম্যাজিক টিস্যু — সাইড ইফেক্ট মুক্ত, ভিটামিন E সমৃদ্ধ। সহবাসে ৩০–৪০ মিনিট দীর্ঘস্থায়িত্বের গ্যারান্টি।",
        images=[
            "https://blade-x.vercel.app/assets/product-1.jpg",
            "https://blade-x.vercel.app/assets/product-2.jpg",
            "https://blade-x.vercel.app/assets/product-3.jpg",
            "https://blade-x.vercel.app/assets/product-4.jpg",
        ],
        features=[
            "সহবাসে ৩০–৪০ মিনিট দীর্ঘস্থায়িত্বের গ্যারান্টি",
            "ভিটামিন E সমৃদ্ধ — কোনো ক্ষতি ছাড়াই কাজ করে",
            "জার্মান ল্যাব টেস্টেড — পার্শ্বপ্রতিক্রিয়ামুক্ত",
            "ডায়াবেটিস ও হার্টের রোগীরাও ব্যবহার করতে পারবেন",
            "মাত্র ২ মিনিটে কাজ শুরু করে",
            "পকেট সাইজ — সহজে বহনযোগ্য",
        ],
        packages=[
            Package(name="Starter Pack — ১০ পিস", pieces=10, price=490, original_price=690, save_label="সাশ্রয় ৳২০০", popular=True),
            Package(name="Premier Pack — ২০ পিস", pieces=20, price=900, original_price=1380, save_label="সর্বোচ্চ সাশ্রয়", popular=False),
        ],
        delivery_inside_dhaka=60,
        delivery_outside_dhaka=120,
        phone="01336580900",
        whatsapp="01336580900",
        facebook="https://www.facebook.com/share/1CRYF44Qed/",
        rating=4.8,
        review_count=2847,
        reviews=[
            Review(name="রাহাত হোসেন", rating=5, text="অসাধারণ প্রোডাক্ট! সত্যিই কাজ করে। ৩৫ মিনিট পর্যন্ত পার্থক্য টের পাই। রেকমেন্ড করছি।"),
            Review(name="ইমরান কবির", rating=5, text="২ বছর ধরে ব্যবহার করছি। কোনো সাইড ইফেক্ট নেই, অরিজিনাল প্রোডাক্ট। ডেলিভারিও দ্রুত।"),
            Review(name="সাকিব আহমেদ", rating=5, text="প্রথমে সন্দেহ ছিল, কিন্তু ব্যবহার করে সত্যিই অবাক হলাম। দারুণ কাজ করে।"),
            Review(name="তানভীর রহমান", rating=5, text="গোপনীয় প্যাকেজিংয়ে ডেলিভারি পেয়েছি, খুব ভালো লাগলো। প্রোডাক্টও অরিজিনাল।"),
        ],
        faqs=[
            FAQItem(question="কিভাবে ব্যবহার করব?", answer="প্রতিবার সহবাসের ২-৩ মিনিট আগে লিঙ্গ ধুয়ে শুকনো কাপড় বা টিস্যু দিয়ে মুছে নেবেন। তারপর লিঙ্গের আগা থেকে অর্ধেক পর্যন্ত ২-৩ বার মুছবেন টিস্যুটি দিয়ে এবং চারপাশে একটু মালিশ করবেন। ৩০ সেকেন্ডের মধ্যে শুকিয়ে যাবে। ২ মিনিট অপেক্ষা করে সহবাসে যাবেন।"),
            FAQItem(question="এটা কি অরিজিনাল প্রোডাক্ট?", answer="হ্যাঁ, ১০০% অরিজিনাল জার্মান ল্যাব টেস্টেড প্রোডাক্ট। আমরা সরাসরি ইম্পোর্টেড স্টক বিক্রি করি।"),
            FAQItem(question="কোনো সাইড ইফেক্ট আছে কি?", answer="না, এটি ভিটামিন E সমৃদ্ধ এবং সম্পূর্ণ সাইড ইফেক্ট মুক্ত। ডায়াবেটিস ও হার্টের রোগীরাও নিশ্চিন্তে ব্যবহার করতে পারবেন।"),
            FAQItem(question="ডেলিভারি কতদিনে পাব?", answer="ঢাকার ভিতরে ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ২-৪ কর্মদিবস। সম্পূর্ণ গোপন প্যাকেজিংয়ে ডেলিভারি দেওয়া হয়।"),
            FAQItem(question="পেমেন্ট কিভাবে করব?", answer="ক্যাশ অন ডেলিভারি। পণ্যটি হাতে পেয়ে চেক করে তারপর পেমেন্ট করবেন।"),
            FAQItem(question="অর্ডার কিভাবে করব?", answer="এই পেইজের অর্ডার ফর্মে নাম, ফোন নম্বর ও ঠিকানা দিয়ে সাবমিট করুন। আমরা শীঘ্রই কনফার্ম কল করব।"),
        ],
        offer_end_iso=(datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
        banner_text="অফার সীমিত সময়ের জন্য! আজই অর্ডার করুন — ক্যাশ অন ডেলিভারি",
        ticker_text="🔥 আজকের স্পেশাল অফার — Starter Pack মাত্র ৳৪৯০ ✦ গোপন প্যাকেজিং ✦ ক্যাশ অন ডেলিভারি ✦ জার্মান ল্যাব টেস্টেড ✦ সাইড ইফেক্ট মুক্ত ✦ ২৪-৭২ ঘণ্টায় ডেলিভারি ✦",
        hero_badge_text="⭐ অরিজিনাল জার্মান প্রোডাক্ট • ১০০% কার্যকর",
        why_use_title="✨ কেন ব্যবহার করবেন?",
        quality_title="দামে নয়—আপনি ফোকাস করুন কোয়ালিটিতে",
        quality_message="এখনো ভাবছেন কিনবেন কিনা? প্রথমবার আপনার মত চিন্তা করেছিল।",
        customer_count=10000,
        customer_count_label="মানুষ এখন খুশি!",
        urgency_text="নকল কিনে পরে আফসোস নয়—শুরুতেই অরিজিনাল কোয়ালিটি নিন।",
        final_cta_eyebrow="সীমিত সময়ের অফার",
        final_cta_title="আজই আত্মবিশ্বাস ফিরে পান!",
        final_cta_subtitle="হাজার হাজার পুরুষ ইতিমধ্যে উপকৃত হয়েছেন — আপনার পালা!",
        final_cta_note="ক্যাশ অন ডেলিভারি | গোপন প্যাকেজিং | ১০০% অরিজিনাল",
        footer_message="বিশ্বাসের আরেক নাম — শতভাগ কোয়ালিটি গ্যারান্টিসহ",
        site_name="ম্যাজিক টিস্যু",
        trust_badges=[
            TrustBadge(label="জার্মান ল্যাব টেস্টেড", icon="Award", color="blue"),
            TrustBadge(label="সাইড ইফেক্ট মুক্ত", icon="ShieldCheck", color="green"),
            TrustBadge(label="গোপন প্যাকেজিং", icon="Lock", color="purple"),
            TrustBadge(label="ক্যাশ অন ডেলিভারি", icon="Truck", color="orange"),
        ],
    )
    return p.model_dump()


# -------- Firestore helpers (sync, wrapped in to_thread when called from async) --------
def _get_product_sync() -> Optional[dict]:
    snap = PRODUCTS.document("main").get()
    return snap.to_dict() if snap.exists else None


def _set_product_sync(data: dict) -> None:
    PRODUCTS.document("main").set(data, merge=False)


def _update_product_sync(payload: dict) -> dict:
    PRODUCTS.document("main").set(payload, merge=True)
    snap = PRODUCTS.document("main").get()
    return snap.to_dict()


def _ensure_product_sync() -> None:
    if _get_product_sync() is None:
        _set_product_sync(default_product())


def _create_order_sync(order: dict) -> None:
    ORDERS.document(order["id"]).set(order)


def _list_orders_sync() -> List[dict]:
    docs = ORDERS.order_by("created_at", direction=Query.DESCENDING).limit(1000).stream()
    return [d.to_dict() for d in docs]


def _get_order_sync(order_id: str) -> Optional[dict]:
    snap = ORDERS.document(order_id).get()
    return snap.to_dict() if snap.exists else None


def _update_order_sync(order_id: str, fields: dict) -> Optional[dict]:
    ref = ORDERS.document(order_id)
    if not ref.get().exists:
        return None
    ref.update(fields)
    return ref.get().to_dict()


def _delete_order_sync(order_id: str) -> bool:
    ref = ORDERS.document(order_id)
    if not ref.get().exists:
        return False
    ref.delete()
    return True


def _stats_sync() -> dict:
    docs = [d.to_dict() for d in ORDERS.limit(10000).stream()]
    total_orders = len(docs)
    total_revenue = sum(d.get("total", 0) for d in docs if d.get("status") != "cancelled")
    pending = sum(1 for d in docs if d.get("status") == "pending")
    confirmed = sum(1 for d in docs if d.get("status") == "confirmed")
    shipped = sum(1 for d in docs if d.get("status") == "shipped")
    delivered = sum(1 for d in docs if d.get("status") == "delivered")
    cancelled = sum(1 for d in docs if d.get("status") == "cancelled")

    today = datetime.now(timezone.utc).date()
    daily = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_str = d.isoformat()
        count = sum(1 for o in docs if o.get("created_at", "").startswith(day_str))
        revenue = sum(
            o.get("total", 0)
            for o in docs
            if o.get("created_at", "").startswith(day_str) and o.get("status") != "cancelled"
        )
        daily.append({"date": day_str, "orders": count, "revenue": revenue})

    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "pending": pending,
        "confirmed": confirmed,
        "shipped": shipped,
        "delivered": delivered,
        "cancelled": cancelled,
        "daily": daily,
    }


def _upload_image_sync(file: UploadFile, content: bytes) -> dict:
    token = str(uuid.uuid4())
    extension = Path(file.filename or "image").suffix.lower() or ".jpg"
    object_name = f"product-images/{uuid.uuid4()}{extension}"
    blob = BUCKET.blob(object_name)
    blob.metadata = {"firebaseStorageDownloadTokens": token}
    blob.upload_from_string(content, content_type=file.content_type)
    encoded_name = quote(object_name, safe="")
    url = f"https://firebasestorage.googleapis.com/v0/b/{BUCKET.name}/o/{encoded_name}?alt=media&token={token}"
    return {"url": url, "path": object_name}


# Async wrappers
async def get_product_doc() -> dict:
    doc = await asyncio.to_thread(_get_product_sync)
    if doc is None:
        await asyncio.to_thread(_ensure_product_sync)
        doc = await asyncio.to_thread(_get_product_sync)
    return doc


# -------- Routes (same signatures as before) --------
@api_router.get("/")
async def root():
    return {"message": "Magic Tissue API (Firestore)"}


@api_router.get("/product", response_model=Product)
async def get_product():
    doc = await get_product_doc()
    return Product(**doc)


@api_router.put("/product", response_model=Product)
async def update_product(update: ProductUpdate, _: bool = Depends(require_admin)):
    await get_product_doc()  # ensure exists
    payload = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    if "packages" in payload:
        payload["packages"] = [p if isinstance(p, dict) else p.model_dump() for p in payload["packages"]]
    if "reviews" in payload:
        payload["reviews"] = [r if isinstance(r, dict) else r.model_dump() for r in payload["reviews"]]
    if "faqs" in payload:
        payload["faqs"] = [f if isinstance(f, dict) else f.model_dump() for f in payload["faqs"]]
    if "trust_badges" in payload:
        payload["trust_badges"] = [t if isinstance(t, dict) else t.model_dump() for t in payload["trust_badges"]]
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    doc = await asyncio.to_thread(_update_product_sync, payload)
    return Product(**doc)


@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), _: bool = Depends(require_admin)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Image file is empty")
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be 5MB or smaller")
    return await asyncio.to_thread(_upload_image_sync, file, content)


@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    if not payload.phone or len(payload.phone.strip()) < 6:
        raise HTTPException(status_code=400, detail="Phone number is required")
    if not payload.address or len(payload.address.strip()) < 3:
        raise HTTPException(status_code=400, detail="Address is required")
    order = Order(**payload.model_dump())
    await asyncio.to_thread(_create_order_sync, order.model_dump())
    return order


@api_router.get("/orders", response_model=List[Order])
async def list_orders(_: bool = Depends(require_admin)):
    docs = await asyncio.to_thread(_list_orders_sync)
    return [Order(**d) for d in docs]


@api_router.patch("/orders/{order_id}", response_model=Order)
async def update_order_status(order_id: str, payload: OrderStatusUpdate, _: bool = Depends(require_admin)):
    allowed = {"pending", "confirmed", "shipped", "delivered", "cancelled"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    doc = await asyncio.to_thread(_update_order_sync, order_id, {"status": payload.status})
    if doc is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**doc)


@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, _: bool = Depends(require_admin)):
    ok = await asyncio.to_thread(_delete_order_sync, order_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True}


@api_router.get("/stats")
async def get_stats(_: bool = Depends(require_admin)):
    return await asyncio.to_thread(_stats_sync)


@api_router.post("/admin/login")
async def admin_login(payload: LoginPayload):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"token": ADMIN_TOKEN}


@api_router.get("/admin/verify")
async def admin_verify(_: bool = Depends(require_admin)):
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    await asyncio.to_thread(_ensure_product_sync)
    logger.info("Firestore backend ready")
