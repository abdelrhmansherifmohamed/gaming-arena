const express = require("express");
const router = express.Router();
const supabase = require("../services/supabaseClient");
const { setSessionCookies, clearSessionCookies } = require("../utils/cookies");

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  console.log("[auth.signup] signup successful, email confirmation pending");
  const { email, password, username } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "missing email or password" });

  try {
    let userResult;
    try {
      userResult = await supabase.auth.admin.createUser({ email, password });
    } catch (e) {
      userResult = await supabase.auth.signUp({ email, password });
    }

    console.log(
      "[auth.signup] supabase create/signUp result:",
      JSON.stringify(userResult)
    );

    const apiError = userResult?.error ?? null;
    if (apiError) {
      if (apiError.code === "email_exists")
        return res.status(400).json({ error: "email already registered" });
      return res.status(500).json({ error: apiError.message || apiError });
    }

    const user = userResult?.data?.user ?? userResult?.user ?? null;
    if (!user) return res.status(500).json({ error: "could not create user" });

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, username: username || null, email })
        .select();
      if (profileError)
        console.warn("[auth.signup] profile upsert error:", profileError);
    } catch (e) {
      console.warn("[auth.signup] profile upsert exception:", e);
    }

    // Auto-confirm email for users created via service-role/admin API
    try {
      if (supabase?.auth?.admin && user?.id) {
        await supabase.auth.admin.updateUserById(user.id, {
          email_confirmed_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn(
        "[auth.signup] could not auto-confirm user:",
        e?.message || e
      );
    }

    // Try to sign the user in immediately so signup returns a session
    try {
      const { data: signInData, error: signInErr } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (!signInErr && signInData) {
        const session = signInData?.session ?? null;
        if (session) setSessionCookies(res, session);
        return res.json({ user, session });
      }
    } catch (e) {
      console.warn(
        "[auth.signup] signin after confirm failed:",
        e?.message || e
      );
    }
    console.log("[auth.signup] signup successful, email confirmation pending");

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

// POST /api/auth/signin
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "missing email or password" });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      // If email not confirmed, try to confirm via admin API (service role) and retry
      if (error?.code === "email_not_confirmed" || error?.status === 400) {
        try {
          // find matching profile to get user id
          const { data: profile, error: profErr } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          if (!profErr && profile?.id && supabase?.auth?.admin) {
            await supabase.auth.admin.updateUserById(profile.id, {
              email_confirmed_at: new Date().toISOString(),
            });
            // retry sign-in
            const retry = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (retry.error)
              return res.status(400).json({ error: retry.error });
            const session = retry.data?.session ?? null;
            if (session) setSessionCookies(res, session);
            return res.json({ session });
          }
        } catch (e) {
          console.warn(
            "[auth.signin] auto-confirm retry failed:",
            e?.message || e
          );
        }
      }
      // fallback: try listing users via admin API to find user id by email
      if (supabase?.auth?.admin) {
        try {
          const listRes = await supabase.auth.admin.listUsers();
          const found = listRes?.data?.users?.find((u) => u.email === email);
          const userId = found?.id;
          if (userId) {
            await supabase.auth.admin.updateUserById(userId, {
              email_confirmed_at: new Date().toISOString(),
            });
            const retry = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (retry.error)
              return res.status(400).json({ error: retry.error });
            const session = retry.data?.session ?? null;
            if (session) setSessionCookies(res, session);
            return res.json({ session });
          }
        } catch (e) {
          console.warn(
            "[auth.signin] admin.listUsers fallback failed:",
            e?.message || e
          );
        }
      }
      return res.status(400).json({ error });
    }
    const session = data?.session ?? null;
    if (session) setSessionCookies(res, session);
    return res.json({ session });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

// POST /api/auth/signout
router.post("/signout", async (req, res) => {
  try {
    clearSessionCookies(res);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const access = req.cookies?.sb_access_token;
    const refresh = req.cookies?.sb_refresh_token;
    if (!access && !refresh) return res.json({ user: null });
    await supabase.auth.setSession({
      access_token: access,
      refresh_token: refresh,
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) return res.status(400).json({ error: userErr });
    const user = userData?.user ?? null;
    if (!user) return res.json({ user: null });
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return res.json({ user, profile, error: profErr });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;
