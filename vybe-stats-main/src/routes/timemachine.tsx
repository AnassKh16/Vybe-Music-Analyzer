import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from "recharts";
import { ChartContainer } from "../components/ChartContainer";
import { LazyMount } from "../components/LazyMount";
import { PageWrapper } from "../components/PageWrapper";
import { SectionHeader } from "../components/SectionHeader";
import { SongCarousel } from "../components/SongCarousel";
import { API_BASE, apiTimeMachine, type TimeMachineResp } from "../services/api";
import { loadPageState, savePageState } from "../lib/pageStateStore";

export const Route = createFileRoute("/timemachine")({ component: TimeMachineScreen });

const decades = ["60s", "65s", "70s", "75s", "80s", "85s", "90s", "95s", "2000s", "2005s", "2010s", "2015s", "2020s"];

function decadeToRange(label: string): [number, number] {
  if (label === "2000s") return [2000, 2009];
  if (label === "2005s") return [2005, 2009];
  if (label === "2010s") return [2010, 2019];
  if (label === "2015s") return [2015, 2019];
  if (label === "2020s") return [2020, 2029];
  if (label === "65s") return [1965, 1969];
  if (label === "75s") return [1975, 1979];
  if (label === "85s") return [1985, 1989];
  if (label === "95s") return [1995, 1999];
  const yy = Number(label.replace("s", ""));
  const start = 1900 + yy;
  return [start, start + 9];
}

