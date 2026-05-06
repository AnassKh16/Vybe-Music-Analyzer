import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CustomSlider } from "../components/CustomSlider";
import { PageWrapper } from "../components/PageWrapper";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ClientOnly } from "../components/ClientOnly";
import { LazyMount } from "../components/LazyMount";
import { setVybePersonality } from "../lib/vybeStore";
import { canShareStats, subscribeVybeSettings } from "../lib/settingsStore";
import { clearPageState, loadPageState, savePageState } from "../lib/pageStateStore";

export const Route = createFileRoute("/quiz")({
  component: QuizScreen,
});

const emojis = ["😴", "🙁", "😐", "😊", "🔥"];
function getEmoji(v: number) {
  if (v <= 20) return emojis[0];
  if (v <= 40) return emojis[1];
  if (v <= 60) return emojis[2];
  if (v <= 80) return emojis[3];
  return emojis[4];
}

type Axis = "energy" | "social" | "focus" | "mood" | "novelty";
type Question = {
  id: string;
  axis: Axis;
  reverse?: boolean;
  title: string;
  left: string;
  right: string;
};
type PersonalityCard = {
  name: string;
  blurb: string;
  profile: Record<Axis, number>;
};

const QUESTION_BANK: Question[] = [
  { id: "q1", axis: "energy", title: "How intense is your ideal track?", left: "Whisper quiet", right: "Full chaos" },
  { id: "q2", axis: "social", title: "Where do you play music most?", left: "Solo bubble", right: "Crowd scenes" },
  { id: "q3", axis: "focus", title: "How complex should the arrangement be?", left: "Minimal", right: "Layered" },
  { id: "q4", axis: "mood", title: "How positive should it feel?", left: "Melancholic", right: "Uplifting" },
  { id: "q5", axis: "novelty", title: "Do you chase fresh sounds?", left: "Comfort zone", right: "Always new" },
  { id: "q6", axis: "energy", reverse: true, title: "How chill should your playlist stay?", left: "Very chill", right: "No chill" },
  { id: "q7", axis: "social", reverse: true, title: "Do you skip songs everyone knows?", left: "Keep the classics", right: "Only deep cuts" },
  { id: "q8", axis: "focus", title: "Lyrics or instrumentation?", left: "Simple lyrics", right: "Detailed instrumentation" },
  { id: "q9", axis: "mood", reverse: true, title: "How dark can the vibe go?", left: "Very dark", right: "Light only" },
  { id: "q10", axis: "novelty", title: "How often should tracks surprise you?", left: "Rarely", right: "Constantly" },
  { id: "q11", axis: "energy", title: "Beat drop preference?", left: "Soft transitions", right: "Hard drops" },
  { id: "q12", axis: "social", title: "Playlist purpose?", left: "Headphones only", right: "Party ready" },
  { id: "q13", axis: "focus", reverse: true, title: "How repetitive can hooks be?", left: "Loop forever", right: "Need variation" },
  { id: "q14", axis: "mood", title: "Should songs feel hopeful?", left: "Not needed", right: "Absolutely" },
  { id: "q15", axis: "novelty", reverse: true, title: "Do you repeat old favorites?", left: "All the time", right: "Almost never" },
  { id: "q16", axis: "energy", title: "Gym playlist energy?", left: "Steady pace", right: "Adrenaline rush" },
  { id: "q17", axis: "social", title: "How sing-along friendly should songs be?", left: "Not at all", right: "Very singable" },
  { id: "q18", axis: "focus", title: "How much sonic detail do you notice?", left: "Low detail", right: "Micro details" },
  { id: "q19", axis: "mood", title: "End-of-day vibe?", left: "Reflective", right: "Optimistic" },
  { id: "q20", axis: "novelty", title: "Would you try unknown artists?", left: "Rarely", right: "Always" },
];

