const supabase = require("../services/supabaseClient");

async function restoreSession(req, res, next) {
  const access = req.cookies?.sb_access_token;
  const refresh = req.cookies?.sb_refresh_token;
  if (!access && !refresh) return next();

  try {
    await supabase.auth.setSession({
      access_token: access,
      refresh_token: refresh,
    });
    const { data, error } = await supabase.auth.getUser();
    if (!error) req.user = data?.user ?? null;
  } catch (err) {
    console.warn("restoreSession error", err?.message || err);
  }
  return next();
}

module.exports = { restoreSession };
