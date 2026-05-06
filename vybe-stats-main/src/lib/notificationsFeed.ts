import { getVybeSettings } from "./settingsStore";
import { getActiveAccountId } from "./vybeStore";

const NOTIF_KEY_PREFIX = "vybe_notifications_v1:";
const MAX = 80;

export type VybeNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  kind: "system" | "vybe" | "tip" | "joke";
};

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readAll(): VybeNotification[] {
  if (!canUseStorage()) return [];
  try {
    const key = `${NOTIF_KEY_PREFIX}${getActiveAccountId()}`;
    let raw = window.localStorage.getItem(key);
    if (!raw && getActiveAccountId() === "guest") {
      raw = window.localStorage.getItem("vybe_notifications_v1");
      if (raw) {
        window.localStorage.setItem(key, raw);
        window.localStorage.removeItem("vybe_notifications_v1");
      }
    }
    const p = raw ? (JSON.parse(raw) as VybeNotification[]) : [];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function writeAll(items: VybeNotification[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(`${NOTIF_KEY_PREFIX}${getActiveAccountId()}`, JSON.stringify(items.slice(0, MAX)));
  window.dispatchEvent(new Event("vybe:notifications-changed"));
}

export function getNotifications(): VybeNotification[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getUnreadNotificationCount(): number {
  if (!getVybeSettings().notifications) return 0;
  return readAll().filter((n) => !n.read).length;
}

export function pushVybeNotification(payload: Omit<VybeNotification, "id" | "createdAt" | "read"> & { id?: string }) {
  if (!getVybeSettings().notifications) return;
  const id = payload.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const row: VybeNotification = {
    id,
    title: payload.title,
    body: payload.body,
    kind: payload.kind,
    createdAt: Date.now(),
    read: false,
  };
  const list = readAll().filter((n) => n.id !== id);
  list.unshift(row);
  writeAll(list);
}

export function markNotificationRead(id: string) {
  const list = readAll().map((n) => (n.id === id ? { ...n, read: true } : n));
  writeAll(list);
}

export function markAllNotificationsRead() {
  const list = readAll().map((n) => ({ ...n, read: true }));
  writeAll(list);
}

export function clearNotifications() {
  writeAll([]);
}

export function subscribeNotifications(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("vybe:notifications-changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("vybe:notifications-changed", handler);
    window.removeEventListener("storage", handler);
  };
}

type Seed = { title: string; body: string; kind: VybeNotification["kind"] };

const TIPS: Seed[] = [
  { title: "Vybe tip", body: "Face-Off scores two songs across energy, mood, tempo — pick a winner for your Vybe.", kind: "tip" },
  { title: "Vybe tip", body: "Hit Probability uses your picks to estimate ‘chart-ready’ vibes from real dataset stats.", kind: "tip" },
  { title: "Vybe tip", body: "Year Rewind is perfect for comparing decades — swipe eras and watch genres rise and fall.", kind: "tip" },
  { title: "Vybe tip", body: "Music Time Machine finds retro neighbours to what you search — try an artist + mood.", kind: "tip" },
  { title: "Vybe tip", body: "Playlist Generator ranks tracks by mood filters — Add to Vybe drops up to 20 into your dashboard.", kind: "tip" },
  { title: "Vybe tip", body: "Data Explorer lets you slice distributions and correlations — great for deep dives.", kind: "tip" },
  { title: "Vybe tip", body: "Genre Battle pits genres head-to-head; Live Quiz keeps rounds fast.", kind: "tip" },
  { title: "Vybe tip", body: "Personality Quiz saves your title — it shows on Home under Today’s Vybe.", kind: "tip" },
  { title: "Vybe tip", body: "Weekly Top → See all lists your saved-track order — same sequence Vybe uses for carousel.", kind: "tip" },
  { title: "Vybe tip", body: "Quick Access → See all opens a compact grid of every major Vybe screen.", kind: "tip" },
  { title: "Vybe tip", body: "Sharing quiz & Face-Off needs Notifications + Share stats ON in Settings.", kind: "tip" },
  { title: "Vybe tip", body: "Disable Background effects in Settings if you want a calmer, lighter canvas.", kind: "tip" },
];

/** Soft FYI pings — not errors, just gentle product awareness. */
const FYI_NOTIFS: Seed[] = [
  { title: "Vybe", body: "Your dashboard DNA updates when new tracks land in Vybe — check Weekly Pulse after saves.", kind: "system" },
  { title: "Vybe", body: "Notifications stay optional — flip them off anytime under Settings.", kind: "system" },
  { title: "Vybe", body: "Bell unread clears when you open a notification or tap Mark all read.", kind: "system" },
  { title: "Vybe", body: "Guest mode keeps data on this device until login arrives — nothing syncs to the cloud yet.", kind: "system" },
  { title: "Vybe", body: "Explore tab routes bundle Predict / Battle / Quiz — same tools as bottom navigation menus.", kind: "system" },
  { title: "Vybe", body: "Tip: shorter Face-Off searches match faster — try distinct song titles.", kind: "system" },
  { title: "Vybe", body: "Charts respect Reduce motion indirectly via Background effects — tune both for comfort.", kind: "system" },
  { title: "Vybe", body: "Genre mix chips on Home summarize what’s dominant in your saved library.", kind: "system" },
  { title: "Vybe", body: "Playlist DNA radar averages your current mood mix — regenerate moods for a new shape.", kind: "system" },
];

const MUSIC_JOKES: Seed[] = [
  { title: "Groan-worthy groove", body: "Why did the musician get kicked off the plane? Too much baggage.", kind: "joke" },
  { title: "Groan-worthy groove", body: "What’s Beethoven’s favourite fruit? Ba-na-na-na.", kind: "joke" },
  { title: "Groan-worthy groove", body: "Why don’t skeletons play stadium gigs? They don’t have the guts.", kind: "joke" },
  { title: "Groan-worthy groove", body: "How do you fix a broken brass section? With a tuba glue.", kind: "joke" },
  { title: "Groan-worthy groove", body: "Why was the piano smiling? Someone told it a grand joke.", kind: "joke" },
  { title: "Groan-worthy groove", body: "What did the drummer call his twin daughters? Anna One, Anna Two.", kind: "joke" },
  { title: "Groan-worthy groove", body: "Why can’t DJs fish? They keep dropping the bass.", kind: "joke" },
  { title: "Groan-worthy groove", body: "What’s an avocado’s favourite genre? Guac ’n’ roll.", kind: "joke" },
  { title: "Groan-worthy groove", body: "Parallel fifths walk into a bar — banned in Germany since the 1700s.", kind: "joke" },
  { title: "Groan-worthy groove", body: "Why did the pianist keep banging their head? They were playing by ear.", kind: "joke" },
  { title: "Groan-worthy groove", body: "What do you call a cow with musical taste? A moo-sician.", kind: "joke" },
  { title: "Groan-worthy groove", body: "Studying counterpoint is easy — said no one, ever.", kind: "joke" },
];

const LAST_AUTO_KEY = "vybe_last_auto_notification_ts";
/** Minimum quiet gap between auto-generated items so the feed doesn’t cluster. */
const MIN_GAP_MS = 4 * 60 * 1000;
/** Tick cadence — check occasionally; actual pushes are sparse (see TICK_CHANCE). */
const POLL_INTERVAL_MS = 90 * 1000;
/** Probability each eligible poll fires one notification (~2–4/hour typical). */
const TICK_CHANCE = 0.14;

function pickWeightedSeed(): Seed {
  const r = Math.random();
  if (r < 0.46) return TIPS[Math.floor(Math.random() * TIPS.length)];
  if (r < 0.76) return FYI_NOTIFS[Math.floor(Math.random() * FYI_NOTIFS.length)];
  return MUSIC_JOKES[Math.floor(Math.random() * MUSIC_JOKES.length)];
}

let liveTimer: ReturnType<typeof setInterval> | null = null;

/** Sparse auto cadence: tips, FYI, and jokes — spaced apart so nothing piles up. */
export function startNotificationsLivePoll() {
  if (typeof window === "undefined" || liveTimer) return;
  liveTimer = setInterval(() => {
    if (!getVybeSettings().notifications) return;
    const last = Number(sessionStorage.getItem(LAST_AUTO_KEY) || "0");
    if (Date.now() - last < MIN_GAP_MS) return;
    if (Math.random() > TICK_CHANCE) return;
    const pick = pickWeightedSeed();
    pushVybeNotification({ title: pick.title, body: pick.body, kind: pick.kind });
    sessionStorage.setItem(LAST_AUTO_KEY, String(Date.now()));
  }, POLL_INTERVAL_MS);
}
