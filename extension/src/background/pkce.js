const CODE_VERIFIER_BYTES = 32;

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateCodeVerifier() {
  const randomBytes = new Uint8Array(CODE_VERIFIER_BYTES);
  crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes.buffer);
}

export async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

export function generateState() {
  const randomBytes = new Uint8Array(CODE_VERIFIER_BYTES);
  crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes.buffer);
}
