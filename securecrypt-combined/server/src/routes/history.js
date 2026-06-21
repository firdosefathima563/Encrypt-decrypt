// src/routes/history.js
import { Router } from "express";
import { listHistory, deleteHistoryEntry, clearHistory, saveHistoryEntry } from "../lib/db.js";
import { getSessionId } from "../middleware/validate.js";

const router = Router();

const ALLOWED_TYPES = ["rsa", "caesar", "password"];

// POST /api/history/save  { type, payload, sessionId? }
// Generic save endpoint used by the live frontend — it computes results
// client-side and posts a record here purely for history/persistence.
// Note: for type "password", the frontend must never send the raw
// password string in payload — only non-sensitive summary fields
// (score, strength, entropy). This route doesn't try to scrub the
// payload itself, since that responsibility belongs to the caller, but
// the official frontend client never includes the password text.
router.post("/save", async (req, res) => {
  try {
    const { type, payload } = req.body || {};
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${ALLOWED_TYPES.join(", ")}` });
    }
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "payload is required and must be an object" });
    }
    const sessionId = getSessionId(req);
    const entry = await saveHistoryEntry({ sessionId, type, payload });
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: "Failed to save history entry", detail: err.message });
  }
});

// GET /api/history?type=rsa&limit=50
router.get("/", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { type, limit } = req.query;
    const entries = await listHistory({ sessionId, type, limit: limit ? Number(limit) : undefined });
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history", detail: err.message });
  }
});

// DELETE /api/history/:id
router.delete("/:id", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    await deleteHistoryEntry({ sessionId, id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete entry", detail: err.message });
  }
});

// DELETE /api/history  (clear all for this session)
router.delete("/", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    await clearHistory({ sessionId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear history", detail: err.message });
  }
});

export default router;
