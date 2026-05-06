import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, Legend } from "recharts";
import { Share2 } from "lucide-react";
import { ChartContainer } from "../components/ChartContainer";
import { PageWrapper } from "../components/PageWrapper";
import { API_BASE, apiSongs, type SongRow } from "../services/api";
import { addSongToVybe } from "../lib/vybeStore";
import { canShareStats, subscribeVybeSettings } from "../lib/settingsStore";
import { loadPageState, savePageState } from "../lib/pageStateStore";
import { getAlbumArt } from "../services/lastfm";

export const Route = createFileRoute("/faceoff")({ component: FaceOffScreen });

type FaceOffStats = {
  a: SongRow;
  b: SongRow;
  radarData: Array<{ axis: string; a: number; b: number }>;
  features: Array<{ name: string; a: number; b: number }>;
  scoreData: Array<{ name: string; score: number }>;
  winnerName: string;
  winCount: number;
  probability: number;
};

function FaceOffScreen() {
  const saved = loadPageState<{ songAInput: string; songBInput: string; stats: FaceOffStats | null }>("faceoff");
  const [songAInput, setSongAInput] = useState(saved?.songAInput ?? "Blinding Lights");
  const [songBInput, setSongBInput] = useState(saved?.songBInput ?? "Someone Like You");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<FaceOffStats | null>(saved?.stats ?? null);
  const [added, setAdded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [artA, setArtA] = useState<string | null>(null);
  const [artB, setArtB] = useState<string | null>(null);
  const songCacheRef = useRef<Record<string, SongRow | null>>({});

  useEffect(() => {
    const refresh = () => setCanShare(canShareStats());
    refresh();
    return subscribeVybeSettings(refresh);
  }, []);

  useEffect(() => {
    if (!canShare && shareOpen) setShareOpen(false);
  }, [canShare, shareOpen]);

  useEffect(() => {
    savePageState("faceoff", { songAInput, songBInput, stats });
  }, [songAInput, songBInput, stats]);

  const hasInputs = songAInput.trim().length > 0 && songBInput.trim().length > 0;

  useEffect(() => {
    let alive = true;
    if (!stats?.a?.artists || !stats?.a?.track_name) {
      setArtA(null);
    } else {
      getAlbumArt(stats.a.artists, stats.a.track_name).then((url) => {
        if (!alive) return;
        setArtA(url);
      });
    }
    if (!stats?.b?.artists || !stats?.b?.track_name) {
      setArtB(null);
    } else {
      getAlbumArt(stats.b.artists, stats.b.track_name).then((url) => {
        if (!alive) return;
        setArtB(url);
      });
    }
    return () => {
      alive = false;
    };
  }, [stats?.a?.artists, stats?.a?.track_name, stats?.b?.artists, stats?.b?.track_name]);

  const loadSong = async (query: string, signal: AbortSignal): Promise<SongRow | null> => {
    const key = query.trim().toLowerCase();
    if (!key) return null;
    if (key in songCacheRef.current) return songCacheRef.current[key] ?? null;
    const rows = await apiSongs(query.trim(), 10, signal);
    const exact = rows.find((r) => r.track_name.toLowerCase() === key);
    const selected = exact ?? rows[0] ?? null;
    songCacheRef.current[key] = selected;
    return selected;
  };

  const toTempoScaled = (tempo?: number) => Math.max(0, Math.min(1, Number(tempo ?? 0) / 220));
  const scoreSong = (s: SongRow) => {
    const vals = [s.energy ?? 0, s.danceability ?? 0, s.valence ?? 0, 1 - (s.acousticness ?? 0), toTempoScaled(s.tempo)];
    return Math.round((vals.reduce((acc, v) => acc + v, 0) / vals.length) * 100);
  };

  const runFaceOff = () => {
    const qA = songAInput.trim();
    const qB = songBInput.trim();
    if (!qA || !qB) {
      setStats(null);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setErr(null);
    Promise.all([loadSong(qA, ac.signal), loadSong(qB, ac.signal)])
      .then(([a, b]) => {
        if (!a || !b) {
          setStats(null);
          return;
        }
        const features = [
          { name: "Energy", a: Number(a.energy ?? 0), b: Number(b.energy ?? 0) },
          { name: "Danceability", a: Number(a.danceability ?? 0), b: Number(b.danceability ?? 0) },
          { name: "Valence", a: Number(a.valence ?? 0), b: Number(b.valence ?? 0) },
          { name: "Acousticness", a: Number(a.acousticness ?? 0), b: Number(b.acousticness ?? 0) },
          { name: "Tempo", a: toTempoScaled(a.tempo), b: toTempoScaled(b.tempo) },
        ];
        const radarData = features.map((f) => ({ axis: f.name, a: Math.round(f.a * 100), b: Math.round(f.b * 100) }));
        const scoreA = scoreSong(a);
        const scoreB = scoreSong(b);
        const winCount = features.filter((f) => f.a > f.b).length;
        const winnerName = scoreA >= scoreB ? a.track_name : b.track_name;
        const probability = Math.max(scoreA, scoreB) / Math.max(1, scoreA + scoreB);
        setStats({
          a,
          b,
          radarData,
          features,
          scoreData: [{ name: a.track_name, score: scoreA }, { name: b.track_name, score: scoreB }],
          winnerName,
          winCount,
          probability,
        });
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  };

  const winnerText = useMemo(() => {
    if (!stats) return "Search two songs and run face-off";
    return stats.winnerName;
  }, [stats]);

  const shareText = useMemo(() => {
    if (!stats) return "Check out my Vybe Face-Off.";
    const a = stats.a.track_name;
    const b = stats.b.track_name;
    return `Vybe Face-Off: "${a}" vs "${b}" - Winner: ${stats.winnerName} (P(win): ${stats.probability.toFixed(2)}).`;
  }, [stats]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://vybe.app/faceoff";

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareToInstagram = async () => {
    // Instagram web does not support direct prefilled text share, so we copy text and open Instagram.
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard failures
    }
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setErr("Could not copy share text.");
    }
  };

  const nativeShare = async () => {
    if (!("share" in navigator)) {
      copyShareText();
      return;
    }
    try {
      await navigator.share({ title: "Vybe Face-Off", text: shareText, url: shareUrl });
    } catch {
      // user cancelled or unavailable; no-op
    }
  };

  useEffect(() => {
    runFaceOff();
    // Auto-run once with defaults for quick first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageWrapper>
      <h1 className="vybe-page-title">Face-Off</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
        <input
          className="vybe-input"
          placeholder="Search song A"
          value={songAInput}
          onChange={(e) => setSongAInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runFaceOff();
          }}
        />
        <input
          className="vybe-input"
          placeholder="Search song B"
          value={songBInput}
          onChange={(e) => setSongBInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runFaceOff();
          }}
        />
      </div>
      <div className="mb-4">
        <button type="button" className="vybe-btn-ghost" onClick={runFaceOff}>Analyze Face-Off</button>
      </div>
      {err && (
        <div className="vybe-card mb-4" style={{ border: "1px solid rgba(255,107,107,0.35)" }}>
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>{err}</p>
          <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
            API base: <span className="font-dm-mono">{API_BASE}</span>
          </p>
        </div>
      )}
      <AnimatePresence>
        {shareOpen && (
          <div className="fixed inset-0 z-[80]">
            <motion.button
              type="button"
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
              onClick={() => setShareOpen(false)}
              aria-label="Close share popup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] vybe-card"
              style={{ backgroundColor: "#111111" }}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <h3 className="font-clash text-[20px] mb-1" style={{ color: "white" }}>Share Face-Off</h3>
              <p className="text-[12px] mb-3" style={{ color: "#A0A0A0" }}>
                Share on WhatsApp/Instagram or copy the caption.
              </p>
              <div className="space-y-2">
                <button type="button" className="vybe-btn-ghost" onClick={shareToWhatsApp}>Share to WhatsApp</button>
                <button type="button" className="vybe-btn-ghost" onClick={shareToInstagram}>Share to Instagram</button>
                <button type="button" className="vybe-btn-ghost" onClick={copyShareText}>
                  {copied ? "Copied" : "Copy share text"}
                </button>
                <button type="button" className="vybe-btn-primary" onClick={nativeShare}>More options</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3 md:items-stretch mb-6">
        <div className="vybe-card">
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#A0A0A0" }}>
            Challenger A
          </p>
          <div className="flex items-center gap-3">
            {artA ? (
              <img src={artA} alt={stats?.a.track_name ?? "Song A artwork"} className="w-11 h-11 md:w-14 md:h-14 rounded-lg object-cover flex-shrink-0" loading="lazy" />
            ) : (
              <div
                className="w-11 h-11 md:w-14 md:h-14 rounded-lg flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #FF6B35, #FF0055)" }}
              />
            )}
            <div>
              <p className="text-[15px] md:text-base font-dm-sans font-medium" style={{ color: "white" }}>
                {stats?.a.track_name ?? "Song A"}
              </p>
              <p className="text-[13px]" style={{ color: "#A0A0A0" }}>
                {stats?.a.artists ?? "Search to load"}
              </p>
            </div>
          </div>
        </div>
        <div className="vybe-card">
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#A0A0A0" }}>
            Challenger B
          </p>
          <div className="flex items-center gap-3">
            {artB ? (
              <img src={artB} alt={stats?.b.track_name ?? "Song B artwork"} className="w-11 h-11 md:w-14 md:h-14 rounded-lg object-cover flex-shrink-0" loading="lazy" />
            ) : (
              <div
                className="w-11 h-11 md:w-14 md:h-14 rounded-lg flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
              />
            )}
            <div>
              <p className="text-[15px] md:text-base font-dm-sans font-medium" style={{ color: "white" }}>
                {stats?.b.track_name ?? "Song B"}
              </p>
              <p className="text-[13px]" style={{ color: "#A0A0A0" }}>
                {stats?.b.artists ?? "Search to load"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="-mt-3 mb-2 hidden md:flex items-center justify-center">
        <span className="font-clash text-lg font-extrabold px-4 py-1 rounded-full border" style={{ color: "#FF6B6B", borderColor: "#FF6B6B33", backgroundColor: "#111111" }}>
          VS
        </span>
      </div>
      <div className="relative flex items-center justify-center my-3 md:hidden">
        <div className="w-full h-px" style={{ backgroundColor: "#FF6B6B" }} />
        <span className="absolute font-clash text-[22px] font-extrabold px-3" style={{ color: "#FF6B6B", backgroundColor: "#000000" }}>
          VS
        </span>
      </div>
      <div className="vybe-card mb-4 overflow-hidden">
        {!stats ? (
          <div className="h-[210px] min-[390px]:h-[228px] md:h-[268px] lg:h-[296px] flex items-center justify-center text-center px-6">
            <p className="text-[13px]" style={{ color: "#A0A0A0" }}>
              {loading ? "Analyzing songs..." : "Search two songs to render comparison graph."}
            </p>
          </div>
        ) : (
          <ChartContainer>
            <RadarChart data={stats.radarData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <PolarGrid stroke="#1C1C1C" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "#A0A0A0", fontSize: 11 }} />
              <Radar dataKey="a" name={stats.a.track_name} stroke="#1DB954" fill="rgba(29,185,84,0.25)" />
              <Radar dataKey="b" name={stats.b.track_name} stroke="#F5A623" fill="rgba(245,166,35,0.2)" />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: "#A0A0A0", bottom: -2 }}
              />
            </RadarChart>
          </ChartContainer>
        )}
      </div>
      <div className="vybe-card mb-4">
        {(stats?.features ?? []).map((f) => { const aWins = f.a > f.b; return (
          <div key={f.name} className="flex items-center justify-between py-2">
            <span className={`font-dm-mono ${aWins ? "text-[15px]" : "text-[13px]"}`} style={{ color: "#1DB954" }}>{f.a.toFixed(2)}</span>
            <span className="text-[12px] flex-1 text-center" style={{ color: "#A0A0A0" }}>{f.name}</span>
            <span className={`font-dm-mono ${!aWins ? "text-[15px]" : "text-[13px]"}`} style={{ color: "#F5A623" }}>{f.b.toFixed(2)}</span>
          </div>
        ); })}
        {!stats && (
          <p className="text-[13px] text-center py-2" style={{ color: "#A0A0A0" }}>
            Feature breakdown appears after analysis.
          </p>
        )}
      </div>
      <div className="vybe-card mb-4 overflow-hidden">
        {!stats ? (
          <div className="h-[112px] md:h-[128px] flex items-center justify-center">
            <p className="text-[12px]" style={{ color: "#A0A0A0" }}>Score chart will appear here.</p>
          </div>
        ) : (
          <ChartContainer className="h-[112px] md:h-[128px]">
            <BarChart data={stats.scoreData} margin={{ top: 12, left: -20, right: 8, bottom: 8 }}>
              <XAxis dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 11 }} />
              <Bar dataKey="score" fill="#1DB954" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
      <div className="vybe-card" style={{ borderLeft: "4px solid #1DB954" }}>
        <h2 className="font-clash text-[26px] font-extrabold" style={{ color: "white" }}>{winnerText}</h2>
        <p className="text-[13px] mt-1" style={{ color: "#A0A0A0" }}>
          {stats ? `Stronger across ${stats.winCount} dimensions` : "Run analysis to get winner summary"}
        </p>
        <p className="font-dm-mono text-[12px] mt-1" style={{ color: "#1DB954" }}>
          {stats ? `P(win) = ${stats.probability.toFixed(2)}` : "P(win) = --"}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            className="vybe-btn-primary flex-1"
            disabled={!hasInputs || loading || !stats}
            onClick={() => {
              if (!stats) return;
              const winner = stats.winnerName === stats.a.track_name ? stats.a : stats.b;
              addSongToVybe({
                name: winner.track_name,
                artist: winner.artists,
                energy: winner.energy,
                valence: winner.valence,
                tempo: winner.tempo,
                genre: winner.track_genre,
              });
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1800);
            }}
          >
            {added ? "Added" : "Add to Vybe"}
          </button>
          <button
            className="w-full sm:w-[52px] sm:shrink-0 h-[52px] rounded-full flex items-center justify-center disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none"
            style={{ backgroundColor: "#1C1C1C" }}
            onClick={() => canShare && setShareOpen(true)}
            type="button"
            disabled={!canShare}
            title={canShare ? undefined : "Turn on Notifications and Share stats in Settings"}
            aria-label="Share face-off result"
          >
            <Share2 size={18} color={canShare ? "#1DB954" : "#555555"} />
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
