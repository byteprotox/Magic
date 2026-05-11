"""Backend API tests for Smart Pen Knife landing page."""
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
        assert len(d["packages"]) >= 3
        assert d["delivery_inside_dhaka"] == 60
        assert d["delivery_outside_dhaka"] == 110
        prices = [p["price"] for p in d["packages"]]
        assert 690 in prices and 1190 in prices and 1590 in prices

    def test_update_product_requires_auth(self):
        r = requests.put(f"{API}/product", json={"title": "x"}, timeout=15)
        assert r.status_code == 401

    def test_update_product_with_auth(self, auth_headers):
        # capture original
        orig = requests.get(f"{API}/product", timeout=15).json()
        new_title = "স্মার্ট পেন নাইফ TEST"
        r = requests.put(f"{API}/product", json={"title": new_title}, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["title"] == new_title
        # verify persistence
        g = requests.get(f"{API}/product", timeout=15).json()
        assert g["title"] == new_title
        # restore
        requests.put(f"{API}/product", json={"title": orig["title"]}, headers=auth_headers, timeout=15)


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
        "package_name": "১ পিস স্মার্ট পেন নাইফ",
        "package_price": 690,
        "quantity": 1,
        "delivery_area": "inside_dhaka",
        "delivery_charge": 60,
        "total": 750,
    }


class TestOrders:
    created_id = None

    def test_create_order_valid(self, auth_headers):
        r = requests.post(f"{API}/orders", json=_order_payload(), timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "pending"
        assert d["total"] == 750
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
