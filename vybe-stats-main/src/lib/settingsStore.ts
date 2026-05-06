/**
 * Client preferences (notifications, share stats, background). Auth fields come later with login/signup.
 */
import { getActiveAccountId } from "./vybeStore";

const SETTINGS_KEY_PREFIX = "vybe_settings_v1:";

export type VybeSettings = {
  notifications: boolean;
  shareStats: boolean;
  backgroundEffects: boolean;
};

const DEFAULTS: VybeSettings = {
  notifications: true,
  shareStats: true,
  backgroundEffects: true,
};

const CHANGE_EVENT = "vybe:settings-changed";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

/** Sharing (quiz, face-off) is allowed only when notifications are on and Share stats is on. */
export function canShareStats(): boolean {
  const s = getVybeSettings();
  return s.notifications && s.shareStats;
}

export function getVybeSettings(): VybeSettings {
  if (!canUseStorage()) return { ...DEFAULTS };
  try {
    const key = `${SETTINGS_KEY_PREFIX}${getActiveAccountId()}`;
    let raw = window.localStorage.getItem(key);
    // Legacy migration into guest scope.
    if (!raw && getActiveAccountId() === "guest") {
      raw = window.localStorage.getItem("vybe_settings_v1");
      if (raw) {
        window.localStorage.setItem(key, raw);
        window.localStorage.removeItem("vybe_settings_v1");
      }
    }
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<VybeSettings>;
    return {
      notifications: typeof p.notifications === "boolean" ? p.notifications : DEFAULTS.notifications,
      shareStats: typeof p.shareStats === "boolean" ? p.shareStats : DEFAULTS.shareStats,
      backgroundEffects: typeof p.backgroundEffects === "boolean" ? p.backgroundEffects : DEFAULTS.backgroundEffects,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setVybeSettings(patch: Partial<VybeSettings>) {
  if (!canUseStorage()) return;
  const next = { ...getVybeSettings(), ...patch };
  if (!next.notifications) {
    next.shareStats = false;
  }
  window.localStorage.setItem(`${SETTINGS_KEY_PREFIX}${getActiveAccountId()}`, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeVybeSettings(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Placeholder until login/signup — returns null if not set. */
export function getVybeDisplayName(): string | null {
  if (!canUseStorage()) return null;
  try {
    // Prefer live Firebase auth when available.
    const raw = window.localStorage.getItem("vybe_firebase_profile_v1");
    if (raw) {
      const p = JSON.parse(raw) as { displayName?: string };
      if (p?.displayName?.trim()) return p.displayName.trim();
    }
  } catch {
    // ignore
  }
  const v = window.localStorage.getItem("vybe_display_name_v1")?.trim();
  return v && v.length > 0 ? v : null;
}

export function getVybeEmail(): string | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem("vybe_firebase_profile_v1");
    if (raw) {
      const p = JSON.parse(raw) as { email?: string };
      if (p?.email?.trim()) return p.email.trim();
    }
  } catch {
    // ignore
  }
  const v = window.localStorage.getItem("vybe_email_v1")?.trim();
  return v && v.length > 0 ? v : null;
}