const PERSONALITY_CARDS: PersonalityCard[] = [
  { name: "Midnight Burner", blurb: "High-octane tracks and bold momentum.", profile: { energy: 92, social: 70, focus: 50, mood: 58, novelty: 78 } },
  { name: "Neon Driver", blurb: "Fast beats, city lights, and confident hooks.", profile: { energy: 84, social: 76, focus: 55, mood: 66, novelty: 72 } },
  { name: "Festival Pulse", blurb: "Mainstage energy with crowd-first choices.", profile: { energy: 88, social: 90, focus: 40, mood: 72, novelty: 60 } },
  { name: "Bass Nomad", blurb: "Deep rhythm and adventurous sonic travel.", profile: { energy: 80, social: 58, focus: 62, mood: 48, novelty: 85 } },
  { name: "Sunset Drifter", blurb: "Balanced grooves for every mood swing.", profile: { energy: 60, social: 62, focus: 58, mood: 64, novelty: 52 } },
  { name: "Velvet Echo", blurb: "Soft edges, emotional depth, and warmth.", profile: { energy: 34, social: 42, focus: 66, mood: 40, novelty: 45 } },
  { name: "Quiet Orbit", blurb: "Introspective loops and gentle movement.", profile: { energy: 28, social: 30, focus: 72, mood: 46, novelty: 48 } },
  { name: "Lo-Fi Architect", blurb: "Texture-driven listening with detail focus.", profile: { energy: 36, social: 34, focus: 88, mood: 52, novelty: 55 } },
  { name: "Cloud Voyager", blurb: "Dreamy tones and airy harmonic layers.", profile: { energy: 42, social: 40, focus: 70, mood: 68, novelty: 62 } },
  { name: "Retro Catalyst", blurb: "Classic charm with modern punch.", profile: { energy: 68, social: 74, focus: 52, mood: 70, novelty: 50 } },
  { name: "Aurora Bloom", blurb: "Positive, melodic, and endlessly replayable.", profile: { energy: 64, social: 66, focus: 56, mood: 86, novelty: 54 } },
  { name: "Chrome Minimal", blurb: "Precision beats and clean sonic space.", profile: { energy: 58, social: 44, focus: 82, mood: 50, novelty: 70 } },
  { name: "Wild Frequency", blurb: "Unpredictable picks and experimental sparks.", profile: { energy: 72, social: 52, focus: 60, mood: 54, novelty: 94 } },
  { name: "Heartline Static", blurb: "Moody vocals with emotional gravity.", profile: { energy: 46, social: 48, focus: 64, mood: 30, novelty: 58 } },
  { name: "Golden Uplift", blurb: "Feel-good anthems and bright choruses.", profile: { energy: 70, social: 78, focus: 46, mood: 92, novelty: 56 } },
  { name: "Night Shift Wave", blurb: "After-hours rhythm with controlled intensity.", profile: { energy: 74, social: 54, focus: 68, mood: 44, novelty: 66 } },
  { name: "Analog Rebel", blurb: "Raw edge, strong identity, and high taste shift.", profile: { energy: 66, social: 50, focus: 60, mood: 48, novelty: 90 } },
  { name: "Prism Collector", blurb: "You collect moods like colors.", profile: { energy: 55, social: 58, focus: 62, mood: 74, novelty: 80 } },
  { name: "Signal Runner", blurb: "Momentum-first listening with focused goals.", profile: { energy: 82, social: 60, focus: 80, mood: 60, novelty: 64 } },
  { name: "Harbor Calm", blurb: "Grounded, smooth, and emotionally centered.", profile: { energy: 30, social: 56, focus: 74, mood: 78, novelty: 40 } },
];

const QUIZ_LEN = 5;

