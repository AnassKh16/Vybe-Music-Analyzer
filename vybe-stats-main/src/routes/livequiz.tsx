import { createFileRoute } from "@tanstack/react-router";
import { memo, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { ChartContainer } from "../components/ChartContainer";
import { LazyMount } from "../components/LazyMount";
import { PageWrapper } from "../components/PageWrapper";
import { API_BASE, apiClassifyGenre, apiMysterySong, apiSongs } from "../services/api";
import { clearPageState } from "../lib/pageStateStore";

export const Route = createFileRoute("/livequiz")({ component: LiveQuizScreen });

type MysteryResp = {
  actual_genre: string;
  features: { danceability: number; energy: number; tempo: number; valence: number; acousticness: number };
  track_name: string;
  artists: string;
};
type ClassifyResp = {
  predicted_genre: string;
  probabilities: Record<string, number>;
  top_3: Array<[string, number]>;
};
const INITIAL_RADAR = [
  { axis: "Energy", value: 0 },
  { axis: "Dance", value: 0 },
  { axis: "Valence", value: 0 },
  { axis: "Acoustics", value: 0 },
  { axis: "Tempo", value: 0 },
];
const INITIAL_BARS = [
  { label: "Genre", pct: 0 },
];

const MysteryRadar = memo(function MysteryRadar({ data }: { data: Array<{ axis: string; value: number }> }) {
  return (
    <div className="vybe-card mb-4 overflow-hidden">
      <ChartContainer className="h-[196px] md:h-[240px]">
        <RadarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <PolarGrid stroke="#1C1C1C" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "#A0A0A0", fontSize: 10 }} />
          <Radar
            dataKey="value"
            stroke="#1DB954"
            fill="rgba(29,185,84,0.19)"
            isAnimationActive={false}
          />
        </RadarChart>
      </ChartContainer>
    </div>
  );
});

