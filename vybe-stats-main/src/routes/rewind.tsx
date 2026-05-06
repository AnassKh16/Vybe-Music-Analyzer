import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Tooltip } from "recharts";
import { CustomSlider } from "../components/CustomSlider";
import { ChartContainer } from "../components/ChartContainer";
import { LazyMount } from "../components/LazyMount";
import { PageWrapper } from "../components/PageWrapper";
import { SectionHeader } from "../components/SectionHeader";
import {
  API_BASE,
  apiRewindBounds,
  apiRewindGenreShiftBuckets,
  apiRewindGenreShiftYearly,
  apiRewindYearly,
  type RewindGenreShiftResp,
  type RewindYearlyResp,
} from "../services/api";

export const Route = createFileRoute("/rewind")({ component: RewindScreen });

function RewindScreen() {
  const [bounds, setBounds] = useState<{ min: number; max: number }>({ min: 2010, max: 2024 });
  const [sliderIndex, setSliderIndex] = useState(0);
  const [yearly, setYearly] = useState<RewindYearlyResp | null>(null);
  const [shift, setShift] = useState<RewindGenreShiftResp | null>(null);
  const [allShift, setAllShift] = useState<RewindGenreShiftResp | null>(null);
  const [showAllShift, setShowAllShift] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [boundsReady, setBoundsReady] = useState(false);
  const yearlyCacheRef = useRef<Record<number, RewindYearlyResp>>({});

  const yearStops = useMemo(() => {
    const out: number[] = [];
    for (let y = bounds.min; y <= bounds.max; y += 5) out.push(y);
    if (out[out.length - 1] !== bounds.max) out.push(bounds.max);
    return out;
  }, [bounds.max, bounds.min]);
  const selectedEnd = yearStops[Math.max(0, Math.min(sliderIndex, yearStops.length - 1))] ?? bounds.max;

  useEffect(() => {
    const ac = new AbortController();
    apiRewindBounds(ac.signal)
      .then((b) => {
        setBounds({ min: b.min_year, max: b.max_year });
        const stops: number[] = [];
        for (let y = b.min_year; y <= b.max_year; y += 5) stops.push(y);
        if (stops[stops.length - 1] !== b.max_year) stops.push(b.max_year);
        setSliderIndex(Math.max(0, stops.length - 1));
        setBoundsReady(true);
      })
      .catch((e: any) => setErr(String(e?.message || e)));
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!boundsReady) return;
    const ac = new AbortController();
    const cached = yearlyCacheRef.current[selectedEnd];
    if (cached) {
      setYearly(cached);
      return () => ac.abort();
    }
    setLoading(true);
    setErr(null);
    apiRewindYearly(bounds.min, selectedEnd, ac.signal)
      .then((y) => {
        yearlyCacheRef.current[selectedEnd] = y;
        setYearly(y);
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [bounds.min, boundsReady, selectedEnd]);

  useEffect(() => {
    if (!boundsReady) return;
    const ac = new AbortController();
    setErr(null);
    Promise.all([
      apiRewindGenreShiftBuckets(bounds.min, bounds.max, ac.signal),
      apiRewindGenreShiftYearly(bounds.min, bounds.max, ac.signal),
    ])
      .then(([s, full]) => {
        setShift(s);
        setAllShift(full);
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      });
    return () => ac.abort();
  }, [bounds.max, bounds.min, boundsReady]);

  const lineData = yearly?.series ?? [];
  const eraBadges = yearly?.badges ?? [];
  const genreData = useMemo(() => {
    if (!shift) return [];
    return shift.data.map((r) => ({ ...r }));
  }, [shift]);
  const g = shift?.genres ?? [];
  const g1 = g[0] ?? "top_1";
  const g2 = g[1] ?? "top_2";
  const g3 = g[2] ?? "top_3";
  const lineChartBlock = useMemo(
    () => (
      <LazyMount placeholder={<div className="h-[200px] md:h-[248px] lg:h-[276px]" />}>
        <ChartContainer className="h-[200px] md:h-[248px] lg:h-[276px]">
          <LineChart data={lineData} margin={{ top: 8, left: -10, right: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" />
            <XAxis dataKey="year" tick={{ fill: "#A0A0A0", fontSize: 10, fontFamily: "DM Mono" }} />
            <YAxis tick={{ fill: "#A0A0A0", fontSize: 10, fontFamily: "DM Mono" }} domain={[0, 1]} />
            <Tooltip />
            <Line type="monotone" dataKey="danceability" stroke="#1DB954" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="energy" stroke="#F5A623" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="valence" stroke="#FF6B6B" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </LazyMount>
    ),
    [lineData]
  );
  const genreChartBlock = useMemo(
    () => (
      <LazyMount placeholder={<div className="h-[176px] md:h-[216px] lg:h-[236px]" />}>
        <ChartContainer className="h-[176px] md:h-[216px] lg:h-[236px]">
          <BarChart data={genreData} layout="vertical" margin={{ top: 8, left: 4, right: 12, bottom: 8 }}>
            <XAxis type="number" tick={{ fill: "#A0A0A0", fontSize: 10, fontFamily: "DM Mono" }} />
            <YAxis type="category" dataKey="bucket" tick={{ fill: "#A0A0A0", fontSize: 11 }} width={62} />
            <Tooltip />
            <Bar dataKey={g1} name={g1} stackId="a" fill="#1DB954" />
            <Bar dataKey={g2} name={g2} stackId="a" fill="#F5A623" />
            <Bar dataKey={g3} name={g3} stackId="a" fill="#FF6B6B" />
          </BarChart>
        </ChartContainer>
      </LazyMount>
    ),
    [g1, g2, g3, genreData]
  );

  return (
    <PageWrapper>
      <AnimatePresence>
        {showAllShift && (
          <div className="fixed inset-0 z-[70]">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowAllShift(false)}
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
              <h3 className="font-clash text-[20px] font-bold mb-1" style={{ color: "white" }}>Genre Shift (All Years)</h3>
              <p className="text-[12px] mb-3" style={{ color: "#A0A0A0" }}>
                {bounds.min} - {bounds.max} year-wise distribution
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto hide-scrollbar pr-1">
                <div className="vybe-card overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ color: "#A0A0A0" }}>
                        <th className="py-2 pr-4 text-[12px] font-medium">Year</th>
                        <th className="py-2 pr-4 text-[12px] font-medium">Top Genre 1</th>
                        <th className="py-2 pr-4 text-[12px] font-medium">Top Genre 2</th>
                        <th className="py-2 pr-4 text-[12px] font-medium">Top Genre 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(allShift?.data ?? []).map((row) => (
                        <tr key={String(row.year)} className="border-t border-white/5">
                          <td className="py-2 pr-4 text-[12px]" style={{ color: "white" }}>{String(row.year)}</td>
                          <td className="py-2 pr-4 text-[12px]" style={{ color: "#1DB954" }}>
                            {String((row as any).top_1_label || "-")} ({Number((row as any).top_1 ?? 0).toFixed(1)}%)
                          </td>
                          <td className="py-2 pr-4 text-[12px]" style={{ color: "#F5A623" }}>
                            {String((row as any).top_2_label || "-")} ({Number((row as any).top_2 ?? 0).toFixed(1)}%)
                          </td>
                          <td className="py-2 pr-4 text-[12px]" style={{ color: "#FF6B6B" }}>
                            {String((row as any).top_3_label || "-")} ({Number((row as any).top_3 ?? 0).toFixed(1)}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <h1 className="vybe-page-title">Year Rewind</h1>
      <div className="mb-2 text-center">
        <span className="font-dm-mono text-[18px]" style={{ color: "#1DB954" }}>
          {bounds.min} — {selectedEnd}
        </span>
      </div>
      <div className="mb-6">
        <CustomSlider min={0} max={Math.max(0, yearStops.length - 1)} value={sliderIndex} onChange={setSliderIndex} />
      </div>
      {err && (
        <div className="vybe-card mb-4" style={{ border: "1px solid rgba(255,107,107,0.35)" }}>
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>{err}</p>
          <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
            API base: <span className="font-dm-mono">{API_BASE}</span>
          </p>
        </div>
      )}
      <div className="vybe-card mb-6 overflow-hidden perf-scroll-section">
        {lineChartBlock}
      </div>
      <div className="flex flex-wrap gap-2 md:gap-3 mb-6 justify-center md:justify-start perf-scroll-section">
        {(loading && eraBadges.length === 0 ? ["Loading…"] : eraBadges).map((b) => (
          <div key={b} className="px-4 py-2 rounded-full text-[12px] md:text-[13px] font-dm-sans" style={{ backgroundColor: "#1C1C1C", color: "#F5A623" }}>
            {b}
          </div>
        ))}
      </div>
      <SectionHeader title="Genre Shift" onAction={() => setShowAllShift(true)} />
      <div className="vybe-card overflow-hidden perf-scroll-section">
        {genreChartBlock}
      </div>
    </PageWrapper>
  );
}
