import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer } from "../components/ChartContainer";
import { PageWrapper } from "../components/PageWrapper";
import {
  API_BASE,
  apiConfidenceIntervals,
  apiGenreFeatureCompare,
  apiGetGenreStats,
  type GenreFeatureCompareResp,
} from "../services/api";

export const Route = createFileRoute("/battle")({ component: GenreBattleScreen });

type ConfidenceResp = {
  genre1: { name: string; ci: { mean: number; lower: number; upper: number } };
  genre2: { name: string; ci: { mean: number; lower: number; upper: number } };
  p_value: number;
  significant: boolean;
  winner: string;
};

const DEFAULT_G1 = "pop";
const DEFAULT_G2 = "rock";

function GenreBattleScreen() {
  const [genres, setGenres] = useState<string[]>([]);
  const [genre1, setGenre1] = useState(DEFAULT_G1);
  const [genre2, setGenre2] = useState(DEFAULT_G2);
  const [featureCompare, setFeatureCompare] = useState<GenreFeatureCompareResp | null>(null);
  const [conf, setConf] = useState<ConfidenceResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openPicker, setOpenPicker] = useState<"g1" | "g2" | null>(null);
  const battleCacheRef = useRef<Record<string, { features: GenreFeatureCompareResp; conf: ConfidenceResp }>>({});
  const pickerWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    apiGetGenreStats(ac.signal)
      .then((rows: any) => {
        const rawGenres: string[] = (rows ?? []).map((r: any) => String(r.track_genre));
        const opts = Array.from(new Set<string>(rawGenres)).sort();
        setGenres(opts);
        if (!opts.length) return;
        const fallback1 = opts.includes(DEFAULT_G1) ? DEFAULT_G1 : opts[0];
        const fallback2 = opts.includes(DEFAULT_G2) ? DEFAULT_G2 : (opts.find((g) => g !== fallback1) ?? fallback1);
        setGenre1(fallback1);
        setGenre2(fallback2);
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!genre1 || !genre2) return;
    const ac = new AbortController();
    const cacheKey = `${genre1}::${genre2}`;
    const cached = battleCacheRef.current[cacheKey];
    if (cached) {
      setFeatureCompare(cached.features);
      setConf(cached.conf);
      return () => ac.abort();
    }
    setLoading(true);
    setErr(null);
    Promise.all([apiGenreFeatureCompare(genre1, genre2, ac.signal), apiConfidenceIntervals(genre1, genre2, ac.signal)])
      .then(([features, c]) => {
        const next = { features, conf: c as ConfidenceResp };
        battleCacheRef.current[cacheKey] = next;
        setFeatureCompare(next.features);
        setConf(next.conf);
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [genre1, genre2]);

  useEffect(() => {
    if (!openPicker) return;
    const onDocDown = (e: MouseEvent) => {
      const el = pickerWrapRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && !el.contains(target)) setOpenPicker(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPicker(null);
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openPicker]);

  const featureData = useMemo(
    () =>
      (featureCompare?.rows ?? []).map((r) => ({
        feature: r.feature === "danceability" ? "Dance" : r.feature === "acousticness" ? "Acoust." : r.feature === "tempo" ? "Tempo" : r.feature[0].toUpperCase() + r.feature.slice(1),
        g1: Number((r.genre1 * 100).toFixed(2)),
        g2: Number((r.genre2 * 100).toFixed(2)),
      })),
    [featureCompare]
  );

  const ciData = useMemo(() => {
    if (!conf) return [];
    return [
      { name: conf.genre1.name, upper: conf.genre1.ci.upper },
      { name: conf.genre2.name, upper: conf.genre2.ci.upper },
    ];
  }, [conf]);

  const titleWinner = conf?.winner ?? genre1;
  const pLabel = useMemo(() => {
    if (conf?.p_value == null) return "p = --";
    if (conf.p_value === 0) return "p < 0.0001";
    if (conf.p_value < 0.001) return `p = ${conf.p_value.toExponential(2)}`;
    return `p = ${conf.p_value.toFixed(3)}`;
  }, [conf]);
  const deltaPct = conf
    ? Math.abs(conf.genre1.ci.mean - conf.genre2.ci.mean).toFixed(1)
    : "0.0";
  const winProbability = useMemo(() => {
    if (!conf) return null;
    const meanGap = Math.abs(conf.genre1.ci.mean - conf.genre2.ci.mean);
    const effectScore = Math.max(0, Math.min(1, meanGap / 25));
    const lowerMax = Math.max(conf.genre1.ci.lower, conf.genre2.ci.lower);
    const upperMin = Math.min(conf.genre1.ci.upper, conf.genre2.ci.upper);
    const overlap = Math.max(0, upperMin - lowerMax);
    const span = Math.max(conf.genre1.ci.upper, conf.genre2.ci.upper) - Math.min(conf.genre1.ci.lower, conf.genre2.ci.lower);
    const overlapRatio = span > 0 ? overlap / span : 0;
    const significanceBoost = conf.significant ? 0.05 : 0;
    const score = 0.5 + effectScore * 0.4 + significanceBoost - overlapRatio * 0.2;
    return Math.max(0.5, Math.min(0.95, score));
  }, [conf]);

  return (
    <PageWrapper>
      <h1 className="vybe-page-title">Genre Battle</h1>
      <div ref={pickerWrapRef} className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-4 relative">
        <div className="relative flex-1">
          <div className="vybe-card flex items-center justify-between h-[60px] min-h-[60px]">
            <button
              type="button"
              className="w-full h-full px-2 rounded-[10px] font-clash text-[18px] md:text-[20px] font-bold outline-none text-left flex items-center justify-between"
              style={{ color: "white", backgroundColor: "#1F1F1F", border: "1px solid #3A3A3A" }}
              onClick={() => setOpenPicker((v) => (v === "g1" ? null : "g1"))}
            >
              <span>{genre1}</span>
              <span style={{ color: "#A0A0A0" }}>▾</span>
            </button>
          </div>
          {openPicker === "g1" && (
            <div className="battle-picker-list absolute z-40 mt-1 w-full rounded-[10px] border max-h-[220px] overflow-y-auto" style={{ backgroundColor: "#2A2A2A", borderColor: "#3A3A3A" }}>
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`battle-picker-item ${g === genre1 ? "is-selected" : ""}`}
                  onClick={() => {
                    setGenre1(g);
                    setOpenPicker(null);
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-center py-1 md:py-0 md:px-1">
          <span className="font-clash text-[20px] md:text-xl font-extrabold" style={{ color: "#F5A623" }}>
            VS
          </span>
        </div>
        <div className="relative flex-1">
          <div className="vybe-card flex items-center justify-between h-[60px] min-h-[60px]">
            <button
              type="button"
              className="w-full h-full px-2 rounded-[10px] font-clash text-[18px] md:text-[20px] font-bold outline-none text-left flex items-center justify-between"
              style={{ color: "white", backgroundColor: "#1F1F1F", border: "1px solid #3A3A3A" }}
              onClick={() => setOpenPicker((v) => (v === "g2" ? null : "g2"))}
            >
              <span>{genre2}</span>
              <span style={{ color: "#A0A0A0" }}>▾</span>
            </button>
          </div>
          {openPicker === "g2" && (
            <div className="battle-picker-list absolute z-40 mt-1 w-full rounded-[10px] border max-h-[220px] overflow-y-auto" style={{ backgroundColor: "#2A2A2A", borderColor: "#3A3A3A" }}>
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`battle-picker-item ${g === genre2 ? "is-selected" : ""}`}
                  onClick={() => {
                    setGenre2(g);
                    setOpenPicker(null);
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {err && (
        <div className="vybe-card mb-4 mt-4" style={{ border: "1px solid rgba(255,107,107,0.35)" }}>
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>{err}</p>
          <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
            API base: <span className="font-dm-mono">{API_BASE}</span>
          </p>
        </div>
      )}
      <div className="vybe-card mb-4 mt-4 md:mt-6 overflow-hidden">
        {featureData.length === 0 ? (
          <div className="h-[200px] md:h-[240px] lg:h-[260px] flex items-center justify-center text-center px-6">
            <p className="text-[13px]" style={{ color: "#A0A0A0" }}>{loading ? "Loading battle stats..." : "Select genres to compare."}</p>
          </div>
        ) : (
          <ChartContainer className="h-[200px] md:h-[240px] lg:h-[260px]">
            <BarChart data={featureData} margin={{ top: 8, left: -8, right: 8, bottom: 0 }}>
              <XAxis dataKey="feature" tick={{ fill: "#A0A0A0", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#A0A0A0", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="g1" fill="#1DB954" name={genre1} radius={[4, 4, 0, 0]} />
              <Bar dataKey="g2" fill="#F5A623" name={genre2} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
      <div className="vybe-card mb-4" style={{ borderLeft: "4px solid #1DB954" }}>
        <h2 className="font-clash text-[22px] font-extrabold" style={{ color: "white" }}>{titleWinner} wins</h2>
        <p className="font-dm-mono text-[12px] mt-1" style={{ color: "#1DB954" }}>
          {pLabel} — {conf?.significant ? "statistically significant" : "not significant"}
        </p>
        <p className="font-dm-mono text-[12px] mt-1" style={{ color: "#1DB954" }}>
          Probability: {winProbability ? `${(winProbability * 100).toFixed(1)}%` : "--"}
        </p>
        <p className="text-[13px] mt-1" style={{ color: "#A0A0A0" }}>
          Average popularity gap: {deltaPct} points
        </p>
      </div>
      <button className="vybe-btn-ghost mb-4" onClick={() => {
        const g1 = genre1;
        setGenre1(genre2);
        setGenre2(g1);
      }}>Battle Again</button>
      <div className="vybe-card overflow-hidden">
        <p className="text-[12px] mb-3" style={{ color: "#A0A0A0" }}>
          Confidence Interval Overlap
        </p>
        {ciData.length === 0 ? (
          <div className="h-[88px] md:h-[100px] lg:h-[112px] flex items-center justify-center">
            <p className="text-[12px]" style={{ color: "#A0A0A0" }}>{loading ? "Loading confidence intervals..." : "No confidence data yet."}</p>
          </div>
        ) : (
          <ChartContainer className="h-[88px] md:h-[100px] lg:h-[112px]">
            <BarChart data={ciData} layout="vertical" margin={{ top: 0, left: 0, right: 8, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#A0A0A0", fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 11 }} width={64} />
              <Bar dataKey="upper" fill="#1DB954" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </PageWrapper>
  );
}
