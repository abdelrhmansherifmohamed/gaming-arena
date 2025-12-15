function setSessionCookies(res, session) {
  if (!session) return;
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  if (session.access_token)
    res.cookie("sb_access_token", session.access_token, { ...opts });
  if (session.refresh_token)
    res.cookie("sb_refresh_token", session.refresh_token, { ...opts });
}

function clearSessionCookies(res) {
  res.clearCookie("sb_access_token");
  res.clearCookie("sb_refresh_token");
}

module.exports = { setSessionCookies, clearSessionCookies };
