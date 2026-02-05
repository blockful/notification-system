export async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getAuthCookieValue(): Promise<string | null> {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return null;
  return hashSecret(secret);
}
