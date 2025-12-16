const express = require("express");
const router = express.Router();

// GET /api/diagnostic/origin
router.get("/origin", (req, res) => {
  try {
    return res.json({
      ok: true,
      origin: req.get("origin") || null,
      host: req.get("host") || null,
      ip: req.ip,
      headers: {
        origin: req.get("origin"),
        referer: req.get("referer"),
        "user-agent": req.get("user-agent"),
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || err });
  }
});

// Simple echo POST for testing (returns JSON body and origin)
router.post("/echo", express.json(), (req, res) => {
  try {
    return res.json({
      ok: true,
      origin: req.get("origin") || null,
      body: req.body,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || err });
  }
});

// Simple GET /api/diagnostic/hello for quick frontend test
router.get("/hello", (req, res) => {
  try {
    // Rely on app-level CORS configuration; do not set wildcard headers here
    return res.json({ ok: true, msg: "hello from backend", time: Date.now() });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || err });
  }
});

module.exports = router;
