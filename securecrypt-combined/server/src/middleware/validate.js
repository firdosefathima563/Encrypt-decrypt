// src/middleware/validate.js

export function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === "");
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required field(s): ${missing.join(", ")}` });
    }
    next();
  };
}

export function getSessionId(req) {
  // Client supplies a per-browser session id (e.g. stored in localStorage).
  // Falls back to a header or a generic anonymous bucket.
  return (
    req.body?.sessionId ||
    req.query?.sessionId ||
    req.headers["x-session-id"] ||
    "anonymous"
  );
}
