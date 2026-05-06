import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { Rewind, Swords, Brain, Zap, Headphones, Sparkles, LayoutGrid } from "lucide-react";
import { PlaylistVybeIcon } from "../components/icons/PlaylistVybeIcon";
import { PageWrapper } from "../components/PageWrapper";
import { SectionHeader } from "../components/SectionHeader";
import { SongCarousel } from "../components/SongCarousel";
import { useCountUp } from "../hooks/useCountUp";
import { ClientOnly } from "../components/ClientOnly";
import { getVybePersonality, getVybePlaylist } from "../lib/vybeStore";

export const Route = createFileRoute("/home")({
  component: HomeScreen,
});

const fallbackSpark = [{ v: 120 }, { v: 125 }, { v: 118 }, { v: 130 }, { v: 124 }, { v: 128 }, { v: 122 }];

type ShortcutLink = {
  Icon: LucideIcon | typeof PlaylistVybeIcon;
  name: string;
  desc: string;
  to: string;
};

function QuizEmojiIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  const iconSize = size + 4;
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.5" stroke="#1DB954" strokeWidth="1.8" />
      <circle cx="9.2" cy="10.2" r="1" fill="#1DB954" />
      <circle cx="14.8" cy="10.2" r="1" fill="#1DB954" />
      <path
        d="M8.6 14.1c.9 1.2 2 1.8 3.4 1.8s2.5-.6 3.4-1.8"
        stroke="#1DB954"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

const shortcuts: ShortcutLink[] = [
  { Icon: QuizEmojiIcon as unknown as LucideIcon, name: "Personality Quiz", desc: "Find your vybe", to: "/quiz" },
  { Icon: PlaylistVybeIcon, name: "Playlist Generator", desc: "Build a mood mix", to: "/playlist" },
  { Icon: Rewind, name: "Year Rewind", desc: "Explore eras", to: "/rewind" },
  { Icon: Zap, name: "Face-Off", desc: "Compare songs", to: "/faceoff" },
  { Icon: Swords, name: "Genre Battle", desc: "Genres clash", to: "/battle" },
  { Icon: Brain, name: "Live Quiz", desc: "Test your ear", to: "/livequiz" },
];

/** Full app feature list for Quick Access “See all” (aligned with mobile `allFeaturesLinks`). */
const allFeaturesSheet: ShortcutLink[] = [
  { Icon: QuizEmojiIcon as unknown as LucideIcon, name: "Personality Quiz", desc: "Find your vybe", to: "/quiz" },
  { Icon: Brain, name: "Live Quiz", desc: "Test your ear", to: "/livequiz" },
  { Icon: PlaylistVybeIcon, name: "Playlist Generator", desc: "Build a mood mix", to: "/playlist" },
  { Icon: Rewind, name: "Year Rewind", desc: "Explore eras", to: "/rewind" },
  { Icon: Headphones, name: "Time Machine", desc: "Retro remix", to: "/timemachine" },
  { Icon: Sparkles, name: "Hit Probability", desc: "Viral odds", to: "/probability" },
  { Icon: LayoutGrid, name: "Data Explorer", desc: "Deep stats", to: "/explore" },
  { Icon: Swords, name: "Genre Battle", desc: "Genres clash", to: "/battle" },
  { Icon: Zap, name: "Face-Off", desc: "Compare songs", to: "/faceoff" },
];

function ShortcutCardIcon({ Icon, compact }: { Icon: ShortcutLink["Icon"]; compact?: boolean }) {
  const cls = compact
    ? "shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))] group-active:scale-105 group-active:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))]"
    : "mb-2 shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))] group-active:scale-105 group-active:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))]";
  if (Icon === PlaylistVybeIcon) {
    return <PlaylistVybeIcon size={compact ? 20 : 22} className={cls} />;
  }
  const L = Icon as LucideIcon;
  return <L size={compact ? 18 : 20} color="#1DB954" className={cls} />;
}

function CountUpNumber({ target }: { target: number }) {
  const val = useCountUp(target);
  return <span>{val}</span>;
}

