const express = require("express");
const router = express.Router();
const supabase = require("../services/supabaseClient");

// GET /api/users/:id
router.get("/users/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) return res.status(400).json({ error });
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

// GET /api/players/:id/stats
router.get("/players/:id/stats", async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await supabase
      .from("players_stats")
      .select("*")
      .eq("player_id", id)
      .maybeSingle();
    if (error) return res.status(400).json({ error });
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;
