type LastFmImage = { "#text"?: string; size?: string };

export type TrackOverview = {
  image: string | null;
  album: string | null;
  listeners: number | null;
  playcount: number | null;
  durationSec: number | null;
  tags: string[];
  summary: string | null;
  url: string | null;
};

const LASTFM_API_KEY =
  (import.meta as any).env?.VITE_LASTFM_API_KEY ||
  "118f70dd460666a1d952ebe850ade748";
const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";
const ART_CACHE_KEY = "vybe_lastfm_art_cache_v1";
const OVERVIEW_CACHE_KEY = "vybe_lastfm_overview_cache_v1";

const artCache = new Map<string, string | null>();
const overviewCache = new Map<string, TrackOverview | null>();
const artPending = new Map<string, Promise<string | null>>();
const overviewPending = new Map<string, Promise<TrackOverview | null>>();

function cacheKey(artist: string, track: string) {
  return `${artist.trim().toLowerCase()}::${track.trim().toLowerCase()}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function hydrateCacheMap<T>(storageKey: string, target: Map<string, T>) {
  if (!canUseStorage()) return;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, T>;
    Object.entries(obj).forEach(([k, v]) => target.set(k, v));
  } catch {
    // ignore bad cache
  }
}

function persistCacheMap<T>(storageKey: string, source: Map<string, T>, maxEntries = 300) {
  if (!canUseStorage()) return;
  try {
    const entries = Array.from(source.entries()).slice(-maxEntries);
    const out: Record<string, T> = {};
    entries.forEach(([k, v]) => {
      out[k] = v;
    });
    window.localStorage.setItem(storageKey, JSON.stringify(out));
  } catch {
    // ignore quota issues
  }
}

let hydrated = false;
function ensureHydrated() {
  if (hydrated) return;
  hydrateCacheMap<string | null>(ART_CACHE_KEY, artCache);
  hydrateCacheMap<TrackOverview | null>(OVERVIEW_CACHE_KEY, overviewCache);
  hydrated = true;
}

function pickLargestImage(images: LastFmImage[] | undefined): string | null {
  if (!Array.isArray(images)) return null;
  const nonEmpty = images.map((i) => i?.["#text"]?.trim() ?? "").filter(Boolean);
  if (!nonEmpty.length) return null;
  return nonEmpty[nonEmpty.length - 1] ?? null;
}

async function callLastFm(params: Record<string, string>) {
  const qp = new URLSearchParams({
    ...params,
    api_key: LASTFM_API_KEY,
    format: "json",
  });
  const res = await fetch(`${LASTFM_BASE}?${qp.toString()}`);
  if (!res.ok) throw new Error(`Last.fm ${res.status}`);
  return (await res.json()) as any;
}

export async function getAlbumArt(artist: string, track: string): Promise<string | null> {
  ensureHydrated();
  const key = cacheKey(artist, track);
  if (artCache.has(key)) return artCache.get(key) ?? null;
  if (artPending.has(key)) return artPending.get(key)!;

  const req = (async () => {
    try {
      const data = await callLastFm({
        method: "track.getInfo",
        artist: artist.trim(),
        track: track.trim(),
      });
      const image = pickLargestImage(data?.track?.album?.image);
      artCache.set(key, image);
      persistCacheMap(ART_CACHE_KEY, artCache);
      return image;
    } catch {
      artCache.set(key, null);
      persistCacheMap(ART_CACHE_KEY, artCache);
      return null;
    } finally {
      artPending.delete(key);
    }
  })();

  artPending.set(key, req);
  return req;
}

export async function getTrackOverview(artist: string, track: string): Promise<TrackOverview | null> {
  ensureHydrated();
  const key = cacheKey(artist, track);
  if (overviewCache.has(key)) return overviewCache.get(key) ?? null;
  if (overviewPending.has(key)) return overviewPending.get(key)!;

  const req = (async () => {
    try {
      const data = await callLastFm({
        method: "track.getInfo",
        artist: artist.trim(),
        track: track.trim(),
      });
      const tags = Array.isArray(data?.track?.toptags?.tag)
        ? data.track.toptags.tag.map((t: any) => String(t?.name ?? "").trim()).filter(Boolean)
        : [];

      const out: TrackOverview = {
        image: pickLargestImage(data?.track?.album?.image),
        album: data?.track?.album?.title ? String(data.track.album.title) : null,
        listeners: Number.isFinite(Number(data?.track?.listeners)) ? Number(data.track.listeners) : null,
        playcount: Number.isFinite(Number(data?.track?.playcount)) ? Number(data.track.playcount) : null,
        durationSec: Number.isFinite(Number(data?.track?.duration))
          ? Math.max(0, Math.round(Number(data.track.duration) / 1000))
          : null,
        tags: tags.slice(0, 6),
        summary: data?.track?.wiki?.summary
          ? String(data.track.wiki.summary)
              .replace(/<[^>]+>/g, "")
              .replace(/\s*Read more on Last\.fm\.?$/i, "")
              .replace(/\.\.\.\s*$/g, ".")
              .trim()
          : null,
        url: data?.track?.url ? String(data.track.url) : null,
      };
      overviewCache.set(key, out);
      persistCacheMap(OVERVIEW_CACHE_KEY, overviewCache, 180);
      return out;
    } catch {
      overviewCache.set(key, null);
      persistCacheMap(OVERVIEW_CACHE_KEY, overviewCache, 180);
      return null;
    } finally {
      overviewPending.delete(key);
    }
  })();

  overviewPending.set(key, req);
  return req;
}

export function buildYouTubeSearchUrl(artist: string, track: string): string {
  const q = `${artist} ${track} official audio`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export async function resolveYouTubeWatchUrl(artist: string, track: string): Promise<string> {
  const q = `${artist} ${track} official`;
  try {
    const url = `https://piped.video/api/v1/search?q=${encodeURIComponent(q)}&filter=videos`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("piped-fail");
    const rows = (await res.json()) as Array<{ url?: string; id?: string }>;
    const first = rows?.[0];
    if (first?.url && String(first.url).startsWith("/watch")) {
      return `https://www.youtube.com${first.url}`;
    }
    if (first?.id) {
      return `https://www.youtube.com/watch?v=${encodeURIComponent(first.id)}`;
    }
  } catch {
    // fallback below
  }
  return "https://www.youtube.com/";
}

