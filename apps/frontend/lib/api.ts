import axios from "axios";
import { getToken } from "./auth";
import type { EncryptedAttachmentMeta } from "./crypto";

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

export async function uploadFile(payload: { blob: Blob; meta: EncryptedAttachmentMeta }) {
  const form = new FormData();
  form.append("file", payload.blob, payload.meta.name || "file.bin");
  form.append("encrypted", "true");
  if (payload.meta.iv) form.append("iv", payload.meta.iv);
  if (payload.meta.key_fingerprint) form.append("key_fingerprint", payload.meta.key_fingerprint);

  const res = await api.post("/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data as {
    ok: boolean;
    file: { name: string; type?: string; size: number; url: string; iv?: string; key_fingerprint?: string };
  };
}
