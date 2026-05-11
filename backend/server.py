from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', 'change-me')

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ============ Models ============

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


class OrderCreate(BaseModel):
    name: Optional[str] = ""
    phone: str
    address: str
    note: Optional[str] = ""
    package_id: str
    package_name: str
    package_price: int
    quantity: int = 1
    delivery_area: str  # "inside_dhaka" | "outside_dhaka"
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
    status: str = "pending"  # pending, confirmed, shipped, delivered, cancelled
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OrderStatusUpdate(BaseModel):
    status: str


class LoginPayload(BaseModel):
    password: str


# ============ Auth ============

def require_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1].strip()
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")
    return True


# ============ Default Product ============

def default_product() -> dict:
    p = Product(
        id="main",
        title="স্মার্ট পেন নাইফ",
        subtitle="পকেটে রাখুন, প্রয়োজনে ব্যবহার করুন",
        tagline="এই স্মার্ট পেন নাইফটাই আপনার ডেইলি লাইফের পারফেক্ট টুল",
        description="বাইরে থেকে দেখলে স্টাইলিশ পেন, ভিতরে আছে শার্প স্টেইনলেস স্টিল ব্লেড। ছোট, হালকা, কিন্তু কাজের সময় একদম পাওয়ারফুল।",
        images=[
            "https://nooranishop.com/wp-content/uploads/2026/05/Hd499a0d914fe4a2592904dc70abe6a4dQ.jpg",
            "https://nooranishop.com/wp-content/uploads/2026/05/H429c9dc0120a427b8e64f87f6204b296P.jpg",
            "https://nooranishop.com/wp-content/uploads/2026/05/H5d2a85b1accc47e4bd47fedd41533455s.jpg",
            "https://nooranishop.com/wp-content/uploads/2026/05/H74f5ef4d60ea48b88dfdace40e644fcck.jpg",
            "https://nooranishop.com/wp-content/uploads/2026/05/H7c046087234a4d188efe5adb5c41282e9.jpg",
            "https://nooranishop.com/wp-content/uploads/2026/05/H0b1cb8c85b4641d592f33bad2a54efcaI.jpg",
        ],
        features=[
            "বাইরে থেকে দেখলে স্টাইলিশ পেন",
            "ভিতরে আছে শার্প স্টেইনলেস স্টিল ব্লেড",
            "ছোট, হালকা, কিন্তু কাজের সময় পাওয়ারফুল",
            "কাজ শেষে আবার পেনের মতো রেখে দিন",
            "প্রিমিয়াম মেটাল বডি, মরিচা পড়বে না",
            "১০০% অরিজিনাল কোয়ালিটি গ্যারান্টি",
        ],
        packages=[
            Package(name="১ পিস স্মার্ট পেন নাইফ", pieces=1, price=690, original_price=890, popular=False),
            Package(name="২ পিস স্মার্ট পেন নাইফ", pieces=2, price=1190, original_price=1380, save_label="সেভ ৳১৯০", popular=True),
            Package(name="৩ পিস স্মার্ট পেন নাইফ", pieces=3, price=1590, original_price=2070, save_label="সর্বোচ্চ সাশ্রয়", popular=False),
        ],
        delivery_inside_dhaka=60,
        delivery_outside_dhaka=110,
        phone="01975490546",
        whatsapp="01975490546",
        facebook="https://facebook.com",
        rating=4.8,
        review_count=2847,
        reviews=[
            Review(name="রাহাত হোসেন", rating=5, text="অসাধারণ প্রোডাক্ট! পেনের মতো দেখতে কিন্তু ব্লেডটা অনেক ধারালো। ডেইলি ক্যারির জন্য পারফেক্ট।"),
            Review(name="ইমরান কবির", rating=5, text="প্যাকেট থেকে বের করেই টেস্ট করেছি — দারুণ বিল্ড কোয়ালিটি। দাম অনুযায়ী একদম ঠিক আছে।"),
            Review(name="সাকিব আহমেদ", rating=5, text="অফিসে কুরিয়ারের প্যাকেট খুলতে, ফল কাটতে — সব কাজেই কাজে আসে। গোপন প্যাকেজিংও ভালো ছিল।"),
            Review(name="তানভীর রহমান", rating=5, text="২ পিস নিয়েছিলাম, একটা বন্ধুকে গিফট করেছি। সবাই বলছে এটা প্রিমিয়াম লাগছে।"),
        ],
        faqs=[
            FAQItem(question="এটা কি আসল স্টেইনলেস স্টিল ব্লেড?", answer="হ্যাঁ, ১০০% অরিজিনাল স্টেইনলেস স্টিল ব্লেড। মরিচা পড়বে না, দীর্ঘদিন ধারালো থাকবে।"),
            FAQItem(question="পেমেন্ট কিভাবে করব?", answer="ক্যাশ অন ডেলিভারি। প্রোডাক্ট হাতে পেয়ে চেক করে তারপর পেমেন্ট করবেন।"),
            FAQItem(question="ডেলিভারি কতদিনে পাব?", answer="ঢাকার ভিতরে ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ২-৪ কর্মদিবস।"),
            FAQItem(question="অর্ডার কিভাবে করব?", answer="এই পেইজের অর্ডার ফর্মে নাম, ফোন নম্বর ও ঠিকানা দিয়ে সাবমিট করুন। আমরা শীঘ্রই কনফার্ম কল করব।"),
            FAQItem(question="রিটার্ন পলিসি কী?", answer="প্রোডাক্ট ত্রুটিপূর্ণ হলে ডেলিভারির সময়ই রিজেক্ট করতে পারবেন। আমরা ১০০% কোয়ালিটি গ্যারান্টি দিচ্ছি।"),
        ],
        offer_end_iso=(datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
    )
    return p.model_dump()


async def ensure_product():
    existing = await db.products.find_one({"id": "main"}, {"_id": 0})
    if not existing:
        await db.products.insert_one(default_product())


# ============ Routes ============

@api_router.get("/")
async def root():
    return {"message": "Smart Pen Knife API"}


@api_router.get("/product", response_model=Product)
async def get_product():
    await ensure_product()
    doc = await db.products.find_one({"id": "main"}, {"_id": 0})
    return Product(**doc)


@api_router.put("/product", response_model=Product)
async def update_product(update: ProductUpdate, _: bool = Depends(require_admin)):
    await ensure_product()
    payload = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    if "packages" in payload:
        payload["packages"] = [p if isinstance(p, dict) else p.model_dump() for p in payload["packages"]]
    if "reviews" in payload:
        payload["reviews"] = [r if isinstance(r, dict) else r.model_dump() for r in payload["reviews"]]
    if "faqs" in payload:
        payload["faqs"] = [f if isinstance(f, dict) else f.model_dump() for f in payload["faqs"]]
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.update_one({"id": "main"}, {"$set": payload})
    doc = await db.products.find_one({"id": "main"}, {"_id": 0})
    return Product(**doc)


@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    if not payload.phone or len(payload.phone.strip()) < 6:
        raise HTTPException(status_code=400, detail="Phone number is required")
    if not payload.address or len(payload.address.strip()) < 3:
        raise HTTPException(status_code=400, detail="Address is required")
    order = Order(**payload.model_dump())
    await db.orders.insert_one(order.model_dump())
    return order


@api_router.get("/orders", response_model=List[Order])
async def list_orders(_: bool = Depends(require_admin)):
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Order(**d) for d in docs]


