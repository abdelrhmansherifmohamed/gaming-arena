const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const diagRoutes = require("./routes/diagnostic");

const app = express();

const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(cookieParser());

// Configure allowed origins for CORS. Set `ALLOWED_ORIGINS` env var as comma-separated list.
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // If no origin (curl/postman/server-side), allow.
    if (!origin) return callback(null, true);
    // Allow file:// served pages which send the literal 'null' origin when enabled via env var
    const allowFileOrigin = process.env.ALLOW_FILE_ORIGIN === "true";
    if (allowFileOrigin && origin === "null") return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error("CORS policy: origin not allowed"));
  },
  credentials: true,
};

app.use((req, res, next) => {
  // Simple logging of incoming origin for debugging
  if (req.headers && req.headers.origin) {
    console.log("[origin]", req.headers.origin);
  }
  next();
});

app.use(cors(corsOptions));
// Ensure preflight requests are handled
app.options("*", cors(corsOptions));

// Simple request logger to help debug frontend <-> backend connectivity
app.use((req, res, next) => {
  console.log("[req]", req.method, req.path);
  next();
});

// Serve frontend static files from project root so frontend and API share origin.
const staticRoot = path.join(__dirname, "..");
app.use(express.static(staticRoot));

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/diagnostic", diagRoutes);

app.get("/", (req, res) => {
  res.send("Gaming Arena API");
});

// For any other non-API GET request, serve index.html (SPA fallback)
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) return res.status(404).send("Not found");
  res.sendFile(path.join(staticRoot, "index.html"));
});

// Try to listen on requested port, but if it's in use retry with next port.
function startServer(port, maxAttempts = 10) {
  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      const next = port + 1;
      if (maxAttempts <= 0) {
        console.error(`Port ${port} in use and no more retries left.`);
        process.exit(1);
      }
      console.warn(`Port ${port} in use, trying ${next}...`);
      setTimeout(() => startServer(next, maxAttempts - 1), 200);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
}

startServer(PORT);
