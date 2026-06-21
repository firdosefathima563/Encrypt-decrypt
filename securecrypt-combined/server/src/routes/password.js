// src/routes/password.js
import { Router } from "express";
import { analyzePassword } from "../lib/password.js";

const router = Router();

// POST /api/password/analyze  { password }
// Note: by design this is NOT saved to history — analyzing a password is
// privacy-sensitive, and the original frontend explicitly promised
// "analyzed locally — never sent anywhere". We preserve that spirit by
// never persisting password content, even though this endpoint now
// performs the calculation server-side on request.
router.post("/analyze", (req, res) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const result = analyzePassword(password);
  res.json(result);
});

export default router;
