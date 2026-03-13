const KEY_STORAGE = "privchat_e2ee_key";

type Base64 = string;

export type EncryptedAttachmentMeta = {
  name: string;
  size: number;
  type?: string;
  url?: string;
  iv?: Base64;
  key_fingerprint?: string;
  encrypted?: boolean;
  original_type?: string;
};

export type BackupBundle = {
  blob: Base64;
  salt: Base64;
  iv: Base64;
  fingerprint: string;
  version: string;
};

export async function ensureKey(): Promise<CryptoKey> {
  const stored = typeof window !== "undefined" ? window.localStorage.getItem(KEY_STORAGE) : null;
  if (stored) {
    const raw = base64ToArrayBuffer(stored);
    return crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
  }

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt"
  ]);
  await persistKey(key);
  return key;
}

export async function keyFingerprint(): Promise<string> {
  const raw = await exportRawKey();
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return arrayBufferToBase64(hash);
}

export async function encryptText(plain: string) {
  const key = await ensureKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plain || "");
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    ciphertext: arrayBufferToBase64(cipher),
    iv: arrayBufferToBase64(iv),
    keyFingerprint: await keyFingerprint()
  };
}

export async function decryptText(ciphertext: string | null | undefined, iv?: string | null) {
  if (!ciphertext) return "";
  const key = await ensureKey();
  const ivBytes = iv ? base64ToArrayBuffer(iv) : new ArrayBuffer(12);
  const data = base64ToArrayBuffer(ciphertext);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, data);
  return new TextDecoder().decode(plain);
}

export async function encryptAttachment(file: File): Promise<{
  blob: Blob;
  meta: EncryptedAttachmentMeta;
}> {
  const key = await ensureKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buffer = await file.arrayBuffer();
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, buffer);
  const blob = new Blob([cipher], { type: "application/octet-stream" });
  return {
    blob,
    meta: {
      name: file.name,
      size: file.size,
      type: "application/octet-stream",
      original_type: file.type,
      iv: arrayBufferToBase64(iv),
      key_fingerprint: await keyFingerprint(),
      encrypted: true
    }
  };
}

export async function decryptAttachmentToUrl(meta: EncryptedAttachmentMeta) {
  if (!meta.url) throw new Error("missing url");
  const response = await fetch(meta.url);
  const cipherBuf = await response.arrayBuffer();
  const key = await ensureKey();
  const ivBytes = meta.iv ? base64ToArrayBuffer(meta.iv) : new Uint8Array(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, cipherBuf);
  const type = meta.original_type || meta.type || "application/octet-stream";
  const blob = new Blob([plain], { type });
  return {
    url: URL.createObjectURL(blob),
    type
  };
}

export async function createBackup(passphrase: string): Promise<BackupBundle> {
  const rawKey = await exportRawKey();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const derived = await deriveFromPassphrase(passphrase, salt);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, derived, rawKey);
  return {
    blob: arrayBufferToBase64(cipher),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    fingerprint: await keyFingerprint(),
    version: "v1"
  };
}

export async function restoreBackup(bundle: BackupBundle, passphrase: string) {
  const derived = await deriveFromPassphrase(passphrase, base64ToArrayBuffer(bundle.salt));
  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToArrayBuffer(bundle.iv) },
    derived,
    base64ToArrayBuffer(bundle.blob)
  );
  await importAndPersist(raw);
}

export async function decryptMessageBody(body: string | null, iv?: string | null) {
  if (!body) return "";
  return decryptText(body, iv);
}

async function deriveFromPassphrase(passphrase: string, salt: ArrayBuffer) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 120_000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function exportRawKey() {
  const key = await ensureKey();
  return crypto.subtle.exportKey("raw", key);
}

async function persistKey(key: CryptoKey) {
  const raw = await crypto.subtle.exportKey("raw", key);
  const b64 = arrayBufferToBase64(raw);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY_STORAGE, b64);
  }
}

async function importAndPersist(raw: ArrayBuffer) {
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
  await persistKey(key);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