function TimeMachineScreen() {
  const saved = loadPageState<{
    activeDec: string;
    artistInput: string;
    queryArtist: string;
    showAllMatches: boolean;
  }>("timemachine");
  const [activeDec, setActiveDec] = useState(saved?.activeDec ?? "80s");
  const [artistInput, setArtistInput] = useState(saved?.artistInput ?? "Arctic Monkeys");
  const [queryArtist, setQueryArtist] = useState(saved?.queryArtist ?? "Arctic Monkeys");
  const [resp, setResp] = useState<TimeMachineResp | null>(null);
  const [allResp, setAllResp] = useState<TimeMachineResp | null>(null);
  const [showAllMatches, setShowAllMatches] = useState(Boolean(saved?.showAllMatches));
  const [loading, setLoading] = useState(false);
  const [allLoading, setAllLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [decadeStart, decadeEnd] = useMemo(() => decadeToRange(activeDec), [activeDec]);
  const resultCacheRef = useRef<Record<string, TimeMachineResp>>({});
  const hasQuery = queryArtist.trim().length > 0;
  const requestKeyBase = `${queryArtist.trim().toLowerCase()}::${decadeStart}-${decadeEnd}`;

  useEffect(() => {
    savePageState("timemachine", { activeDec, artistInput, queryArtist, showAllMatches });
  }, [activeDec, artistInput, queryArtist, showAllMatches]);

  useEffect(() => {
    if (!hasQuery) {
      setResp(null);
      setAllResp(null);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    const cacheKey10 = `${requestKeyBase}::10`;
    const cached10 = resultCacheRef.current[cacheKey10];
    if (cached10) {
      setResp(cached10);
      setLoading(false);
      return () => ac.abort();
    }
    setLoading(true);
    setErr(null);
    apiTimeMachine(queryArtist, decadeStart, decadeEnd, 10, ac.signal)
      .then((ten) => {
        resultCacheRef.current[cacheKey10] = ten;
        setResp(ten);
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [queryArtist, decadeStart, decadeEnd, hasQuery, requestKeyBase]);

  useEffect(() => {
    if (!hasQuery) return;
    const cacheKey20 = `${requestKeyBase}::20`;
    const cached20 = resultCacheRef.current[cacheKey20];
    if (cached20) setAllResp(cached20);
    else setAllResp(null);
  }, [hasQuery, requestKeyBase]);

  useEffect(() => {
    if (!showAllMatches || !hasQuery) return;
    const ac = new AbortController();
    const cacheKey20 = `${requestKeyBase}::20`;
    const cached20 = resultCacheRef.current[cacheKey20];
    if (cached20) {
      setAllResp(cached20);
      setAllLoading(false);
      return () => ac.abort();
    }
    setAllLoading(true);
    apiTimeMachine(queryArtist, decadeStart, decadeEnd, 20, ac.signal)
      .then((twenty) => {
        resultCacheRef.current[cacheKey20] = twenty;
        setAllResp(twenty);
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      })
      .finally(() => setAllLoading(false));
    return () => ac.abort();
  }, [showAllMatches, queryArtist, decadeStart, decadeEnd, hasQuery, requestKeyBase]);

  const radarData = resp?.radar_data ?? [];
  const matchSongs = useMemo(
    () =>
      (() => {
        const seen = new Set<string>();
        return (resp?.matches ?? [])
          .filter((s) => {
            const k = `${String(s.name ?? "").toLowerCase()}::${String(s.artist ?? "").toLowerCase()}`;
            if (!k || seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .map((s) => ({
            name: s.name,
            artist: s.artist,
            energy: s.energy,
            valence: s.valence,
            tempo: s.tempo,
            genre: s.genre,
            matchPct: s.matchPct,
          }));
      })(),
    [resp?.matches]
  );
  const shownArtist = resp?.artist || queryArtist;
  const insightText = useMemo(() => {
    if (!hasQuery) return "Search for an artist to see why these songs match.";
    if (!radarData.length) return "Similarity is computed from energy, danceability, valence, acousticness, and tempo.";
    const deltas = radarData
      .map((r) => ({ axis: r.axis, d: Math.abs((r.artist ?? 0) - (r.decade ?? 0)) }))
      .sort((a, b) => a.d - b.d);
    const top = deltas.slice(0, 2).map((x) => x.axis.toLowerCase());
    return `Closest overlap on ${top.join(" and ")}.`;
  }, [hasQuery, radarData]);

  const radarBlock = useMemo(() => {
    if (!hasQuery) {
      return (
        <div className="h-[256px] md:h-[312px] lg:h-[344px] flex items-center justify-center px-6 text-center">
          <p className="text-[13px] font-dm-sans" style={{ color: "#A0A0A0" }}>
            Search for an artist to analyze audio profile.
          </p>
        </div>
      );
    }
    return (
      <LazyMount
        placeholder={<div className="h-[256px] md:h-[312px] lg:h-[344px]" />}
      >
        <ChartContainer className="h-[256px] md:h-[312px] lg:h-[344px]">
          <RadarChart data={radarData} margin={{ top: 12, right: 12, bottom: 58, left: 12 }}>
            <PolarGrid stroke="#1C1C1C" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "#A0A0A0", fontSize: 11 }} />
            <Radar dataKey="artist" stroke="#1DB954" fill="rgba(29,185,84,0.2)" name="Artist" />
            <Radar dataKey="decade" stroke="#F5A623" fill="rgba(245,166,35,0.15)" name="Decade Avg" />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="square"
              wrapperStyle={{
                paddingTop: 18,
                width: "100%",
                bottom: -4,
                fontSize: 11,
                color: "#A0A0A0",
              }}
            />
          </RadarChart>
        </ChartContainer>
      </LazyMount>
    );
  }, [hasQuery, radarData]);

  return (
    <PageWrapper>
      <AnimatePresence>
        {showAllMatches && (
          <div className="fixed inset-0 z-[120]">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowAllMatches(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 vybe-shell-width rounded-t-[24px] p-4 pb-6 overflow-hidden flex flex-col max-h-[calc(100dvh-8px)]"
              style={{ backgroundColor: "#111111" }}
            >
              <h3 className="font-clash text-[20px] font-bold mb-1" style={{ color: "white" }}>Closest Matches (Top 20)</h3>
              <p className="text-[12px] mb-3" style={{ color: "#A0A0A0" }}>
                {shownArtist} in {activeDec}
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto hide-scrollbar pr-1 space-y-2 pb-[calc(env(safe-area-inset-bottom,0px)+96px)]">
                {allLoading && !(allResp?.matches?.length ?? 0) ? (
                  <div className="vybe-card">
                    <p className="text-[13px]" style={{ color: "#A0A0A0" }}>Loading matches...</p>
                  </div>
                ) : (
                  (() => {
                    const seen = new Set<string>();
                    return (allResp?.matches ?? []).filter((s) => {
                      const k = `${String(s.name ?? "").toLowerCase()}::${String(s.artist ?? "").toLowerCase()}`;
                      if (!k || seen.has(k)) return false;
                      seen.add(k);
                      return true;
                    });
                  })().map((s, idx) => (
                    <Link
                      key={`${s.name}-${s.artist}-${idx}`}
                      to="/song"
                      search={{
                        track: s.name,
                        artist: s.artist,
                        energy: s.energy,
                        valence: s.valence,
                        tempo: s.tempo,
                        genre: s.genre,
                      }}
                      className="vybe-card block transition-colors hover:bg-[#1DB95422]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold truncate" style={{ color: "white" }}>{s.name}</p>
                          <p className="text-[12px] truncate" style={{ color: "#A0A0A0" }}>{s.artist}</p>
                        </div>
                        <span className="shrink-0 rounded-full px-3 py-1 text-[12px]" style={{ backgroundColor: "#1C1C1C", color: "#1DB954" }}>
                          {s.matchPct}%
                        </span>
                      </div>
                      <p className="text-[12px] mt-2" style={{ color: "#A0A0A0" }}>
                        Energy: {Math.round(s.energy * 100)} • Valence: {Math.round(s.valence * 100)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <h1 className="vybe-page-title !mb-2">Time Machine</h1>
      <p className="text-[14px] md:text-[15px] italic mb-5 max-w-xl" style={{ color: "#A0A0A0" }}>
        What if your favorite artist was born in another era?
      </p>
      <div className="relative mb-4">
        <Search size={18} color="#1DB954" className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
        <input
          placeholder="Search for an artist"
          className="vybe-input"
          value={artistInput}
          onChange={(e) => setArtistInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setQueryArtist(artistInput.trim());
          }}
        />
      </div>
      <div className="mb-4">
        <button
          type="button"
          className="vybe-btn-ghost rounded-full px-4 py-2 text-[13px]"
          onClick={() => setQueryArtist(artistInput.trim())}
        >
          Analyze Artist
        </button>
      </div>
      <div className="w-full mb-4">
        <div className="flex w-full flex-wrap justify-center gap-2 px-2">
        {decades.map((d) => (
          <button key={d} onClick={() => setActiveDec(d)} className="shrink-0 px-3 py-2 rounded-full text-[13px] font-dm-sans"
            style={{ backgroundColor: activeDec === d ? "transparent" : "#1C1C1C", border: activeDec === d ? "1.5px solid #1DB954" : "1.5px solid transparent", color: activeDec === d ? "#1DB954" : "#A0A0A0" }}>{d}</button>
        ))}
        </div>
      </div>
      <h2 className="font-clash text-[18px] md:text-xl font-bold mb-3" style={{ color: "white" }}>
        {hasQuery ? `${shownArtist} in the ${activeDec}` : "Search for an artist"}
      </h2>
      {err && (
        <div className="vybe-card mb-4" style={{ border: "1px solid rgba(255,107,107,0.35)" }}>
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>{err}</p>
          <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
            API base: <span className="font-dm-mono">{API_BASE}</span>
          </p>
        </div>
      )}
      <div className="vybe-card mb-6 overflow-visible pb-1 perf-scroll-section">
        {radarBlock}
      </div>
      <SectionHeader title={hasQuery ? "Closest Matches" : "Closest Match"} action={hasQuery ? "See all" : ""} onAction={hasQuery ? () => setShowAllMatches(true) : undefined} />
      <div className="mb-10 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] perf-scroll-section">
        {!hasQuery ? (
          <div className="vybe-card">
            <p className="text-[13px] font-dm-sans text-center" style={{ color: "#A0A0A0" }}>
              Search for an artist
            </p>
          </div>
        ) : (
          <SongCarousel songs={matchSongs} />
        )}
      </div>
      <div className="rounded-[16px] p-4 mb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] perf-scroll-section" style={{ backgroundColor: "#1C1C1C" }}>
        <p className="text-[13px] font-dm-sans mb-1" style={{ color: "#A0A0A0" }}>Why these songs?</p>
        <p className="text-[13px] font-dm-sans" style={{ color: "#1DB954" }}>
          {loading ? "Analyzing..." : insightText}
        </p>
      </div>
    </PageWrapper>
  );
}
