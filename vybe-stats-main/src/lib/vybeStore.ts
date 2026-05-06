export type VybeSong = {
  name: string;
  artist: string;
  energy?: number;
  valence?: number;
  tempo?: number;
  genre?: string;
  addedAt: number;
};

export type VybePersonality = {
  title: string;
  desc: string;
  savedAt: number;
};

/** Legacy keys (pre–per-account storage). Migrated into scoped keys for `guest` once. */
const LEGACY_PLAYLIST_KEY = "vybe_playlist_v1";
const LEGACY_PERSONALITY_KEY = "vybe_personality_v1";

const ACCOUNT_ID_KEY = "vybe_active_account_id_v1";

function playlistStorageKey(accountId: string) {
  return `vybe_playlist_v1:${accountId}`;
}

function personalityStorageKey(accountId: string) {
  return `vybe_personality_v1:${accountId}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

/**
 * Active account for Vybe local data (playlist order / weekly top source, personality).
 * Reads `vybe_active_account_id_v1`; defaults to `guest` until real auth wires in.
 */
export function getActiveAccountId(): string {
  if (!canUseStorage()) return "guest";
  const raw = window.localStorage.getItem(ACCOUNT_ID_KEY)?.trim();
  return raw && raw.length > 0 ? raw : "guest";
}

/** Call when the signed-in user changes so playlist/personality use the right keys. */
export function setActiveAccountIdForVybe(accountId: string | null) {
  if (!canUseStorage()) return;
  if (accountId == null || accountId.trim() === "") {
    window.localStorage.removeItem(ACCOUNT_ID_KEY);
    return;
  }
  window.localStorage.setItem(ACCOUNT_ID_KEY, accountId.trim());
}

function readPlaylistRaw(accountId: string): string | null {
  if (!canUseStorage()) return null;
  const scoped = playlistStorageKey(accountId);
  let raw = window.localStorage.getItem(scoped);
  if (!raw && accountId === "guest") {
    raw = window.localStorage.getItem(LEGACY_PLAYLIST_KEY);
    if (raw) {
      window.localStorage.setItem(scoped, raw);
      window.localStorage.removeItem(LEGACY_PLAYLIST_KEY);
    }
  }
  return raw;
}

function readPersonalityRaw(accountId: string): string | null {
  if (!canUseStorage()) return null;
  const scoped = personalityStorageKey(accountId);
  let raw = window.localStorage.getItem(scoped);
  if (!raw && accountId === "guest") {
    raw = window.localStorage.getItem(LEGACY_PERSONALITY_KEY);
    if (raw) {
      window.localStorage.setItem(scoped, raw);
      window.localStorage.removeItem(LEGACY_PERSONALITY_KEY);
    }
  }
  return raw;
}

export function getVybePlaylist(): VybeSong[] {
  if (!canUseStorage()) return [];
  try {
    const id = getActiveAccountId();
    const raw = readPlaylistRaw(id);
    const parsed = raw ? (JSON.parse(raw) as VybeSong[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setVybePlaylist(songs: VybeSong[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(playlistStorageKey(getActiveAccountId()), JSON.stringify(songs));
}

export function addSongToVybe(song: Omit<VybeSong, "addedAt">) {
  const current = getVybePlaylist();
  const deduped = current.filter(
    (s) => !(s.name.toLowerCase() === song.name.toLowerCase() && s.artist.toLowerCase() === song.artist.toLowerCase())
  );
  deduped.unshift({ ...song, addedAt: Date.now() });
  setVybePlaylist(deduped.slice(0, 100));
}

export function getVybePersonality(): VybePersonality | null {
  if (!canUseStorage()) return null;
  try {
    const id = getActiveAccountId();
    const raw = readPersonalityRaw(id);
    if (!raw) return null;
    return JSON.parse(raw) as VybePersonality;
  } catch {
    return null;
  }
}

export function setVybePersonality(p: VybePersonality) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(personalityStorageKey(getActiveAccountId()), JSON.stringify(p));
}
