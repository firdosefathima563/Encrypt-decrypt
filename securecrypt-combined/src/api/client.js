// src/api/client.js
// Thin fetch wrapper for talking to the SecureCrypt backend.
// Set VITE_API_URL in a .env file (see .env.example) when deploying —
// it should point at your Render backend URL.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Stable per-browser id so "save to history" entries can be grouped
// without requiring a login. Not sensitive — just a grouping key.
function getSessionId() {
  let id = localStorage.getItem("securecrypt_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("securecrypt_session_id", id);
  }
  return id;
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSessionId(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  // RSA
  generateKeys: (bits) => request("/api/rsa/keys", { method: "POST", body: { bits } }),
  rsaEncrypt: (message, e, n) => request("/api/rsa/encrypt", { method: "POST", body: { message, e, n } }),
  rsaDecrypt: (ciphertext, d, n) => request("/api/rsa/decrypt", { method: "POST", body: { ciphertext, d, n } }),
  modPowSteps: (base, exp, mod) => request("/api/rsa/modpow-steps", { method: "POST", body: { base, exp, mod } }),
  runRsaDemo: (message, bits, save = false) =>
    request("/api/rsa/run", { method: "POST", body: { message, bits, save, sessionId: getSessionId() } }),

  // Caesar
  runCaesar: (text, shift, mode, save = false) =>
    request("/api/caesar/run", { method: "POST", body: { text, shift, mode, save, sessionId: getSessionId() } }),
  caesarBruteForce: (text) => request("/api/caesar/brute-force", { method: "POST", body: { text } }),
  caesarFrequency: (text) => request("/api/caesar/frequency", { method: "POST", body: { text } }),

  // Password
  analyzePassword: (password) => request("/api/password/analyze", { method: "POST", body: { password } }),

  // History
  getHistory: (type) => request(`/api/history${type ? `?type=${type}` : ""}`),
  deleteHistoryEntry: (id) => request(`/api/history/${id}`, { method: "DELETE" }),
  clearHistory: () => request("/api/history", { method: "DELETE" }),
};