function pickQuestions() {
  const copy = [...QUESTION_BANK];
  const out: Question[] = [];
  while (out.length < QUIZ_LEN && copy.length) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

function QuizScreen() {
  const saved = loadPageState<{
    sessionQuestions: Question[];
    step: number;
    intensity: number;
    answers: number[];
    showResult: boolean;
  }>("quiz");
  const initialSaved = saved && !saved.showResult ? saved : null;
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>(() => (initialSaved?.sessionQuestions?.length ? initialSaved.sessionQuestions : pickQuestions()));
  const [step, setStep] = useState(initialSaved?.step ?? 0);
  const [intensity, setIntensity] = useState(initialSaved?.intensity ?? 55);
  const [answers, setAnswers] = useState<number[]>(Array.isArray(initialSaved?.answers) ? initialSaved.answers : []);
  const [showResult, setShowResult] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const current = sessionQuestions[step];

  useEffect(() => {
    const refresh = () => setCanShare(canShareStats());
    refresh();
    return subscribeVybeSettings(refresh);
  }, []);

  useEffect(() => {
    if (!canShare && shareOpen) setShareOpen(false);
  }, [canShare, shareOpen]);

  useEffect(() => {
    // Exception: completed quiz should not restore. Refresh should start a fresh quiz.
    if (showResult) {
      clearPageState("quiz");
      return;
    }
    savePageState("quiz", { sessionQuestions, step, intensity, answers, showResult: false });
  }, [sessionQuestions, step, intensity, answers, showResult]);

  const result = useMemo(() => {
    const all = showResult ? answers : [...answers, intensity];
    const dims: Record<Axis, number[]> = { energy: [], social: [], focus: [], mood: [], novelty: [] };
    for (let i = 0; i < all.length; i += 1) {
      const q = sessionQuestions[i];
      if (!q) continue;
      const normalized = q.reverse ? 100 - all[i] : all[i];
      dims[q.axis].push(normalized);
    }
    const score: Record<Axis, number> = {
      energy: dims.energy.length ? dims.energy.reduce((a, b) => a + b, 0) / dims.energy.length : 50,
      social: dims.social.length ? dims.social.reduce((a, b) => a + b, 0) / dims.social.length : 50,
      focus: dims.focus.length ? dims.focus.reduce((a, b) => a + b, 0) / dims.focus.length : 50,
      mood: dims.mood.length ? dims.mood.reduce((a, b) => a + b, 0) / dims.mood.length : 50,
      novelty: dims.novelty.length ? dims.novelty.reduce((a, b) => a + b, 0) / dims.novelty.length : 50,
    };
    const best = PERSONALITY_CARDS
      .map((c) => {
        const dist =
          Math.abs(score.energy - c.profile.energy) +
          Math.abs(score.social - c.profile.social) +
          Math.abs(score.focus - c.profile.focus) +
          Math.abs(score.mood - c.profile.mood) +
          Math.abs(score.novelty - c.profile.novelty);
        return { c, dist };
      })
      .sort((a, b) => a.dist - b.dist)[0].c;
    const chart = [
      { value: Math.max(10, Math.round(score.energy)), color: "#1DB954" },
      { value: Math.max(10, Math.round(score.mood)), color: "#F5A623" },
      { value: Math.max(10, Math.round(score.novelty)), color: "#FF6B6B" },
    ];
    return { title: best.name, desc: best.blurb, chart };
  }, [answers, intensity, sessionQuestions, showResult]);

  const shareText = `My Vybe personality is ${result.title}. ${result.desc}`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://vybe.app/quiz";
  const copyShare = async () => {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, "_blank", "noopener,noreferrer");
  const shareInstagram = async () => {
    await copyShare();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };
  const shareNative = async () => {
    if ("share" in navigator) {
      await navigator.share({ title: "My Vybe Personality", text: shareText, url: shareUrl });
      return;
    }
    await copyShare();
  };

  if (showResult) {
    return (
      <PageWrapper className="flex flex-col items-center pt-12">
        <div className="w-full max-w-xl">
          <div className="vybe-card overflow-hidden">
            <div className="px-2 pt-2 text-center">
              <p className="text-[14px]" style={{ color: "#A0A0A0" }}>
                Your Vybe is...
              </p>
              <h1
                className="font-clash text-[clamp(1.6rem,5.4vw,2.4rem)] md:text-[2.6rem] font-extrabold mt-2 text-center px-2"
                style={{ color: "white" }}
              >
                {result.title}
              </h1>
              <p
                className="text-[14px] md:text-[15px] mt-3 text-center leading-relaxed max-w-md mx-auto px-4"
                style={{ color: "#A0A0A0" }}
              >
                {result.desc}
              </p>
            </div>
            <LazyMount placeholder={<div className="mt-4 w-full max-w-[min(300px,86vw)] h-[240px] md:h-[280px] mx-auto" />}>
              <div className="mt-4 w-full max-w-[min(300px,86vw)] h-[240px] md:h-[280px] mx-auto">
                <ClientOnly>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart accessibilityLayer={false}>
                      <Pie
                        data={result.chart}
                        cx="50%"
                        cy="50%"
                        innerRadius="58%"
                        outerRadius="92%"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        isAnimationActive
                        animationDuration={800}
                      >
                        {result.chart.map((d, i) => (
                          <Cell key={i} fill={d.color} stroke="none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </div>
            </LazyMount>
            <div className="px-4 pb-4 mt-2 flex flex-col gap-3">
              <button
                type="button"
                className="vybe-btn-primary disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none"
                disabled={!canShare}
                title={canShare ? undefined : "Turn on Notifications and Share stats in Settings"}
                onClick={() => canShare && setShareOpen(true)}
              >
                Share your Vybe
              </button>
              <button
                className="vybe-btn-ghost"
                onClick={() => {
                  setSessionQuestions(pickQuestions());
                  setStep(0);
                  setIntensity(55);
                  setAnswers([]);
                  setShowResult(false);
                }}
              >
                Try another 5 →
              </button>
              <Link to="/home" className="vybe-btn-ghost">
                Explore your stats →
              </Link>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {shareOpen && (
            <div className="fixed inset-0 z-[80]">
              <motion.button
                type="button"
                className="absolute inset-0 bg-black/70"
                onClick={() => setShareOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] vybe-card"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
              >
                <h3 className="font-clash text-[20px] mb-1" style={{ color: "white" }}>Share your Vybe</h3>
                <p className="text-[12px] mb-3" style={{ color: "#A0A0A0" }}>Share to WhatsApp/Instagram or copy text.</p>
                <div className="space-y-2">
                  <button type="button" className="vybe-btn-ghost" onClick={shareWhatsApp}>Share to WhatsApp</button>
                  <button type="button" className="vybe-btn-ghost" onClick={shareInstagram}>Share to Instagram</button>
                  <button type="button" className="vybe-btn-ghost" onClick={copyShare}>{copied ? "Copied" : "Copy share text"}</button>
                  <button type="button" className="vybe-btn-primary" onClick={shareNative}>More options</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageWrapper>
    );
  }

  const pct = ((step + 1) / QUIZ_LEN) * 100;
  return (
    <PageWrapper className="flex flex-col items-center pt-8">
      <div className="relative w-20 h-20 md:w-24 md:h-24 mb-8">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 80 80" aria-hidden>
          <circle cx="40" cy="40" r="34" fill="none" stroke="#2A2A2A" strokeWidth="3" strokeDasharray="4 4" />
          <circle cx="40" cy="40" r="34" fill="none" stroke="#1DB954" strokeWidth="3" strokeDasharray={`${pct * 2.136} 213.6`} strokeLinecap="round" transform="rotate(-90 40 40)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-dm-mono text-[20px]" style={{ color: "white" }}>{step + 1}/{QUIZ_LEN}</span>
        </div>
      </div>
      <h2 className="font-clash text-[clamp(1.25rem,3vw,1.75rem)] md:text-3xl font-extrabold text-center mb-10 px-2" style={{ color: "white" }}>
        {current.title}
      </h2>
      <div className="w-full max-w-xl mx-auto mb-6 relative pt-13">
        <AnimatePresence mode="wait">
          <motion.span
            key={getEmoji(intensity)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute top-0 -translate-x-1/2 flex select-none text-[22px] sm:text-[24px] leading-none md:text-[26px] pointer-events-none"
            style={{ lineHeight: 1, left: `calc(${intensity}% + ${((100 - intensity) / 100) * 4 - (intensity / 100) * 4}px)` }}
            aria-hidden
          >
            {getEmoji(intensity)}
          </motion.span>
        </AnimatePresence>
        <CustomSlider value={intensity} onChange={setIntensity} />
      </div>
      <div className="flex justify-between w-full mb-8">
        <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{current.left}</span>
        <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{current.right}</span>
      </div>
      <div className="w-full mt-auto">
        <button
          className="vybe-btn-primary"
          onClick={() => {
            const nextAnswers = [...answers, intensity];
            if (step < QUIZ_LEN - 1) {
              setAnswers(nextAnswers);
              setStep(step + 1);
              setIntensity(55);
              return;
            }
            setAnswers(nextAnswers);
            setVybePersonality({ title: result.title, desc: result.desc, savedAt: Date.now() });
            setShowResult(true);
          }}
        >
          Next →
        </button>
      </div>
    </PageWrapper>
  );
}