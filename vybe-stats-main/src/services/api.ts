type Json = Record<string, any>;

const DEFAULT_BASE =
  // Default to same host as the webapp (helps mobile + LAN access).
  // You can override with VITE_API_BASE.
  typeof window !== "undefined"
    ? `http://${window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname}:5000/api`
    : "http://localhost:5000/api";

export const API_BASE: string = (import.meta as any).env?.VITE_API_BASE || DEFAULT_BASE;

async function request<T>(
  path: string,
  opts: { method?: "GET" | "POST"; body?: Json; signal?: AbortSignal } = {}
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const hasBody = !!opts.body;
  const res = await fetch(url, {
    method: opts.method ?? (hasBody ? "POST" : "GET"),
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (!res.ok) {
    let extra: any = undefined;
    try {
      extra = await res.json();
    } catch {
      // ignore
    }
    const msg = extra?.error || `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

// ---- Stats ----
export const apiGetStats = (feature: string, signal?: AbortSignal) =>
  request(`/stats?feature=${encodeURIComponent(feature)}`, { signal });

export const apiGetCorrelation = (signal?: AbortSignal) =>
  request(`/correlation`, { signal });

export const apiGetHistogram = (feature: string, bins = 20, signal?: AbortSignal) =>
  request(`/histogram?feature=${encodeURIComponent(feature)}&bins=${bins}`, { signal });

export const apiGetGenreStats = (signal?: AbortSignal) =>
  request(`/genre-stats`, { signal });

export const apiBoxplot = (genre1: string, genre2: string, signal?: AbortSignal) =>
  request(`/boxplot`, { method: "POST", body: { genre1, genre2 }, signal });

export type GenreFeatureCompareResp = {
  genre1: string;
  genre2: string;
  rows: Array<{ feature: string; genre1: number; genre2: number }>;
};

export const apiGenreFeatureCompare = (genre1: string, genre2: string, signal?: AbortSignal) =>
  request<GenreFeatureCompareResp>(`/genre-feature-compare`, { method: "POST", body: { genre1, genre2 }, signal });

// ---- Explore songs search ----
export type SongRow = {
  track_name: string;
  artists: string;
  track_genre?: string;
  popularity?: number;
  danceability?: number;
  energy?: number;
  valence?: number;
  tempo?: number;
  acousticness?: number;
};

export const apiSongs = (q = "", limit = 10, signal?: AbortSignal) =>
  request<SongRow[]>(`/songs?q=${encodeURIComponent(q)}&limit=${limit}`, { signal });

// ---- Rewind / Time machine ----
export type RewindYearRow = {
  year: number;
  danceability: number;
  energy: number;
  valence: number;
};
export type RewindYearlyResp = {
  start: number;
  end: number;
  series: RewindYearRow[];
  badges: string[];
};
export type RewindGenreShiftResp = {
  genres: string[];
  data: Array<Record<string, string | number>>;
};
export type RewindBoundsResp = {
  min_year: number;
  max_year: number;
};
export type TimeMachineResp = {
  artist: string;
  decade_start: number;
  decade_end: number;
  radar_data: Array<{ axis: string; artist: number; decade: number }>;
  matches: Array<{ name: string; artist: string; genre?: string; tempo?: number; energy: number; valence: number; matchPct: number }>;
};

export const apiRewindYearly = (start: number, end: number, signal?: AbortSignal) =>
  request<RewindYearlyResp>(`/rewind/yearly?start=${start}&end=${end}`, { signal });

export const apiRewindBounds = (signal?: AbortSignal) =>
  request<RewindBoundsResp>(`/rewind/bounds`, { signal });

export const apiRewindGenreShift = (start: number, end: number, signal?: AbortSignal) =>
  request<RewindGenreShiftResp>(`/rewind/genre-shift?start=${start}&end=${end}`, { signal });

export const apiRewindGenreShiftBuckets = (start: number, end: number, signal?: AbortSignal) =>
  request<RewindGenreShiftResp>(`/rewind/genre-shift-buckets?start=${start}&end=${end}`, { signal });

export const apiRewindGenreShiftYearly = (start: number, end: number, signal?: AbortSignal) =>
  request<RewindGenreShiftResp>(`/rewind/genre-shift-yearly?start=${start}&end=${end}`, { signal });

export const apiTimeMachine = (
  artist: string,
  decadeStart: number,
  decadeEnd: number,
  limit = 10,
  signal?: AbortSignal
) =>
  request<TimeMachineResp>(
    `/timemachine?artist=${encodeURIComponent(artist)}&decade_start=${decadeStart}&decade_end=${decadeEnd}&limit=${limit}`,
    { signal }
  );

// ---- Probability ----
export const apiNormalProbability = (target_score: number, signal?: AbortSignal) =>
  request(`/probability/normal`, { method: "POST", body: { target_score }, signal });

export const apiBinomialProbability = (n_songs: number, hit_probability: number, signal?: AbortSignal) =>
  request(`/probability/binomial`, { method: "POST", body: { n_songs, hit_probability }, signal });

export const apiPoissonEstimate = (genre: string, n_songs: number, signal?: AbortSignal) =>
  request(`/probability/poisson`, { method: "POST", body: { genre, n_songs }, signal });

export const apiConditionalProbability = (feature: string, threshold: number, signal?: AbortSignal) =>
  request(`/probability/conditional`, { method: "POST", body: { feature, threshold }, signal });

export const apiNormalityTest = (feature: string, signal?: AbortSignal) =>
  request(`/normality-test?feature=${encodeURIComponent(feature)}`, { signal });

// ---- Regression ----
export const apiRegressionSummary = (signal?: AbortSignal) =>
  request(`/regression/summary`, { signal });

export const apiPredictPopularity = (features: Json, signal?: AbortSignal) =>
  request(`/predict`, { method: "POST", body: features, signal });

export const apiSimilarSongs = (features: Json, signal?: AbortSignal) =>
  request(`/similar-songs`, { method: "POST", body: features, signal });

export const apiConfidenceIntervals = (genre1: string, genre2: string, signal?: AbortSignal) =>
  request(`/confidence-intervals`, { method: "POST", body: { genre1, genre2 }, signal });

// ---- Naive Bayes ----
export const apiClassifyGenre = (features: Json, signal?: AbortSignal) =>
  request(`/classify-genre`, { method: "POST", body: features, signal });

export const apiMysterySong = (signal?: AbortSignal) =>
  request(`/mystery-song`, { signal });

// ---- Playlist ----
export const apiPlaylist = (mood: string, signal?: AbortSignal, reshuffle = false) =>
  request(`/playlist`, { method: "POST", body: { mood, reshuffle }, signal });

