import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer } from "../components/ChartContainer";
import { PageWrapper } from "../components/PageWrapper";
import { SectionHeader } from "../components/SectionHeader";
import { API_BASE, apiGetCorrelation, apiGetHistogram, apiGetStats, apiSongs, type SongRow } from "../services/api";
import { loadPageState, savePageState } from "../lib/pageStateStore";

export const Route = createFileRoute("/explore")({ component: ExploreScreen });

const variables = [
  { label: "Popularity", feature: "popularity" },
  { label: "Energy", feature: "energy" },
  { label: "Danceability", feature: "danceability" },
  { label: "Valence", feature: "valence" },
  { label: "Acousticness", feature: "acousticness" },
  { label: "Tempo", feature: "tempo" },
];

type StatsResp = {
  mean: number;
  median: number;
  std: number;
  iqr: number;
  skewness: number;
};

type HistResp = {
  counts: number[];
  bin_edges: number[];
  feature: string;
};

type CorrResp = Record<string, Record<string, number>>;

function heatColor(v: number) {
  if (v > 0.5) return `rgba(29,185,84,${0.3 + v * 0.6})`;
  if (v > 0) return `rgba(29,185,84,${0.1 + v * 0.4})`;
  if (v > -0.3) return "#333333";
  return `rgba(255,107,107,${0.2 + Math.abs(v) * 0.5})`;
}

