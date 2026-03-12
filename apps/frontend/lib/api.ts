import axios from "axios";
import { getToken } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data as {
    ok: boolean;
    file: { name: string; type?: string; size: number; url: string };
  };
}

