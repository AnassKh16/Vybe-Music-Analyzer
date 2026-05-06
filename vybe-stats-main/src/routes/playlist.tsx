import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { Zap, Music, Smile } from "lucide-react";
import { ChartContainer } from "../components/ChartContainer";
import { PageWrapper } from "../components/PageWrapper";
import { SectionHeader } from "../components/SectionHeader";
import { SongCarousel } from "../components/SongCarousel";
import { GymIcon, HeartbreakIcon, LateNightIcon, PartyIcon, RoadTripIcon, StudyIcon } from "../components/icons/MoodIcons";
import { apiPlaylist, type SongRow } from "../services/api";
import { addSongToVybe } from "../lib/vybeStore";
import { pushVybeNotification } from "../lib/notificationsFeed";
import { loadPageState, savePageState } from "../lib/pageStateStore";

export const Route = createFileRoute("/playlist")({ component: PlaylistScreen });

const moods = [
  { label: "Study", Icon: StudyIcon },
  { label: "Gym", Icon: GymIcon },
  { label: "Party", Icon: PartyIcon },
  { label: "Heartbreak", Icon: HeartbreakIcon },
  { label: "Road Trip", Icon: RoadTripIcon },
  { label: "Late Night", Icon: LateNightIcon },
];

type PlaylistPageState = {
  selected: string[];
  songs: SongRow[];
  showGenTop20: boolean;
};
function PlaylistScreen() {
  const saved = loadPageState<PlaylistPageState>("playlist");
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState<string[]>(saved?.selected?.length ? saved.selected : ["Party"]);
  const [songs, setSongs] = useState<SongRow[]>(Array.isArray(saved?.songs) ? saved!.songs : []);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [showGenTop20, setShowGenTop20] = useState(Boolean(saved?.showGenTop20));
  const [shuffleCount, setShuffleCount] = useState(0);
  const toggle = (l: string) => setSelected((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]));
  const activeMood = selected[selected.length - 1] ?? "Party";

  /** First 10 for horizontal strip; See all sheet lists full 20 from API. */
  const genSongsCarousel = useMemo(
    () =>
      songs.slice(0, 10).map((s, i) => ({
        name: s.track_name,
        artist: s.artists,
        energy: s.energy,
        valence: s.valence,
        tempo: s.tempo,
        genre: s.track_genre,
        isPlaying: i === 0,
      })),
    [songs]
  );
  const radarData = useMemo(() => {
    const avg = (fn: (s: SongRow) => number) =>
      songs.length ? (songs.map(fn).reduce((a, b) => a + b, 0) / songs.length) * 100 : 0;
    return [
      { axis: "Energy", value: Math.round(avg((s) => Number(s.energy ?? 0))) },
      { axis: "Dance", value: Math.round(avg((s) => Number(s.danceability ?? 0))) },
      { axis: "Mood", value: Math.round(avg((s) => Number(s.valence ?? 0))) },
      { axis: "Speed", value: Math.round(Math.min(100, (songs.length ? songs.reduce((a, s) => a + Number(s.tempo ?? 0), 0) / songs.length : 0) / 2.2)) },
      { axis: "Acoustics", value: Math.round(avg((s) => Number(s.acousticness ?? 0))) },
      { axis: "Valence", value: Math.round(avg((s) => Number(s.valence ?? 0))) },
    ];
  }, [songs]);
  const stats = useMemo(() => {
    const avg = (fn: (s: SongRow) => number) =>
      songs.length ? songs.map(fn).reduce((a, b) => a + b, 0) / songs.length : 0;
    return [
      { icon: Zap, label: "Energy", value: avg((s) => Number(s.energy ?? 0)).toFixed(2) },
      { icon: Music, label: "Danceability", value: avg((s) => Number(s.danceability ?? 0)).toFixed(2) },
      { icon: Smile, label: "Valence", value: avg((s) => Number(s.valence ?? 0)).toFixed(2) },
    ];
  }, [songs]);

  const normalizeMoodKey = (m: string) => m.toLowerCase().replace(/\s+/g, "");

  const generate = () => {
    setLoading(true);
    const moodKeys = selected.length ? selected.map(normalizeMoodKey) : [normalizeMoodKey(activeMood)];
    const uniqueKeys = Array.from(new Set(moodKeys));
    Promise.all(uniqueKeys.map((mood) => apiPlaylist(mood, undefined, shuffleCount > 0)))
      .then((groups: any[]) => {
        const merged: SongRow[] = [];
        const seen = new Set<string>();
        groups.flat().forEach((row: SongRow) => {
          const k = `${String(row.track_name ?? "").toLowerCase()}::${String(row.artists ?? "").toLowerCase()}`;
          if (!k || seen.has(k)) return;
          seen.add(k);
          merged.push(row);
        });
        if (shuffleCount > 0) {
          for (let i = merged.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [merged[i], merged[j]] = [merged[j], merged[i]];
          }
        }
        setSongs(merged.slice(0, 20));
      })
      .finally(() => setLoading(false));
  };
  const addAllToVybe = () => {
    // Unshift stacks last-first; reverse so track #1 stays top of the batch.
    const n = songs.length;
    [...songs].reverse().forEach((s) =>
      addSongToVybe({
        name: s.track_name,
        artist: s.artists,
        energy: s.energy,
        valence: s.valence,
        tempo: s.tempo,
        genre: s.track_genre,
      })
    );
    if (n > 0) {
      pushVybeNotification({
        title: "Playlist added to Vybe",
        body: `${n} track${n === 1 ? "" : "s"} from your ${activeMood} mix are in your library.`,
        kind: "vybe",
      });
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };
  useEffect(() => {
    // If we restored songs, don't immediately overwrite them on mount.
    if (!hydrated) {
      setHydrated(true);
      if (songs.length > 0) return;
    }
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, shuffleCount]);

  useEffect(() => {
    if (!hydrated) return;
    savePageState<PlaylistPageState>("playlist", { selected, songs, showGenTop20 });
  }, [hydrated, selected, songs, showGenTop20]);

  return (
    <PageWrapper>
      <AnimatePresence>
        {showGenTop20 && (
          <div className="fixed inset-0 z-[70]">
            <motion.button
              type="button"
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
              onClick={() => setShowGenTop20(false)}
              aria-label="Close generated sequence"
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
              aria-labelledby="gen-seq-title"
            >
              <h3 id="gen-seq-title" className="font-clash text-[20px] font-bold mb-2 shrink-0" style={{ color: "white" }}>
                Generated sequence · Top 20
              </h3>
              <p className="text-[12px] mb-3 shrink-0" style={{ color: "#A0A0A0" }}>
                Current mood mix in playlist order (#1 is first in the sequence).
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar pr-1 pb-[calc(env(safe-area-inset-bottom,0px)+72px)]">
                <div className="vybe-card">
                  {songs.slice(0, 20).length === 0 ? (
                    <p className="text-[13px] py-4 text-center" style={{ color: "#A0A0A0" }}>
                      {loading ? "Loading sequence…" : "No tracks yet — pick a mood above."}
                    </p>
                  ) : (
                    songs.slice(0, 20).map((s, i) => (
                      <Link
                        key={`${s.track_name}-${i}`}
                        to="/song"
                        search={{
                          track: s.track_name,
                          artist: s.artists,
                          energy: s.energy,
                          valence: s.valence,
                          tempo: s.tempo,
                          genre: s.track_genre,
                        }}
                        className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0 transition-colors hover:bg-[#1DB95422]"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-[13px] truncate" style={{ color: "white" }}>{s.track_name}</p>
                          <p className="text-[12px] truncate" style={{ color: "#A0A0A0" }}>{s.artists}</p>
                        </div>
                        <span className="font-dm-mono text-[11px] shrink-0" style={{ color: "#1DB954" }}>#{i + 1}</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <h1 className="vybe-page-title">Build your Vybe</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {moods.map((m) => {
          const sel = selected.includes(m.label);
          return (
            <motion.button key={m.label} whileTap={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}
              onClick={() => toggle(m.label)}
              className="group h-[56px] rounded-[50px] flex items-center gap-3 px-5 text-[14px] font-dm-sans touch-manipulation transition-all duration-200 hover:-translate-y-0.5 active:-translate-y-0.5"
              style={{
                backgroundColor: sel ? "rgba(29,185,84,0.08)" : "#1C1C1C",
                border: sel ? "1.5px solid rgba(29,185,84,0.95)" : "1.5px solid transparent",
                boxShadow: sel ? "0 0 0 1px rgba(29,185,84,0.2), 0 10px 22px rgba(29,185,84,0.08)" : "none",
                color: sel ? "#1DB954" : "white",
              }}
            >
              <m.Icon
                size={24}
                active={sel}
                className="shrink-0 transition-all duration-200 group-hover:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))] group-active:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))]"
              />
              {m.label}
            </motion.button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button type="button" className="vybe-btn-primary w-full px-6" onClick={addAllToVybe} disabled={!songs.length || loading}>
          {added ? "Added to your Vybe" : "Add to your Vybe"}
        </button>
        <button type="button" className="vybe-btn-ghost w-full" onClick={() => setShuffleCount((n) => n + 1)} disabled={loading}>
          {loading ? "Shuffling..." : "Reshuffle"}
        </button>
      </div>
      <SectionHeader title="Generated Sequence" onAction={() => setShowGenTop20(true)} />
      <div className="mb-6"><SongCarousel songs={genSongsCarousel} /></div>
      <SectionHeader title="Playlist DNA" action={false} />
      <div className="vybe-card mb-4 overflow-hidden">
        <ChartContainer>
          <RadarChart data={radarData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <PolarGrid stroke="#1C1C1C" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "#A0A0A0", fontSize: 11 }} />
            <Radar dataKey="value" stroke="#1DB954" fill="rgba(29,185,84,0.19)" fillOpacity={1} />
          </RadarChart>
        </ChartContainer>
      </div>
      <div className="flex flex-wrap gap-2 md:gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex-1 flex items-center gap-1.5 rounded-full px-3 py-2" style={{ backgroundColor: "#1C1C1C" }}>
            <s.icon size={14} color="#1DB954" />
            <span className="font-dm-mono text-[12px]" style={{ color: "#1DB954" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
