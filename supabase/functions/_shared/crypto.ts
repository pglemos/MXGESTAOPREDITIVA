const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptToken(plaintext: string): Promise<string> {
  const secret = requireEnv("GOOGLE_TOKEN_ENCRYPTION_SECRET", Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_SECRET"));
  const key = await deriveAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(plaintext));
  return `v1.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptToken(payload: string): Promise<string> {
  if (!payload.startsWith("v1.")) return payload;

  const [, ivPart, cipherPart] = payload.split(".");
  if (!ivPart || !cipherPart) throw new Error("Invalid encrypted token payload");

  const secret = requireEnv("GOOGLE_TOKEN_ENCRYPTION_SECRET", Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_SECRET"));
  const key = await deriveAesKey(secret);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(ivPart) },
    key,
    fromBase64Url(cipherPart),
  );

  return textDecoder.decode(plaintext);
}
