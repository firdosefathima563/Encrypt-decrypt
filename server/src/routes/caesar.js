// src/routes/caesar.js
import { Router } from "express";
import { caesarShift, bruteForceAll, letterFrequency } from "../lib/caesar.js";
import { requireFields, getSessionId } from "../middleware/validate.js";
import { saveHistoryEntry } from "../lib/db.js";

const router = Router();

// POST /api/caesar/run  { text, shift, mode: 'encrypt'|'decrypt', save? }
router.post("/run", requireFields(["text"]), async (req, res) => {
  const { text, save } = req.body;
  const shift = Number.isInteger(Number(req.body.shift)) ? Number(req.body.shift) : 13;
  const mode = req.body.mode === "decrypt" ? "decrypt" : "encrypt";

  const output = caesarShift(text, shift, mode === "encrypt");
  const result = {
    input: text,
    shift,
    mode,
    output,
    inputChars: text.replace(/[^a-zA-Z]/g, "").length,
    keySpace: 25,
  };

  if (save) {
    try {
      await saveHistoryEntry({ sessionId: getSessionId(req), type: "caesar", payload: result });
    } catch (err) {
      console.error("Failed to save Caesar history entry:", err.message);
    }
  }

  res.json(result);
});

// POST /api/caesar/brute-force  { text }
router.post("/brute-force", requireFields(["text"]), (req, res) => {
  const { text } = req.body;
  res.json({ results: bruteForceAll(text) });
});

// POST /api/caesar/frequency  { text }
router.post("/frequency", requireFields(["text"]), (req, res) => {
  const { text } = req.body;
  res.json({ frequency: letterFrequency(text) });
});

export default router;