function LiveQuizScreen() {
  useEffect(() => {
    // Exception: Live Quiz always starts fresh on reload.
    clearPageState("livequiz");
  }, []);

  const [timer, setTimer] = useState(15);
  const [selected, setSelected] = useState<string|null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [answerMode, setAnswerMode] = useState<"genre" | "song">("genre");
  const [clueType, setClueType] = useState<"graph" | "letters" | "traits" | "lyric">("graph");
  const [songOptions, setSongOptions] = useState<string[]>([]);
  const [mystery, setMystery] = useState<MysteryResp | null>(null);
  const [classify, setClassify] = useState<ClassifyResp | null>(null);
  const [roundLoading, setRoundLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(()=>{ if(timer<=0||selected||timedOut) return; const t=setTimeout(()=>setTimer(timer-1),1000); return ()=>clearTimeout(t); },[timer,selected,timedOut]);
  useEffect(() => {
    if (timer > 0 || selected || timedOut) return;
    setTimedOut(true);
  }, [selected, timedOut, timer]);
  const correctGenre = mystery?.actual_genre ?? "";
  const correctSong = mystery?.track_name ?? "";
  const correctAnswer = answerMode === "genre" ? correctGenre : correctSong;
  const probBars = useMemo(() => {
    const probs = classify?.probabilities ?? {};
    const top = Object.entries(probs).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return top.length ? top.map(([label, pct]) => ({ label, pct: Number(pct) })) : INITIAL_BARS;
  }, [classify]);
  const genreOptions = useMemo(() => {
    const opts = probBars.map((b) => b.label);
    if (correctGenre && !opts.includes(correctGenre)) opts.push(correctGenre);
    return opts.slice(0, 6).sort(() => Math.random() - 0.5);
  }, [correctGenre, probBars]);
  const answerOptions = useMemo(() => {
    if (answerMode === "genre") return genreOptions;
    return songOptions;
  }, [answerMode, genreOptions, songOptions]);
  const radarData = useMemo(() => {
    const f = mystery?.features;
    if (!f) return INITIAL_RADAR;
    const tempo = Math.max(0, Math.min(1, Number(f.tempo ?? 0) / 220));
    return [
      { axis: "Energy", value: Math.round((f.energy ?? 0) * 100) },
      { axis: "Dance", value: Math.round((f.danceability ?? 0) * 100) },
      { axis: "Valence", value: Math.round((f.valence ?? 0) * 100) },
      { axis: "Acoustics", value: Math.round((f.acousticness ?? 0) * 100) },
      { axis: "Tempo", value: Math.round(tempo * 100) },
    ];
  }, [mystery]);
  const maskedTitle = useMemo(() => {
    const title = mystery?.track_name ?? "Mystery Song";
    const words = title.split(/\s+/).filter(Boolean);
    if (!words.length) return "Mystery Song";
    if (words.length === 1) {
      const w = words[0];
      return `${w.slice(0, 1)}${"_".repeat(Math.max(3, w.length - 1))}`;
    }
    // Reveal only tiny prefixes so even short titles stay hidden.
    return words.map((w) => {
      const keep = w.length <= 3 ? 1 : 2;
      return `${w.slice(0, keep)}${"_".repeat(Math.max(2, w.length - keep))}`;
    }).join(" ");
  }, [mystery]);
  const clueTraits = useMemo(() => {
    const f = mystery?.features;
    if (!f) return ["No traits yet"];
    const lines: string[] = [];
    if (f.energy >= 0.7) lines.push("High energy profile");
    else if (f.energy <= 0.35) lines.push("Calmer energy profile");
    if (f.danceability >= 0.65) lines.push("Very danceable rhythm");
    if (f.acousticness >= 0.5) lines.push("Strong acoustic texture");
    if (f.valence <= 0.4) lines.push("More melancholic mood");
    if (f.valence >= 0.65) lines.push("Positive emotional tone");
    if (f.tempo >= 130) lines.push("Fast tempo signature");
    return lines.length ? lines.slice(0, 3) : ["Balanced audio fingerprint"];
  }, [mystery]);
  const lyricHint = useMemo(() => {
    if (!mystery) return "A chorus in the dark, waiting for your guess...";
    const title = mystery.track_name ?? "this track";
    const artist = mystery.artists ?? "the artist";
    return `Tonight it sounds like "${title}" - that ${artist} mood in one hook.`;
  }, [mystery]);
  const songProbBars = useMemo(() => {
    if (answerMode !== "song") return [];
    if (!answerOptions.length) return [];
    const correct = correctAnswer;
    const ranked = answerOptions.map((label, i) => {
      if (label === correct) return { label, pct: 46 };
      const base = Math.max(6, 24 - i * 4);
      return { label, pct: base };
    });
    const total = ranked.reduce((s, r) => s + r.pct, 0) || 1;
    return ranked.map((r) => ({ label: r.label, pct: Number(((r.pct / total) * 100).toFixed(1)) }));
  }, [answerMode, answerOptions, correctAnswer]);
  const displayBars = answerMode === "song" ? songProbBars : probBars;

  const loadRound = () => {
    const ac = new AbortController();
    const clues: Array<"graph" | "letters" | "traits" | "lyric"> = ["graph", "letters", "traits", "lyric"];
    const nextClue = clues[Math.floor(Math.random() * clues.length)];
    setClueType(nextClue);
    // If lyric clue shows, force song-guess mode for consistency.
    setAnswerMode(nextClue === "lyric" ? "song" : (Math.random() > 0.5 ? "genre" : "song"));
    setRoundLoading(true);
    setErr(null);
    setSelected(null);
    setTimedOut(false);
    setShowConfetti(false);
    setTimer(15);
    apiMysterySong(ac.signal)
      .then((m) => {
        const mm = m as MysteryResp;
        setMystery(mm);
        return Promise.all([
          apiClassifyGenre(mm.features, ac.signal),
          apiSongs(String(mm.actual_genre), 24, ac.signal),
        ]).then(([c, songs]) => ({ mm, c: c as ClassifyResp, songs: songs as any[] }));
      })
      .then(({ mm, c, songs }) => {
        setClassify(c);
        const correct = String(mm.track_name ?? "");
        const candidates = Array.from(new Set((songs ?? []).map((s) => String(s.track_name)).filter(Boolean))).filter((n) => n !== correct);
        const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, 5);
        const finalSet = Array.from(new Set([correct, ...shuffled])).filter(Boolean).sort(() => Math.random() - 0.5);
        setSongOptions(finalSet.length ? finalSet : [correct]);
      })
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setErr(String(e?.message || e));
      })
      .finally(() => setRoundLoading(false));
    return () => ac.abort();
  };

  useEffect(() => {
    const stop = loadRound();
    return () => stop?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (g:string)=>{
    setSelected(g);
    if (g===correctAnswer) setShowConfetti(true);
  };
  const timerColor = timer<=5?"#FF6B6B":"#1DB954";
  const timerPct = (timer/15)*100;
  const confettiDots = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        color: ["#1DB954", "#F5A623", "white"][i % 3],
        left: `${Math.random() * 100}%`,
        drift: (Math.random() - 0.5) * 200,
        rotate: Math.random() * 720,
        duration: 1.2 + Math.random(),
      })),
    [showConfetti]
  );
  return (
    <PageWrapper>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
        <h1 className="vybe-page-title !mb-0">Guess the Vybe</h1>
        <span className="font-dm-mono text-[13px]" style={{ color: "#A0A0A0" }}>
          {selected || timedOut ? `Actual: ${correctAnswer}` : answerMode === "genre" ? "Pick the genre" : "Pick the song"}
        </span>
      </div>
      {err && (
        <div className="vybe-card mb-4" style={{ border: "1px solid rgba(255,107,107,0.35)" }}>
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>{err}</p>
          <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
            API base: <span className="font-dm-mono">{API_BASE}</span>
          </p>
        </div>
      )}
      <div className="flex justify-center mb-4">
        <div className="relative w-20 h-20">
          <svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="#2A2A2A" strokeWidth="4"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke={timerColor} strokeWidth="4" strokeLinecap="round" strokeDasharray="213.6" strokeDashoffset={213.6-(timerPct/100)*213.6} transform="rotate(-90 40 40)"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><span className="font-dm-mono text-[36px] font-bold" style={{ color: "white" }}>{timer}</span></div>
        </div>
      </div>
      <p className="text-center text-[14px] mb-1" style={{ color: "#A0A0A0" }}>Mystery Song</p>
      <p className="text-center text-[13px] mb-3" style={{ color: "#A0A0A0" }}>
        {selected || timedOut ? `${mystery?.track_name ?? "-"} - ${mystery?.artists ?? "-"}` : clueType === "graph" ? "Audio fingerprint clue" : clueType === "letters" ? "Title letters clue" : clueType === "traits" ? "Characteristic clue" : "Lyric-style clue"}
      </p>
      {clueType === "graph" && (
        <LazyMount placeholder={<div className="h-[212px] md:h-[256px] vybe-card mb-4" />}>
          <MysteryRadar data={radarData} />
        </LazyMount>
      )}
      {clueType === "letters" && (
        <div className="vybe-card mb-4 text-center">
          <p className="text-[12px] mb-2" style={{ color: "#A0A0A0" }}>Guess from hidden title</p>
          <p className="font-dm-mono text-[16px] break-words" style={{ color: "#F5A623" }}>{maskedTitle}</p>
        </div>
      )}
      {clueType === "traits" && (
        <div className="vybe-card mb-4">
          <p className="text-[12px] mb-2" style={{ color: "#A0A0A0" }}>Mystery characteristics</p>
          {clueTraits.map((t) => (
            <p key={t} className="text-[13px] mb-1" style={{ color: "white" }}>• {t}</p>
          ))}
        </div>
      )}
      {clueType === "lyric" && (
        <div className="vybe-card mb-4">
          <p className="text-[12px] mb-2" style={{ color: "#A0A0A0" }}>Lyric clue</p>
          <p className="text-[14px] italic" style={{ color: "#F5A623" }}>{lyricHint}</p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {answerOptions.map(g=>{ const isCorrect=(selected||timedOut)&&g===correctAnswer; const isWrong=selected===g&&g!==correctAnswer; const dimmed=(selected||timedOut)&&!isCorrect&&!isWrong;
          return <button key={g} onClick={()=>!selected&&!timedOut&&!roundLoading&&handleSelect(g)} className="h-[52px] rounded-[12px] text-[14px] font-dm-sans flex items-center justify-center gap-2"
            style={{ backgroundColor:"#1C1C1C", border:isCorrect?"1.5px solid #1DB954":isWrong?"1.5px solid #FF6B6B":"1.5px solid transparent", color:dimmed?"rgba(255,255,255,0.2)":"white", opacity:dimmed?0.4:1 }}>
            {isCorrect&&<Check size={16} color="#1DB954"/>}{isWrong&&<X size={16} color="#FF6B6B"/>}
            {(!isCorrect&&!isWrong)?g:isCorrect?(timedOut?"Answer":"Correct!"):"Wrong"}
          </button>; })}
      </div>
      {(selected||timedOut)&&<div className="vybe-card mb-4">{displayBars.map(b=><div key={b.label} className="flex items-center gap-3 mb-2">
        <span className="text-[12px] w-16 font-dm-sans" style={{ color: "#A0A0A0" }}>{b.label}</span>
        <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: "#2A2A2A" }}><motion.div initial={{width:0}} animate={{width:`${b.pct}%`}} transition={{duration:0.5}} className="h-full rounded-full" style={{ backgroundColor: b.label===correctAnswer?"#1DB954":"#2A2A2A" }}/></div>
        <span className="font-dm-mono text-[12px] w-8 text-right" style={{ color: "white" }}>{b.pct}%</span>
      </div>)}</div>}
      <button className="vybe-btn-primary" onClick={loadRound} disabled={roundLoading}>
        {roundLoading ? "Loading..." : "Next Round →"}
      </button>
      <AnimatePresence>
        {showConfetti && (
          <div className="pointer-events-none fixed inset-0 z-50">
            {confettiDots.map((d) => (
              <motion.div
                key={d.id}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: d.color, left: d.left, top: "-10px" }}
                initial={{ y: 0 }}
                animate={{ y: 800, x: d.drift, rotate: d.rotate }}
                exit={{ opacity: 0 }}
                transition={{ duration: d.duration, ease: "easeIn" }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
