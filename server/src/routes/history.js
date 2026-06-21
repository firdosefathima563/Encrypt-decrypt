// src/routes/history.js
import { Router } from "express";
import { listHistory, deleteHistoryEntry, clearHistory } from "../lib/db.js";
import { getSessionId } from "../middleware/validate.js";

const router = Router();

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
