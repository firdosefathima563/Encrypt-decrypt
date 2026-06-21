// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import rsaRoutes from "./routes/rsa.js";
import caesarRoutes from "./routes/caesar.js";
import passwordRoutes from "./routes/password.js";
import historyRoutes from "./routes/history.js";
import { dbMode } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3001;
app.set("trust proxy",1);

// Comma-separated list of allowed origins, e.g.
// "https://yourname.github.io,http://localhost:5173"
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
  })
);
app.use(express.json({ limit: "200kb" }));

// Basic abuse protection — RSA key generation and brute-force are CPU work,
// so we cap request rate per IP.
const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.get("/", (req, res) => {
  res.json({
    name: "SecureCrypt API",
    status: "ok",
    dbMode,
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", dbMode, time: new Date().toISOString() });
});

app.use("/api/rsa", rsaRoutes);
app.use("/api/caesar", caesarRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/history", historyRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`SecureCrypt API listening on port ${PORT} (db: ${dbMode})`);
});
