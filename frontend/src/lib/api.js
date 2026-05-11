import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getProduct = () => api.get("/product").then((r) => r.data);
export const updateProduct = (payload) =>
  api.put("/product", payload).then((r) => r.data);
export const createOrder = (payload) =>
  api.post("/orders", payload).then((r) => r.data);
export const listOrders = () => api.get("/orders").then((r) => r.data);
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}`, { status }).then((r) => r.data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`).then((r) => r.data);
export const getStats = () => api.get("/stats").then((r) => r.data);
export const adminLogin = (password) =>
  api.post("/admin/login", { password }).then((r) => r.data);
export const adminVerify = () => api.get("/admin/verify").then((r) => r.data);