function HomeScreen() {
  const [showWeeklyTop, setShowWeeklyTop] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const personality = getVybePersonality();
  const playlist = getVybePlaylist();
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good evening";
    return "Good night";
  }, []);
  const weeklySongs = useMemo(
    () =>
      (playlist.length
        ? playlist.slice(0, 12).map((s, i) => ({ name: s.name, artist: s.artist, energy: s.energy, valence: s.valence, tempo: s.tempo, genre: s.genre, isPlaying: i === 0 }))
        : [
            { name: "Blinding Lights", artist: "The Weeknd", energy: 0.8, valence: 0.6, tempo: 171, genre: "pop", isPlaying: true },
            { name: "Levitating", artist: "Dua Lipa", energy: 0.9, valence: 0.8, tempo: 103, genre: "pop" },
            { name: "Circles", artist: "Post Malone", energy: 0.55, valence: 0.45, tempo: 120, genre: "pop" },
          ]),
    [playlist]
  );
  const avgEnergy = playlist.length ? Math.round((playlist.reduce((a, s) => a + Number(s.energy ?? 0), 0) / playlist.length) * 100) : 68;
  const avgMood = playlist.length ? Math.round((playlist.reduce((a, s) => a + Number(s.valence ?? 0), 0) / playlist.length) * 100) : 22;
  const avgRhythm = Math.max(5, 100 - Math.round((avgEnergy + avgMood) / 2));
  const donutData = [
    { value: avgEnergy, color: "#1DB954" },
    { value: avgMood, color: "#F5A623" },
    { value: avgRhythm, color: "#FF6B6B" },
  ];
  const traits = [
    { label: "Energy", value: avgEnergy, color: "#1DB954" },
    { label: "Rhythm", value: avgRhythm, color: "#F5A623" },
    { label: "Mood", value: avgMood, color: "#FF6B6B" },
  ];
  const sparkData = useMemo(() => {
    const tempos = playlist.map((s) => Number(s.tempo ?? 0)).filter((v) => v > 0);
    if (!tempos.length) return fallbackSpark;
    return tempos.slice(0, 7).map((v) => ({ v: Math.round(v) }));
  }, [playlist]);
  const avgBpm = sparkData.length ? Math.round(sparkData.reduce((a, s) => a + s.v, 0) / sparkData.length) : 124;
  const topGenre = useMemo(() => {
    const counts: Record<string, number> = {};
    playlist.forEach((s) => {
      const g = (s.genre || "").trim();
      if (!g) return;
      counts[g] = (counts[g] ?? 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "Hip-Hop";
  }, [playlist]);
  const focusLabel = avgEnergy > 70 ? "High" : avgEnergy > 45 ? "Balanced" : "Calm";
  const todayVybe = personality?.title ?? "Energetic";
  const volPct = useMemo(() => {
    if (playlist.length) {
      const e = playlist.reduce((a, s) => a + Number(s.energy ?? 0), 0) / playlist.length;
      const v = playlist.reduce((a, s) => a + Number(s.valence ?? 0), 0) / playlist.length;
      return Math.min(99, Math.max(12, Math.round((e * 0.62 + v * 0.38) * 100)));
    }
    const blend = (avgEnergy / 100) * 0.62 + (avgMood / 100) * 0.38;
    return Math.min(95, Math.max(22, Math.round(blend * 100)));
  }, [playlist, avgEnergy, avgMood]);
  const moodTone = avgMood >= 60 ? "Bright" : avgMood >= 38 ? "Balanced" : "Deep";
  const tempoFeel = avgBpm >= 128 ? "Fast lane" : avgBpm >= 104 ? "Steady" : "Chilled";
  const genreBlend = useMemo(() => {
    const counts: Record<string, number> = {};
    playlist.forEach((s) => {
      const g = (s.genre || "").trim();
      if (!g) return;
      counts[g] = (counts[g] ?? 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return "Add your tracks";
    if (sorted.length === 1) return sorted[0][0];
    return `${sorted[0][0]} · ${sorted[1][0]}`;
  }, [playlist]);

  return (
    <PageWrapper>
      <AnimatePresence>
        {showWeeklyTop && (
          <div className="fixed inset-0 z-[70]">
            <motion.button
              type="button"
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
              onClick={() => setShowWeeklyTop(false)}
              aria-label="Close weekly top"
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="weekly-top-title"
            >
              <h3 id="weekly-top-title" className="font-clash text-[20px] font-bold mb-2 shrink-0" style={{ color: "white" }}>
                Weekly Top 20
              </h3>
              <p className="text-[12px] mb-3 shrink-0" style={{ color: "#A0A0A0" }}>
                Your most recent tracks from Vybe playlist.
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar pr-1 pb-[calc(env(safe-area-inset-bottom,0px)+72px)]">
                <div className="vybe-card">
                  {(playlist.slice(0, 20).length ? playlist.slice(0, 20) : weeklySongs).map((s, i) => (
                    <Link
                      key={`${s.name}-${i}`}
                      to="/song"
                      search={{
                        track: s.name,
                        artist: s.artist,
                        energy: s.energy,
                        valence: s.valence,
                        tempo: s.tempo,
                        genre: s.genre,
                      }}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0 transition-colors hover:bg-[#1DB95422]"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-[13px] truncate" style={{ color: "white" }}>{s.name}</p>
                        <p className="text-[12px] truncate" style={{ color: "#A0A0A0" }}>{s.artist}</p>
                      </div>
                      <span className="font-dm-mono text-[11px]" style={{ color: "#1DB954" }}>#{i + 1}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <p className="text-[14px] font-dm-sans" style={{ color: "#A0A0A0" }}>{greeting}</p>
      <h1
        className="font-clash font-extrabold mt-1 mb-5 text-[clamp(1.625rem,2.5vw+1rem,2.25rem)] md:text-4xl"
        style={{ color: "white" }}
      >
        {todayVybe}
      </h1>

      {/* Listener DNA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="vybe-card flex flex-col md:flex-row md:items-center gap-5 md:gap-6 mb-6 overflow-hidden"
      >
        <div className="w-full max-w-[128px] md:max-w-[140px] aspect-square shrink-0 mx-auto md:mx-0">
          <ClientOnly>
            <div className="h-full w-full min-h-[112px] md:min-h-[128px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer={false}>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius="62%"
                    outerRadius="92%"
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((d, i) => (
                      <Cell key={i} fill={d.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ClientOnly>
        </div>
        <div className="flex flex-col gap-3 flex-1 min-w-0 w-full">
          {traits.map((t) => (
            <div key={t.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[12px] font-dm-sans" style={{ color: "#A0A0A0" }}>{t.label}</span>
                <span className="text-[12px] font-dm-mono" style={{ color: "white" }}>{t.value}%</span>
              </div>
              <div className="h-1 rounded-full" style={{ backgroundColor: "#2A2A2A" }}>
                <div className="h-full rounded-full" style={{ backgroundColor: t.color, width: `${t.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weekly Pulse */}
      <SectionHeader title="Your Weekly Pulse" action={false} />
      <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-6 md:flex-wrap md:overflow-visible">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0 md:flex-1 md:min-w-[148px] md:max-w-[calc(33.333%-0.5rem)] w-[160px] h-[120px] rounded-[20px] p-4 flex flex-col justify-between"
          style={{ backgroundColor: "#1C1C1C" }}
        >
          <span className="text-[12px]" style={{ color: "#A0A0A0" }}>Avg BPM</span>
          <span className="font-dm-mono text-[32px] font-bold" style={{ color: "white" }}>
            <CountUpNumber target={avgBpm} />
          </span>
          <div className="h-6 w-full min-w-[7rem]">
            <ClientOnly>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart accessibilityLayer={false} data={sparkData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="#1DB954"
                    strokeWidth={2}
                    dot={(props: any) =>
                      props?.index === sparkData.length - 1 ? (
                        <circle cx={props.cx} cy={props.cy} r={3.3} fill="#1DB954" />
                      ) : null
                    }
                    activeDot={{ r: 4.2, fill: "#ffffff", stroke: "#1DB954", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ClientOnly>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="flex-shrink-0 md:flex-1 md:min-w-[148px] md:max-w-[calc(33.333%-0.5rem)] w-[160px] h-[120px] rounded-[20px] p-4 flex flex-col justify-between"
          style={{ backgroundColor: "#1C1C1C" }}
        >
          <span className="text-[12px]" style={{ color: "#A0A0A0" }}>Focus Intensity</span>
          <span className="font-clash text-[20px] font-bold" style={{ color: "white" }}>{focusLabel}</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="flex-shrink-0 md:flex-1 md:min-w-[148px] md:max-w-[calc(33.333%-0.5rem)] w-[160px] h-[120px] rounded-[20px] p-4 flex flex-col justify-between"
          style={{ backgroundColor: "#1C1C1C" }}
        >
          <span className="text-[12px]" style={{ color: "#A0A0A0" }}>Top Genre</span>
          <span className="font-clash text-[20px] font-bold" style={{ color: "white" }}>{topGenre}</span>
        </motion.div>
      </div>

      {/* Today's Vybe — stats as compact pills inside the card (same style as original VOL / FRQ) */}
      <SectionHeader title="Today's Vybe" action={false} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="vybe-card mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-clash text-[22px] font-bold" style={{ color: "white" }}>{todayVybe}</span>
          <div className="flex items-end gap-[2px] h-5">
            <div className="w-[3px] rounded-full eq-bar-1" style={{ backgroundColor: "#1DB954" }} />
            <div className="w-[3px] rounded-full eq-bar-2" style={{ backgroundColor: "#1DB954" }} />
            <div className="w-[3px] rounded-full eq-bar-3" style={{ backgroundColor: "#1DB954" }} />
          </div>
        </div>
        {personality?.desc ? (
          <p className="text-[12px] mb-3 leading-relaxed line-clamp-2" style={{ color: "#A0A0A0" }}>
            {personality.desc}
          </p>
        ) : (
          <p className="text-[12px] mb-3 leading-relaxed" style={{ color: "#A0A0A0" }}>
            Take the personality quiz to pin a label on your sound.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-dm-mono shrink-0" style={{ backgroundColor: "#1C1C1C", color: "#1DB954" }}>
            VOL <CountUpNumber target={volPct} />%
          </span>
          <span className="px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-dm-mono shrink-0" style={{ backgroundColor: "#1C1C1C", color: "#1DB954" }}>
            FRQ <CountUpNumber target={avgBpm} />
          </span>
          <span className="px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-dm-mono shrink-0" style={{ backgroundColor: "#1C1C1C", color: "#1DB954" }}>
            TRK {playlist.length}
          </span>
          <span className="px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-dm-mono shrink-0" style={{ backgroundColor: "#1C1C1C", color: "#1DB954" }}>
            MOOD {moodTone}
          </span>
          <span
            className="px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-dm-mono shrink-0 max-w-[min(100%,13rem)] truncate"
            style={{ backgroundColor: "#1C1C1C", color: "#1DB954" }}
            title={tempoFeel}
          >
            FEEL {tempoFeel}
          </span>
          <span
            className="px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-dm-mono shrink-0 max-w-[min(100%,16rem)] truncate"
            style={{ backgroundColor: "#1C1C1C", color: "#1DB954" }}
            title={genreBlend}
          >
            MIX {genreBlend}
          </span>
        </div>
      </motion.div>

      {/* Weekly Songs (order follows account-scoped playlist in vybeStore) */}
      <SectionHeader title="Weekly Top" onAction={() => setShowWeeklyTop(true)} />
      <div className="mb-6">
        <SongCarousel songs={weeklySongs} />
      </div>

      {/* Quick Access */}
      <SectionHeader
        title="Quick Access"
        action={showAllFeatures ? "See less" : "See all"}
        onAction={() => setShowAllFeatures((o) => !o)}
      />
      <div className="-mx-4 px-4 sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 min-w-0">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory pr-[clamp(3rem,16vw,7.5rem)] [-webkit-overflow-scrolling:touch]">
          {shortcuts.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + i * 0.06 }}
              className="shrink-0 snap-start min-w-[152px] max-w-[174px] w-[42vw]"
            >
              <Link
                to={s.to}
                className="group block h-full rounded-[16px] p-3 transition-all duration-200 hover:-translate-y-0.5 active:-translate-y-0.5 active:scale-[0.99] active:[box-shadow:0_0_0_1px_rgba(29,185,84,0.25),0_10px_22px_rgba(29,185,84,0.08)]"
                style={{ backgroundColor: "#1C1C1C" }}
              >
                <ShortcutCardIcon Icon={s.Icon} />
                <p className="text-[13px] font-dm-sans font-medium" style={{ color: "white" }}>
                  {s.name}
                </p>
                <p className="text-[11px] leading-snug" style={{ color: "#A0A0A0" }}>
                  {s.desc}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {showAllFeatures && (
            <motion.div
              key="all-features-grid"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pt-1"
            >
              <p className="text-[11px] font-dm-sans pb-2" style={{ color: "#A0A0A0" }}>
                All features
              </p>
              <div className="grid grid-cols-3 gap-2 pb-2">
                {allFeaturesSheet.map((s) => (
                  <Link
                    key={s.to}
                    to={s.to}
                    onClick={() => setShowAllFeatures(false)}
                    className="group flex flex-col items-center justify-center gap-1 rounded-[12px] px-1.5 py-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 active:-translate-y-0.5 active:scale-[0.99] active:[box-shadow:0_0_0_1px_rgba(29,185,84,0.25),0_10px_22px_rgba(29,185,84,0.08)]"
                    style={{ backgroundColor: "#1C1C1C" }}
                  >
                    <ShortcutCardIcon Icon={s.Icon} compact />
                    <span
                      className="text-[10px] font-dm-sans font-medium leading-tight line-clamp-2 min-h-[2.25rem] flex items-center justify-center"
                      style={{ color: "white" }}
                    >
                      {s.name}
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}