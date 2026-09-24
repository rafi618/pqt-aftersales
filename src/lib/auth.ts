// Very small staff login: one shared password (ADMIN_PASSWORD).
// The cookie holds a hash of the password, so changing the password logs everyone out.

export const AUTH_COOKIE = "pqt_staff";

export async function expectedToken(): Promise<string | null> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  const bytes = new TextEncoder().encode(`pqt-archive:${pw}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
