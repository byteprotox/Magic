"""Backend API tests for Magic Tissue landing page (iteration 2)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Product ----------
class TestProduct:
    def test_get_product(self):
        r = requests.get(f"{API}/product", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["title", "packages", "reviews", "faqs", "features", "images", "offer_end_iso",
                  "delivery_inside_dhaka", "delivery_outside_dhaka"]:
            assert k in d, f"missing {k}"
        assert len(d["packages"]) >= 2
        assert d["delivery_inside_dhaka"] == 60
        assert d["delivery_outside_dhaka"] == 120
        prices = [p["price"] for p in d["packages"]]
        pieces = [p["pieces"] for p in d["packages"]]
        assert 490 in prices and 900 in prices
        assert 10 in pieces and 20 in pieces
        assert "ম্যাজিক টিস্যু" in d["title"]

    def test_update_product_requires_auth(self):
        r = requests.put(f"{API}/product", json={"title": "x"}, timeout=15)
        assert r.status_code == 401

    def test_update_product_with_auth(self, auth_headers):
        # capture original
        orig = requests.get(f"{API}/product", timeout=15).json()
        new_title = "ম্যাজিক টিস্যু TEST"
        r = requests.put(f"{API}/product", json={"title": new_title}, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["title"] == new_title
        # verify persistence
        g = requests.get(f"{API}/product", timeout=15).json()
        assert g["title"] == new_title
        # restore
        requests.put(f"{API}/product", json={"title": orig["title"]}, headers=auth_headers, timeout=15)

    def test_get_product_has_new_fields(self):
        r = requests.get(f"{API}/product", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["banner_text", "ticker_text", "hero_badge_text", "why_use_title",
                  "quality_title", "quality_message", "customer_count", "customer_count_label",
                  "urgency_text", "final_cta_eyebrow", "final_cta_title", "final_cta_subtitle",
                  "final_cta_note", "footer_message", "site_name", "trust_badges"]:
            assert k in d, f"missing new field {k}"
        assert isinstance(d["trust_badges"], list)
        assert len(d["trust_badges"]) >= 1
        b = d["trust_badges"][0]
        for k in ["id", "label", "icon", "color"]:
            assert k in b
        assert isinstance(d["customer_count"], int)

    def test_update_all_new_fields_persists(self, auth_headers):
        orig = requests.get(f"{API}/product", timeout=15).json()
        payload = {
            "banner_text": "TEST BANNER",
            "ticker_text": "TEST TICKER",
            "hero_badge_text": "TEST BADGE",
            "why_use_title": "TEST WHY",
            "quality_title": "TEST QT",
            "quality_message": "TEST QM",
            "customer_count": 12345,
            "customer_count_label": "TEST CCL",
            "urgency_text": "TEST URG",
            "final_cta_eyebrow": "TEST EB",
            "final_cta_title": "TEST FCT",
            "final_cta_subtitle": "TEST FCS",
            "final_cta_note": "TEST FCN",
            "footer_message": "TEST FM",
            "site_name": "TEST SITE",
            "trust_badges": [
                {"id": "tb1", "label": "TEST B1", "icon": "Award", "color": "green"},
                {"id": "tb2", "label": "TEST B2", "icon": "Lock", "color": "purple"},
            ],
            "reviews": [
                {"id": "rv1", "name": "TEST Reviewer", "rating": 4, "text": "TEST REV", "verified": False},
            ],
            "faqs": [
                {"id": "fq1", "question": "TEST Q?", "answer": "TEST A"},
            ],
        }
        r = requests.put(f"{API}/product", json=payload, headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        g = requests.get(f"{API}/product", timeout=15).json()
        for k, v in payload.items():
            if k in ("trust_badges", "reviews", "faqs"):
                assert len(g[k]) == len(v)
            else:
                assert g[k] == v, f"{k} mismatch: {g[k]!r} != {v!r}"
        # verify reviewer fields persisted
        assert g["reviews"][0]["name"] == "TEST Reviewer"
        assert g["reviews"][0]["rating"] == 4
        assert g["reviews"][0]["verified"] is False
        assert g["faqs"][0]["question"] == "TEST Q?"
        assert g["trust_badges"][0]["icon"] == "Award"
        assert g["trust_badges"][1]["color"] == "purple"
        # restore relevant fields
        restore = {k: orig.get(k) for k in payload.keys()}
        requests.put(f"{API}/product", json=restore, headers=auth_headers, timeout=15)


# ---------- Admin Auth ----------
class TestAdminAuth:
    def test_login_success(self):
        r = requests.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        assert "token" in r.json()

    def test_login_failure(self):
        r = requests.post(f"{API}/admin/login", json={"password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_verify_no_token(self):
        r = requests.get(f"{API}/admin/verify", timeout=15)
        assert r.status_code == 401

    def test_verify_with_token(self, auth_headers):
        r = requests.get(f"{API}/admin/verify", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- Orders ----------
def _order_payload(phone="01711111111", address="Dhanmondi 32, Dhaka"):
    return {
        "name": "TEST Buyer",
        "phone": phone,
        "address": address,
        "note": "test",
        "package_id": "pkg-1",
        "package_name": "Starter Pack — ১০ পিস",
        "package_price": 490,
        "quantity": 1,
        "delivery_area": "inside_dhaka",
        "delivery_charge": 60,
        "total": 550,
    }


class TestOrders:
    created_id = None

    def test_create_order_valid(self, auth_headers):
        r = requests.post(f"{API}/orders", json=_order_payload(), timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "pending"
        assert d["total"] == 550
        assert "id" in d
        TestOrders.created_id = d["id"]
        # verify it appears in list
        lr = requests.get(f"{API}/orders", headers=auth_headers, timeout=15)
        assert lr.status_code == 200
        ids = [o["id"] for o in lr.json()]
        assert TestOrders.created_id in ids

    def test_create_order_invalid_phone(self):
        p = _order_payload(phone="123")
        r = requests.post(f"{API}/orders", json=p, timeout=15)
        assert r.status_code == 400

    def test_create_order_invalid_address(self):
        p = _order_payload(address="x")
        r = requests.post(f"{API}/orders", json=p, timeout=15)
        assert r.status_code == 400

    def test_list_orders_requires_auth(self):
        r = requests.get(f"{API}/orders", timeout=15)
        assert r.status_code == 401

    def test_update_status_transitions(self, auth_headers):
        assert TestOrders.created_id, "no order id from create test"
        oid = TestOrders.created_id
        for s in ["confirmed", "shipped", "delivered"]:
            r = requests.patch(f"{API}/orders/{oid}", json={"status": s}, headers=auth_headers, timeout=15)
            assert r.status_code == 200, r.text
            assert r.json()["status"] == s

    def test_update_status_invalid(self, auth_headers):
        oid = TestOrders.created_id
        r = requests.patch(f"{API}/orders/{oid}", json={"status": "nope"}, headers=auth_headers, timeout=15)
        assert r.status_code == 400

    def test_update_status_unauth(self):
        oid = TestOrders.created_id
        r = requests.patch(f"{API}/orders/{oid}", json={"status": "cancelled"}, timeout=15)
        assert r.status_code == 401

    def test_delete_order(self, auth_headers):
        oid = TestOrders.created_id
        r = requests.delete(f"{API}/orders/{oid}", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        # verify deletion: subsequent patch should 404
        r2 = requests.patch(f"{API}/orders/{oid}", json={"status": "confirmed"}, headers=auth_headers, timeout=15)
        assert r2.status_code == 404

    def test_delete_unknown(self, auth_headers):
        r = requests.delete(f"{API}/orders/non-existent-id", headers=auth_headers, timeout=15)
        assert r.status_code == 404


# ---------- Stats ----------
class TestStats:
    def test_stats_requires_auth(self):
        r = requests.get(f"{API}/stats", timeout=15)
        assert r.status_code == 401

    def test_stats_shape(self, auth_headers):
        r = requests.get(f"{API}/stats", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_orders", "total_revenue", "pending", "confirmed", "shipped",
                  "delivered", "cancelled", "daily"]:
            assert k in d
        assert isinstance(d["daily"], list)
        assert len(d["daily"]) == 7
        for entry in d["daily"]:
            assert "date" in entry and "orders" in entry and "revenue" in entry
