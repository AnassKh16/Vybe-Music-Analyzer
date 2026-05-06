import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Play } from "lucide-react";
import { PageWrapper } from "../components/PageWrapper";
import { BackgroundParticles } from "../components/BackgroundParticles";
import { buildYouTubeSearchUrl, getTrackOverview, type TrackOverview } from "../services/lastfm";

type SongSearch = {
  track?: string;
  artist?: string;
  energy?: number;
  valence?: number;
  tempo?: number;
  genre?: string;
};

export const Route = createFileRoute("/song")({
  validateSearch: (search: Record<string, unknown>): SongSearch => ({
    track: typeof search.track === "string" ? search.track : "",
    artist: typeof search.artist === "string" ? search.artist : "",
    energy: Number.isFinite(Number(search.energy)) ? Number(search.energy) : undefined,
    valence: Number.isFinite(Number(search.valence)) ? Number(search.valence) : undefined,
    tempo: Number.isFinite(Number(search.tempo)) ? Number(search.tempo) : undefined,
    genre: typeof search.genre === "string" ? search.genre : undefined,
  }),
  component: SongOverviewScreen,
});

function genreAccent(genre?: string) {
  const g = (genre || "").toLowerCase();
  if (g.includes("pop")) return { rgb: "255,107,53", solid: "#FF6B35" };
  if (g.includes("rock") || g.includes("metal")) return { rgb: "255,62,62", solid: "#FF3E3E" };
  if (g.includes("hip") || g.includes("rap") || g.includes("trap")) return { rgb: "130,95,255", solid: "#825FFF" };
  if (g.includes("elect") || g.includes("edm") || g.includes("house") || g.includes("techno")) return { rgb: "33,183,255", solid: "#21B7FF" };
  if (g.includes("jazz") || g.includes("blues") || g.includes("soul")) return { rgb: "255,176,0", solid: "#FFB000" };
  if (g.includes("r&b") || g.includes("rnb")) return { rgb: "238,80,164", solid: "#EE50A4" };
  if (g.includes("classical") || g.includes("orchestra")) return { rgb: "148,126,255", solid: "#947EFF" };
  if (g.includes("country") || g.includes("folk")) return { rgb: "230,138,74", solid: "#E68A4A" };
  if (g.includes("reggae") || g.includes("dancehall")) return { rgb: "101,201,79", solid: "#65C94F" };
  return { rgb: "29,185,84", solid: "#1DB954" };
}

function formatDuration(sec: number | null | undefined) {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function compactNum(v: number | null | undefined) {
  if (!v || v <= 0) return "—";
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v);
}

function SongOverviewScreen() {
  const { track, artist, energy, valence, tempo, genre } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<TrackOverview | null>(null);
  const youtubeUrl = useMemo(() => buildYouTubeSearchUrl(artist || "", track || ""), [artist, track]);
  const accent = genreAccent(genre || overview?.tags?.[0]);

  useEffect(() => {
    if (!track || !artist) return;
    let alive = true;
    setLoading(true);
    getTrackOverview(artist, track)
      .then((d) => {
        if (!alive) return;
        setOverview(d);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [artist, track]);

  return (
    <PageWrapper>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundColor: "#000000" }} />
      <div className="fixed inset-0 pointer-events-none">
        <BackgroundParticles accentRgb={accent.rgb} className="opacity-80" forceVisible />
      </div>
      <div className="relative z-10">
      <div className="relative overflow-hidden rounded-[20px] mb-4 p-3" style={{ backgroundColor: "rgba(20,16,21,0.72)", border: `1px solid rgba(${accent.rgb},0.30)` }}>
      <div className="vybe-card p-0 overflow-hidden mb-4" style={{ backgroundColor: "rgba(10,10,10,0.55)" }}>
        <div className="h-[340px] w-full relative">
          {overview?.image ? (
            <img src={overview.image} alt={`${track} artwork`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: `linear-gradient(135deg, rgba(${accent.rgb},0.9), rgba(${accent.rgb},0.55))` }} />
          )}
          <div className="absolute right-3 bottom-3 flex items-center gap-3">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: accent.solid }}
              aria-label="Play on YouTube"
            >
              <Play size={22} color="#161015" fill="#161015" />
            </a>
          </div>
        </div>
      </div>

      <div className="vybe-card mb-6" style={{ backgroundColor: "rgba(10,10,10,0.56)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-clash text-[36px] font-bold leading-tight truncate" style={{ color: "white" }}>
              {track || "Song"}
            </h1>
            <p className="text-[16px] truncate mt-1" style={{ color: "#A0A0A0" }}>
              {artist || "Unknown artist"}
            </p>
          </div>
          <span className="rounded-full px-3 py-1 text-[12px] font-dm-mono shrink-0" style={{ backgroundColor: "rgba(20,20,20,0.7)", color: accent.solid }}>
            {(genre || overview?.tags?.[0] || "music").toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-3 py-1.5 rounded-full text-[12px] font-dm-mono" style={{ backgroundColor: "#1C1C1C", color: "#A0A0A0" }}>
            Duration {formatDuration(overview?.durationSec)}
          </span>
          <span className="px-3 py-1.5 rounded-full text-[12px] font-dm-mono" style={{ backgroundColor: "#1C1C1C", color: "#A0A0A0" }}>
            Listeners {compactNum(overview?.listeners)}
          </span>
          <span className="px-3 py-1.5 rounded-full text-[12px] font-dm-mono" style={{ backgroundColor: "#1C1C1C", color: "#A0A0A0" }}>
            Plays {compactNum(overview?.playcount)}
          </span>
          {typeof tempo === "number" && (
            <span className="px-3 py-1.5 rounded-full text-[12px] font-dm-mono" style={{ backgroundColor: "#1C1C1C", color: "#A0A0A0" }}>
              Tempo {Math.round(tempo)}
            </span>
          )}
        </div>

        <h3 className="font-clash text-[22px] mt-6 mb-2" style={{ color: "white" }}>Overview</h3>
        <p className="text-[14px] leading-relaxed" style={{ color: "#E4E4E4" }}>
          {overview?.summary ||
            (loading
              ? "Loading track overview..."
              : "No description is available for this track yet. You can still play it on YouTube.")}
        </p>

        <h3 className="font-clash text-[20px] mt-6 mb-2" style={{ color: "white" }}>Insights</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[12px]" style={{ color: "#A0A0A0" }}>Album</p>
            <p className="text-[16px]" style={{ color: "white" }}>{overview?.album || "Single / Unknown"}</p>
          </div>
          <div>
            <p className="text-[12px]" style={{ color: "#A0A0A0" }}>Mood</p>
            <p className="text-[16px]" style={{ color: "white" }}>
              {typeof valence === "number" ? (valence > 0.65 ? "Uplifting" : valence < 0.35 ? "Moody" : "Balanced") : "—"}
            </p>
          </div>
          <div>
            <p className="text-[12px]" style={{ color: "#A0A0A0" }}>Energy</p>
            <p className="text-[16px]" style={{ color: "white" }}>
              {typeof energy === "number" ? `${Math.round(energy * 100)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[12px]" style={{ color: "#A0A0A0" }}>Top tags</p>
            <p className="text-[16px] truncate" style={{ color: "white" }}>
              {overview?.tags?.slice(0, 2).join(" • ") || "—"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="vybe-btn-primary mt-7"
          style={{ backgroundColor: accent.solid, color: "#111111" }}
          onClick={() => window.history.back()}
        >
          ← Go Back
        </button>
      </div>
      </div>
      </div>
    </PageWrapper>
  );
}