@api_router.patch("/orders/{order_id}", response_model=Order)
async def update_order_status(order_id: str, payload: OrderStatusUpdate, _: bool = Depends(require_admin)):
    allowed = {"pending", "confirmed", "shipped", "delivered", "cancelled"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return Order(**doc)


@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, _: bool = Depends(require_admin)):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True}


@api_router.get("/stats")
async def get_stats(_: bool = Depends(require_admin)):
    docs = await db.orders.find({}, {"_id": 0}).to_list(10000)
    total_orders = len(docs)
    total_revenue = sum(d.get("total", 0) for d in docs if d.get("status") != "cancelled")
    pending = sum(1 for d in docs if d.get("status") == "pending")
    confirmed = sum(1 for d in docs if d.get("status") == "confirmed")
    shipped = sum(1 for d in docs if d.get("status") == "shipped")
    delivered = sum(1 for d in docs if d.get("status") == "delivered")
    cancelled = sum(1 for d in docs if d.get("status") == "cancelled")

    # Last 7 days chart
    today = datetime.now(timezone.utc).date()
    daily = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_str = d.isoformat()
        count = sum(1 for o in docs if o.get("created_at", "").startswith(day_str))
        revenue = sum(o.get("total", 0) for o in docs if o.get("created_at", "").startswith(day_str) and o.get("status") != "cancelled")
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
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    await ensure_product()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