function ExploreScreen() {
  const nav = useNavigate();
  const saved = loadPageState<{
    activeVar: string;
    query: string;
    showCorrDetails: boolean;
    showAllSongs: boolean;
  }>("explore");
  const [activeVar, setActiveVar] = useState(saved?.activeVar ?? variables[0].feature);
  const [stats, setStats] = useState<StatsResp | null>(null);
  const [hist, setHist] = useState<HistResp | null>(null);
  const [corr, setCorr] = useState<CorrResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState(saved?.query ?? "");
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsErr, setSongsErr] = useState<string | null>(null);
  const [showCorrDetails, setShowCorrDetails] = useState(Boolean(saved?.showCorrDetails));
  const [showAllSongs, setShowAllSongs] = useState(Boolean(saved?.showAllSongs));
  const songReqId = useRef(0);
  const hasSongQuery = query.trim().length > 0;

  useEffect(() => {
    savePageState("explore", { activeVar, query, showCorrDetails, showAllSongs });
  }, [activeVar, query, showCorrDetails, showAllSongs]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setErr(null);
    Promise.all([
      apiGetStats(activeVar, ac.signal) as Promise<StatsResp>,
      apiGetHistogram(activeVar, 20, ac.signal) as Promise<HistResp>,
      corr ? Promise.resolve(corr) : (apiGetCorrelation(ac.signal) as Promise<CorrResp>),
    ])
      .then(([s, h, c]) => {
        setStats(s);
        setHist(h);
        setCorr(c);
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [activeVar]);

  useEffect(() => {
    if (!hasSongQuery) {
      setSongs([]);
      setSongsLoading(false);
      setSongsErr(null);
      return;
    }
    const id = ++songReqId.current;
    const ac = new AbortController();
    setSongsLoading(true);
    setSongsErr(null);

    const t = window.setTimeout(() => {
      apiSongs(query, 10, ac.signal)
        .then((rows) => {
          if (songReqId.current !== id) return;
          setSongs(rows);
        })
        .catch((e: any) => {
          if (e?.name === "AbortError") return;
          if (songReqId.current !== id) return;
          setSongsErr(String(e?.message || e));
        })
        .finally(() => {
          if (songReqId.current !== id) return;
          setSongsLoading(false);
        });
    }, 220);

    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [hasSongQuery, query]);

  const heatmapLabels = useMemo(() => {
    // Keep these 6 like existing UI
    return ["popularity", "energy", "danceability", "acousticness", "tempo", "valence"];
  }, []);

  const heatmapValues = useMemo(() => {
    if (!corr) return null;
    return heatmapLabels.map((r) => heatmapLabels.map((c) => corr?.[r]?.[c] ?? 0));
  }, [corr, heatmapLabels]);

  const histData = useMemo(() => {
    if (!hist) return [];
    const edges = hist.bin_edges;
    return hist.counts.map((count, i) => ({
      bin: `${edges[i]?.toFixed?.(0) ?? i}`,
      count,
    }));
  }, [hist]);

  return (
    <PageWrapper>
      <AnimatePresence>
        {showCorrDetails && (
          <div className="fixed inset-0 z-[70]">
            <motion.button
              aria-label="Close correlation details"
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
              onClick={() => setShowCorrDetails(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ y: 44, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 44, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 vybe-shell-width rounded-t-[24px] p-4 pb-6 overflow-hidden flex flex-col max-h-[calc(100dvh-8px)]"
              style={{ backgroundColor: "#111111" }}
            >
              <h3 className="font-clash text-[20px] font-bold mb-2 shrink-0" style={{ color: "white" }}>
                Correlation Heatmap
              </h3>
              <p className="text-[12px] mb-3 shrink-0" style={{ color: "#A0A0A0" }}>
                Values range from -1 to +1. Higher absolute values mean stronger relationships.
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar pr-1 pb-[calc(env(safe-area-inset-bottom,0px)+72px)]">
                <div className="vybe-card overflow-x-auto">
                  <div
                    className="grid min-w-[340px]"
                    style={{ gridTemplateColumns: `96px repeat(6, minmax(0,1fr))`, gap: 6 }}
                  >
                    <div />
                    {heatmapLabels.map((l) => (
                      <div key={`h-${l}`} className="text-center text-[10px] font-dm-sans" style={{ color: "#A0A0A0" }}>
                        {l === "danceability" ? "Dance" : l === "acousticness" ? "Acoust." : l === "popularity" ? "Pop." : l[0].toUpperCase() + l.slice(1)}
                      </div>
                    ))}
                    {(heatmapValues ?? []).map((row, ri) => (
                      <>
                        <div key={`r-${ri}`} className="text-[10px] font-dm-sans flex items-center" style={{ color: "#A0A0A0" }}>
                          {heatmapLabels[ri]}
                        </div>
                        {row.map((v, ci) => (
                          <div
                            key={`v-${ri}-${ci}`}
                            className="rounded-[8px] px-2 py-2 text-center font-dm-mono text-[11px]"
                            style={{ backgroundColor: heatColor(v), color: "white" }}
                          >
                            {Number(v).toFixed(3)}
                          </div>
                        ))}
                      </>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showAllSongs && (
          <div className="fixed inset-0 z-[70]">
            <motion.button
              aria-label="Close songs list"
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
              onClick={() => setShowAllSongs(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ y: 44, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 44, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 vybe-shell-width rounded-t-[24px] p-4 pb-6 overflow-hidden flex flex-col max-h-[calc(100dvh-8px)]"
              style={{ backgroundColor: "#111111" }}
            >
              <h3 className="font-clash text-[20px] font-bold mb-2 shrink-0" style={{ color: "white" }}>
                Songs
              </h3>
              <p className="text-[12px] mb-3 shrink-0" style={{ color: "#A0A0A0" }}>
                Showing up to 100 results{query ? ` for “${query}”` : ""}.
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar pr-1 pb-[calc(env(safe-area-inset-bottom,0px)+72px)]">
                <AllSongsTable query={query} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <h1 className="vybe-page-title">Explore</h1>
      <div className="relative mb-4">
        <Search size={18} color="#1DB954" className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
        <input
          placeholder="Search songs..."
          className="vybe-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <SectionHeader title="Songs" onAction={() => setShowAllSongs(true)} />
      {songsErr && (
        <div className="vybe-card mb-4" style={{ border: "1px solid rgba(255,107,107,0.35)" }}>
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>
            {songsErr}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
            API base: <span className="font-dm-mono">{API_BASE}</span>
          </p>
        </div>
      )}
      <div className="vybe-card mb-6 overflow-x-auto md:overflow-visible">
        {!hasSongQuery && !songsLoading ? (
          <div className="py-7 text-center">
            <p className="text-[13px]" style={{ color: "#A0A0A0" }}>Search for a song, artist, or genre to see results.</p>
          </div>
        ) : (
          <table className="w-full text-left md:text-[13px]">
            <thead>
              <tr>
                {["Song", "Artist", "Genre", "Pop."].map((h) => (
                  <th
                    key={h}
                    className="text-[11px] md:text-xs uppercase font-dm-sans font-normal pb-2 pr-3 md:pr-4 whitespace-nowrap"
                    style={{ color: "#A0A0A0" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(songsLoading ? Array.from({ length: 10 }) : songs).map((row: any, i) => (
                <tr
                  key={`${row?.track_name ?? "s"}-${i}`}
                  className={`${i % 2 === 0 ? "bg-[#111111]" : "bg-[#161616]"} ${songsLoading ? "" : "cursor-pointer transition-colors hover:!bg-[#1DB95422]"}`}
                  onClick={() => {
                    if (songsLoading) return;
                    nav({
                      to: "/song",
                      search: {
                        track: row.track_name,
                        artist: row.artists,
                        energy: row.energy,
                        valence: row.valence,
                        tempo: row.tempo,
                        genre: row.track_genre,
                      },
                    });
                  }}
                >
                  <td className="py-2.5 pr-3 md:py-3 text-[12px] md:text-[13px] font-dm-sans min-w-[10rem]" style={{ color: "white" }}>
                    {songsLoading ? "…" : row.track_name}
                  </td>
                  <td className="py-2 pr-3 text-[12px] md:text-[13px]" style={{ color: "#A0A0A0" }}>
                    {songsLoading ? "…" : row.artists}
                  </td>
                  <td className="py-2 pr-3 text-[12px] md:text-[13px]" style={{ color: "#A0A0A0" }}>
                    {songsLoading ? "…" : (row.track_genre ?? "—")}
                  </td>
                  <td className="py-2 pr-3 font-dm-mono text-[12px] md:text-[13px]" style={{ color: "white" }}>
                    {songsLoading ? "—" : (row.popularity ?? "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SectionHeader title="Correlation Heatmap" onAction={() => setShowCorrDetails(true)} />
      {err && (
        <div className="vybe-card mb-4" style={{ border: "1px solid rgba(255,107,107,0.35)" }}>
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>
            {err}
          </p>
          <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
            API base: <span className="font-dm-mono">{API_BASE}</span>
          </p>
        </div>
      )}
      <div className="vybe-card mb-6 overflow-x-auto">
        <div className="grid min-w-[280px] md:min-w-0" style={{ gridTemplateColumns: `72px repeat(6, minmax(0,1fr))`, gap: 4 }}>
          <div />
          {heatmapLabels.map((l) => (
            <div key={l} className="text-center text-[10px] md:text-[11px] font-dm-sans px-0.5" style={{ color: "#A0A0A0" }}>
              {l === "danceability" ? "Dance" : l === "acousticness" ? "Acoust." : l === "popularity" ? "Pop." : l[0].toUpperCase() + l.slice(1)}
            </div>
          ))}
          {(heatmapValues ?? []).map((row, ri) => (
            <>{/* row */}
              <div key={`label-${ri}`} className="text-[10px] font-dm-sans flex items-center pr-2" style={{ color: "#A0A0A0" }}>
                {heatmapLabels[ri] === "danceability" ? "Danceability" : heatmapLabels[ri] === "acousticness" ? "Acousticness" : heatmapLabels[ri] === "popularity" ? "Popularity" : heatmapLabels[ri][0].toUpperCase() + heatmapLabels[ri].slice(1)}
              </div>
              {row.map((v, ci) => (
                <div
                  key={`${ri}-${ci}`}
                  className="aspect-square min-h-[36px] md:min-h-[44px] rounded-[4px] flex items-center justify-center font-dm-mono text-[9px] md:text-[11px]"
                  style={{ backgroundColor: heatColor(v), color: "white" }}
                >
                  {Number(v).toFixed(2)}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
      <SectionHeader title="Distribution Explorer" action="" />
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-3">
        {variables.map((v) => (
          <button
            key={v.feature}
            onClick={() => setActiveVar(v.feature)}
            className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-dm-sans touch-manipulation"
            style={{
              backgroundColor: activeVar === v.feature ? "#1DB954" : "#1C1C1C",
              color: activeVar === v.feature ? "white" : "#A0A0A0",
              opacity: loading && activeVar !== v.feature ? 0.7 : 1,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="vybe-card mb-4 overflow-hidden">
        <div className="relative">
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-dm-mono" style={{ backgroundColor: "#1C1C1C", color: "#F5A623" }}>
            Skew: {stats ? stats.skewness.toFixed(2) : "—"}
          </div>
          <ChartContainer className="h-[172px] md:h-[216px] lg:h-[240px]">
            <BarChart data={histData} margin={{ top: 28, left: -6, right: 8, bottom: 8 }}>
              <XAxis dataKey="bin" tick={{ fill: "#A0A0A0", fontSize: 9 }} />
              <YAxis tick={{ fill: "#A0A0A0", fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1DB954" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 md:gap-3">
        {[
          { label: "Mean", value: stats ? stats.mean.toFixed(2) : "—" },
          { label: "Median", value: stats ? stats.median.toFixed(2) : "—" },
          { label: "SD", value: stats ? stats.std.toFixed(2) : "—" },
          { label: "IQR", value: stats ? stats.iqr.toFixed(2) : "—" },
          { label: "Skew", value: stats ? stats.skewness.toFixed(2) : "—" },
        ].map((s) => (
          <div key={s.label} className="flex-1 min-w-[5.5rem] md:min-w-[6.5rem] px-3 py-2 rounded-[12px]" style={{ backgroundColor: "#1C1C1C" }}>
            <span className="text-[10px] md:text-[11px] block" style={{ color: "#A0A0A0" }}>
              {s.label}
            </span>
            <span className="font-dm-mono text-[16px] md:text-lg" style={{ color: "#1DB954" }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

function AllSongsTable({ query }: { query: string }) {
  const nav = useNavigate();
  const [rows, setRows] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setRows([]);
      setLoading(false);
      setErr(null);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setErr(null);
    apiSongs(query, 100, ac.signal)
      .then(setRows)
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [query]);

  if (err) {
    return (
      <div className="vybe-card" style={{ border: "1px solid rgba(255,107,107,0.35)" }}>
        <p className="text-[13px]" style={{ color: "#FF6B6B" }}>
          {err}
        </p>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="vybe-card">
        <p className="text-[13px] text-center py-5" style={{ color: "#A0A0A0" }}>
          Search for a song, artist, or genre to view all songs.
        </p>
      </div>
    );
  }

  return (
    <div className="vybe-card overflow-x-auto md:overflow-visible">
      <table className="w-full text-left">
        <thead>
          <tr>
            {["Song", "Artist", "Genre", "Pop.", "Energy", "Dance", "Tempo"].map((h) => (
              <th
                key={h}
                className="text-[11px] uppercase font-dm-sans font-normal pb-2 pr-3 whitespace-nowrap"
                style={{ color: "#A0A0A0" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(loading ? Array.from({ length: 12 }) : rows).map((r: any, i) => (
            <tr
              key={`${r?.track_name ?? "r"}-${i}`}
              className={`${i % 2 === 0 ? "bg-[#111111]" : "bg-[#161616]"} ${loading ? "" : "cursor-pointer transition-colors hover:!bg-[#1DB95422]"}`}
              onClick={() => {
                if (loading) return;
                nav({
                  to: "/song",
                  search: {
                    track: r.track_name,
                    artist: r.artists,
                    energy: r.energy,
                    valence: r.valence,
                    tempo: r.tempo,
                    genre: r.track_genre,
                  },
                });
              }}
            >
              <td className="py-2 pr-3 text-[12px] font-dm-sans min-w-[10rem]" style={{ color: "white" }}>
                {loading ? "…" : r.track_name}
              </td>
              <td className="py-2 pr-3 text-[12px]" style={{ color: "#A0A0A0" }}>
                {loading ? "…" : r.artists}
              </td>
              <td className="py-2 pr-3 text-[12px]" style={{ color: "#A0A0A0" }}>
                {loading ? "…" : (r.track_genre ?? "—")}
              </td>
              <td className="py-2 pr-3 text-[12px] font-dm-mono" style={{ color: "white" }}>
                {loading ? "—" : (r.popularity ?? "—")}
              </td>
              <td className="py-2 pr-3 text-[12px] font-dm-mono" style={{ color: "white" }}>
                {loading ? "—" : (typeof r.energy === "number" ? r.energy.toFixed(2) : "—")}
              </td>
              <td className="py-2 pr-3 text-[12px] font-dm-mono" style={{ color: "white" }}>
                {loading ? "—" : (typeof r.danceability === "number" ? r.danceability.toFixed(2) : "—")}
              </td>
              <td className="py-2 pr-3 text-[12px] font-dm-mono" style={{ color: "white" }}>
                {loading ? "—" : (typeof r.tempo === "number" ? r.tempo.toFixed(0) : "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
