function initAuth() {
  console.log("auth.js initializing");
  // Determine API base: when page is opened via file:// use localhost backend.
  const API_BASE =
    window.location.protocol === "file:"
      ? "http://localhost:3000"
      : window.location.origin;
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const authMessage = document.getElementById("authMessage");
  const signInBtn = document.getElementById("signInBtn");
  const signOutBtn = document.getElementById("signOutBtn");

  function showMessage(msg, isError = false) {
    if (!authMessage) return;
    authMessage.textContent = msg || "";
    authMessage.className = isError ? "text-danger mt-3" : "text-success mt-3";
  }

  async function postJson(url, body) {
    try {
      const fullUrl =
        url && (url.startsWith("http://") || url.startsWith("https://"))
          ? url
          : API_BASE + url;
      // Log the full URL for easier debugging
      console.log("[postJson] POST", fullUrl);
      const res = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      let payload;
      try {
        payload = await res.json();
      } catch (e) {
        payload = null;
      }
      return { ok: res.ok, status: res.status, payload };
    } catch (e) {
      // Network-level error (CORS, connection refused, mixed content, etc.)
      console.error("Network/fetch error:", e);
      return {
        ok: false,
        status: 0,
        payload: { error: e.message || String(e) },
      };
    }
  }

  async function signin(email, password) {
    const { ok, payload } = await postJson("/api/auth/signin", {
      email,
      password,
    });
    console.log("[auth.signin] payload", payload, "ok", ok);
    if (!ok) {
      showMessage(
        (payload && (payload.error?.message || payload.error)) ||
          "Sign in failed",
        true
      );
      return null;
    }
    showMessage("Signed in successfully");
    hideAuthModal();
    // best-effort immediate header update using returned payload (falls back to email)
    try {
      const u =
        payload?.user ||
        payload?.data?.user ||
        payload?.session?.user ||
        payload;
      const emailVal = u?.email || email;
      const usernameVal =
        (payload?.profile && payload.profile.username) ||
        u?.user_metadata?.full_name ||
        u?.username ||
        (emailVal && emailVal.split("@")[0]) ||
        "";
      console.log(
        "[auth.signin] immediate updateHeaderUser?",
        !!window.updateHeaderUser,
        emailVal,
        usernameVal
      );
      if (window.updateHeaderUser) {
        try {
          window.updateHeaderUser({ email: emailVal, username: usernameVal });
          console.log("[auth.signin] updateHeaderUser called");
        } catch (e) {
          console.warn("updateHeaderUser threw", e);
        }
      }
      // show popup if available
      if (window.showUserPopup) {
        try {
          window.showUserPopup({ email: emailVal, username: usernameVal });
          console.log("[auth.signin] showUserPopup called");
        } catch (e) {
          console.warn("showUserPopup failed", e);
        }
      } else {
        // Fallback: directly update DOM if helper missing
        try {
          const nameEl = document.getElementById("headerUsername");
          const emailEl = document.getElementById("headerEmail");
          const info = document.getElementById("userInfo");
          const heroEl = document.getElementById("heroTitle");
          if (nameEl) nameEl.textContent = "Hu " + usernameVal;
          if (emailEl) emailEl.textContent = emailVal;
          if (info) info.classList.remove("d-none");
          if (heroEl)
            heroEl.innerHTML = `Hu <span class="primary-color">${usernameVal}</span> <div class="small text-secondary">${emailVal}</div>`;
          console.log("[auth.signin] fallback DOM updated");
        } catch (e) {
          console.warn("fallback DOM update failed", e);
        }
      }
      try {
        localStorage.setItem(
          "user",
          JSON.stringify({ email: emailVal, username: usernameVal })
        );
        console.log("[auth.signin] localStorage set");
      } catch (e) {
        console.warn("localStorage set failed", e);
      }
    } catch (e) {
      /* ignore */
    }
    await updateUIFromMe();
    return payload;
  }

  async function signup(email, password, username) {
    const { ok, payload } = await postJson("/api/auth/signup", {
      email,
      password,
      username,
    });
    console.log("[auth.signup] payload", payload, "ok", ok);
    if (!ok) {
      showMessage(
        (payload && (payload.error?.message || payload.error)) ||
          "Sign up failed",
        true
      );
      return null;
    }
    showMessage(
      "Account created" +
        (payload.session ? " and signed in" : " — please check your email"),
      false
    );
    hideAuthModal();
    // best-effort immediate header update
    try {
      const u =
        payload?.user ||
        payload?.data?.user ||
        payload?.session?.user ||
        payload;
      const emailVal = u?.email || email;
      const usernameVal =
        username ||
        (payload?.profile && payload.profile.username) ||
        u?.user_metadata?.full_name ||
        u?.username ||
        (emailVal && emailVal.split("@")[0]) ||
        "";
      console.log(
        "[auth.signup] immediate updateHeaderUser?",
        !!window.updateHeaderUser,
        emailVal,
        usernameVal
      );
      if (window.updateHeaderUser) {
        try {
          window.updateHeaderUser({ email: emailVal, username: usernameVal });
          console.log("[auth.signup] updateHeaderUser called");
        } catch (e) {
          console.warn("updateHeaderUser threw", e);
        }
      }
      if (window.showUserPopup) {
        try {
          window.showUserPopup({ email: emailVal, username: usernameVal });
          console.log("[auth.signup] showUserPopup called");
        } catch (e) {
          console.warn("showUserPopup failed", e);
        }
      } else {
        try {
          const nameEl = document.getElementById("headerUsername");
          const emailEl = document.getElementById("headerEmail");
          const info = document.getElementById("userInfo");
          const heroEl = document.getElementById("heroTitle");
          if (nameEl) nameEl.textContent = "Hu " + usernameVal;
          if (emailEl) emailEl.textContent = emailVal;
          if (info) info.classList.remove("d-none");
          if (heroEl)
            heroEl.innerHTML = `Hu <span class="primary-color">${usernameVal}</span> <div class="small text-secondary">${emailVal}</div>`;
          console.log("[auth.signup] fallback DOM updated");
        } catch (e) {
          console.warn("fallback DOM update failed", e);
        }
      }
      try {
        localStorage.setItem(
          "user",
          JSON.stringify({ email: emailVal, username: usernameVal })
        );
        console.log("[auth.signup] localStorage set");
      } catch (e) {
        console.warn("localStorage set failed", e);
      }
    } catch (e) {}
    await updateUIFromMe();
    return payload;
  }

  async function signout() {
    try {
      const res = await fetch(API_BASE + "/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) showMessage("Sign out failed", true);
      else showMessage("Signed out");
    } catch (e) {
      showMessage("Sign out error", true);
    }
    try {
      if (window.updateHeaderUser) window.updateHeaderUser(null);
    } catch (e) {}
    try {
      localStorage.removeItem("user");
    } catch (e) {}
    await updateUIFromMe();
  }

  function hideAuthModal() {
    const modalEl = document.getElementById("authModal");
    if (!modalEl) return;
    const bs = window.bootstrap;
    if (bs && bs.Modal) {
      const inst = bs.Modal.getInstance(modalEl) || new bs.Modal(modalEl);
      inst.hide();
    }
  }

  async function updateUIFromMe() {
    try {
      const r = await fetch(API_BASE + "/api/auth/me", {
        credentials: "include",
      });
      console.log("[auth.me] raw response", r);
      const data = await r.json();
      console.log("[auth.me] parsed", data);
      // debug: show if any cookies visible (httpOnly cookies won't appear)
      try {
        console.log("[auth.me] document.cookie", document.cookie);
      } catch (e) {}
      const user = data?.user ?? null;
      if (user) {
        if (signInBtn) signInBtn.classList.add("d-none");
        if (signOutBtn) signOutBtn.classList.remove("d-none");
        const displayName = data.profile?.username || user.email || "user";
        showMessage("Welcome " + displayName);
        // Update header display (if helper exists)
        try {
          if (window.updateHeaderUser) {
            window.updateHeaderUser({
              email: user.email,
              username: displayName,
            });
          }
          // persist lightweight profile for initial load
          try {
            localStorage.setItem(
              "user",
              JSON.stringify({ email: user.email, username: displayName })
            );
          } catch (e) {}
        } catch (e) {
          console.warn("updateHeaderUser failed", e);
        }
      } else {
        if (signInBtn) signInBtn.classList.remove("d-none");
        if (signOutBtn) signOutBtn.classList.add("d-none");
        showMessage("");
        try {
          if (window.updateHeaderUser) window.updateHeaderUser(null);
        } catch (e) {}
        try {
          localStorage.removeItem("user");
        } catch (e) {}
      }
    } catch (e) {
      console.warn("me check failed", e);
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = document.getElementById("loginEmail")?.value?.trim();
      const password = document.getElementById("loginPassword")?.value;
      if (!email || !password) {
        showMessage("Missing email or password", true);
        return;
      }
      await signin(email, password);
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = document.getElementById("signupEmail")?.value?.trim();
      const password = document.getElementById("signupPassword")?.value;
      const username = document.getElementById("signupUsername")?.value?.trim();
      if (!email || !password || !username) {
        showMessage("Please fill all signup fields", true);
        return;
      }
      await signup(email, password, username);
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      await signout();
    });
  }

  // initial check
  updateUIFromMe();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
