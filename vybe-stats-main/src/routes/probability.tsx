import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { CustomSlider } from "../components/CustomSlider";
import { ChartContainer } from "../components/ChartContainer";
import { PageWrapper } from "../components/PageWrapper";
import { API_BASE, apiBinomialProbability, apiNormalProbability, apiPoissonEstimate } from "../services/api";

export const Route = createFileRoute("/probability")({ component: ProbabilityScreen });

type NormalResp = {
  mean: number;
  std: number;
  z_score: number;
  probability_above: number; // percent
  target: number;
};

type BinomResp = {
  k_values: number[];
  probabilities: number[]; // 0..1
  expected_hits: number;
  std: number;
};

type PoissonResp = {
  lambda: number;
  hit_rate: number; // percent
  expected_viral: number;
  k_values: number[];
  probabilities: number[];
  error?: string;
};

function ProbabilityScreen() {
  const [target, setTarget] = useState(70);
  const [nSongs, setNSongs] = useState(10);
  const [normal, setNormal] = useState<NormalResp | null>(null);
  const [binom, setBinom] = useState<BinomResp | null>(null);
  const [poisson, setPoisson] = useState<PoissonResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Simple heuristic mapping: higher target score => lower "hit probability"
  const hitProb = useMemo(() => {
    const p = 0.45 - (target / 100) * 0.25; // ~0.20..0.45
    return Math.max(0.05, Math.min(0.7, p));
  }, [target]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setErr(null);
    Promise.all([
      apiNormalProbability(target, ac.signal) as Promise<NormalResp>,
      apiBinomialProbability(nSongs, hitProb, ac.signal) as Promise<BinomResp>,
      // For Poisson we need a genre; use a stable, common one.
      apiPoissonEstimate("pop", nSongs, ac.signal) as Promise<PoissonResp>,
    ])
      .then(([n, b, p]) => {
        setNormal(n);
        setBinom(b);
        setPoisson(p);
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [target, nSongs, hitProb]);

  const binomialData = useMemo(() => {
    if (!binom) return [];
    return binom.k_values.map((k, i) => ({
      k,
      prob: Math.round(binom.probabilities[i] * 1000) / 10, // percent with 0.1 precision
    }));
  }, [binom]);

  const zScore = normal ? normal.z_score.toFixed(2) : "—";
  return (
    <PageWrapper>
      <h1 className="vybe-page-title !mb-2">Hit or Miss?</h1>
      <p className="text-[14px] mb-6 md:text-[15px] md:leading-relaxed" style={{ color: "#A0A0A0" }}>
        What are the odds your song goes viral?
      </p>
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
      <div className="text-center mb-4">
        <span className="font-dm-mono text-[32px] font-bold" style={{ color: "#1DB954" }}>{target}</span>
        <span className="font-dm-mono text-[16px]" style={{ color: "#A0A0A0" }}> / 100</span>
      </div>
      <div className="mb-6"><CustomSlider label="Target Score" value={target} onChange={setTarget} /></div>
      <div className="vybe-card mb-6">
        <svg viewBox="0 0 300 120" className="w-full">
          <defs><linearGradient id="bellFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1DB954" stopOpacity="0.3"/><stop offset="100%" stopColor="#1DB954" stopOpacity="0.05"/></linearGradient></defs>
          <path d="M10 100 Q50 100 80 90 Q110 70 130 40 Q150 10 170 40 Q190 70 220 90 Q250 100 290 100" fill="none" stroke="#1DB954" strokeWidth="2"/>
          <line x1={10+(target/100)*280} y1="5" x2={10+(target/100)*280} y2="100" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="4 3"/>
        </svg>
        <p className="font-clash text-[22px] font-bold text-center mt-2" style={{ color: "white" }}>
          {loading && !normal ? "Loading…" : `P(X > ${target}) = ${normal ? normal.probability_above.toFixed(1) : "—"}%`}
        </p>
      </div>
      <div className="vybe-card mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px]" style={{ color: "#A0A0A0" }}>Songs in batch</span>
          <div className="flex items-center gap-3">
            <button onClick={()=>setNSongs(Math.max(1,nSongs-1))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1C1C1C", color: "white" }}>−</button>
            <span className="font-dm-mono text-[16px]" style={{ color: "white" }}>{nSongs}</span>
            <button onClick={()=>setNSongs(Math.min(20,nSongs+1))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1C1C1C", color: "white" }}>+</button>
          </div>
        </div>
        <div className="overflow-hidden">
          <ChartContainer className="h-[146px] md:h-[174px]">
            <BarChart data={binomialData} margin={{ top: 8, left: -8, right: 8, bottom: 0 }}>
              <XAxis dataKey="k" tick={{ fill: "#A0A0A0", fontSize: 10 }} />
              <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} />
              <Bar dataKey="prob" fill="#1DB954" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
      <div className="vybe-card mb-4">
        <span className="text-[12px]" style={{ color: "#A0A0A0" }}>Expected viral hits (Poisson)</span>
        <div className="font-dm-mono text-[36px] font-bold mt-1" style={{ color: "white" }}>
          {poisson?.error ? "—" : (poisson?.expected_viral?.toFixed?.(1) ?? "—")}
        </div>
      </div>
      <div className="vybe-card">
        <span className="text-[12px]" style={{ color: "#A0A0A0" }}>Z-Score</span>
        <div className="font-dm-mono text-[32px] font-bold mt-1" style={{ color: "#1DB954" }}>{zScore}</div>
        <p className="text-[13px] mt-1" style={{ color: "#A0A0A0" }}>{Number(zScore) > 1 ? "Above average — this track stands out" : "Within normal range"}</p>
      </div>
    </PageWrapper>
  );
}
