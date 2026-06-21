// src/routes/rsa.js
import { Router } from "express";
import {
  generateRSAKeys,
  rsaEncrypt,
  rsaDecrypt,
  modPowSteps,
} from "../lib/rsa.js";
import { requireFields, getSessionId } from "../middleware/validate.js";
import { saveHistoryEntry } from "../lib/db.js";

const router = Router();

const ALLOWED_BITS = [16, 32, 64];

// POST /api/rsa/keys  { bits }
router.post("/keys", (req, res) => {
  const bits = ALLOWED_BITS.includes(Number(req.body?.bits)) ? Number(req.body.bits) : 32;
  const { p, q, n, e, d, phi } = generateRSAKeys(bits);
  res.json({
    p: p.toString(),
    q: q.toString(),
    n: n.toString(),
    e: e.toString(),
    d: d.toString(),
    phi: phi.toString(),
    bits,
  });
});

// POST /api/rsa/encrypt  { message, e, n, sessionId? }
router.post("/encrypt", requireFields(["message", "e", "n"]), (req, res) => {
  const { message, e, n } = req.body;
  try {
    const ciphertext = rsaEncrypt(message, BigInt(e), BigInt(n));
    res.json({ ciphertext });
  } catch (err) {
    res.status(400).json({ error: "Invalid RSA parameters", detail: err.message });
  }
});

// POST /api/rsa/decrypt  { ciphertext: [...], d, n }
router.post("/decrypt", requireFields(["ciphertext", "d", "n"]), (req, res) => {
  const { ciphertext, d, n } = req.body;
  if (!Array.isArray(ciphertext)) {
    return res.status(400).json({ error: "ciphertext must be an array of numeric strings" });
  }
  try {
    const plaintext = rsaDecrypt(ciphertext, BigInt(d), BigInt(n));
    res.json({ plaintext });
  } catch (err) {
    res.status(400).json({ error: "Invalid RSA parameters", detail: err.message });
  }
});

// POST /api/rsa/modpow-steps  { base, exp, mod }
router.post("/modpow-steps", requireFields(["base", "exp", "mod"]), (req, res) => {
  const { base, exp, mod } = req.body;
  try {
    const steps = modPowSteps(BigInt(base), BigInt(exp), BigInt(mod));
    res.json({ steps });
  } catch (err) {
    res.status(400).json({ error: "Invalid modPow parameters", detail: err.message });
  }
});

// POST /api/rsa/run  — full keygen + encrypt + decrypt in one call, and
// optionally saved to history. Convenient for the "simulator" UI.
router.post("/run", requireFields(["message"]), async (req, res) => {
  const { message, save } = req.body;
  const bits = ALLOWED_BITS.includes(Number(req.body?.bits)) ? Number(req.body.bits) : 32;

  const keys = generateRSAKeys(bits);
  const ciphertext = rsaEncrypt(message, keys.e, keys.n);
  const decrypted = rsaDecrypt(ciphertext, keys.d, keys.n);

  const result = {
    message,
    bits,
    keys: {
      p: keys.p.toString(),
      q: keys.q.toString(),
      n: keys.n.toString(),
      e: keys.e.toString(),
      d: keys.d.toString(),
      phi: keys.phi.toString(),
    },
    ciphertext,
    decrypted,
    match: decrypted === message,
  };

  if (save) {
    try {
      await saveHistoryEntry({ sessionId: getSessionId(req), type: "rsa", payload: result });
    } catch (err) {
      // History save failures shouldn't block the actual crypto result.
      console.error("Failed to save RSA history entry:", err.message);
    }
  }

  res.json(result);
});

export default router;
