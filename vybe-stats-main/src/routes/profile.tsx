import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis } from "recharts";
import { ChartContainer } from "../components/ChartContainer";
import { PageWrapper } from "../components/PageWrapper";
import { SectionHeader } from "../components/SectionHeader";
import { SongCarousel } from "../components/SongCarousel";
import { useCountUp } from "../hooks/useCountUp";
import { ClientOnly } from "../components/ClientOnly";
import { getVybePersonality, getVybePlaylist, type VybeSong } from "../lib/vybeStore";
import { getVybeDisplayName, getVybeEmail } from "../lib/settingsStore";
import { useAuthUser } from "../lib/useAuthUser";

export const Route = createFileRoute("/profile")({ component: ProfileScreen });

function MetricCard({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const count = useCountUp(value);
  return (
    <div className="rounded-[16px] p-3" style={{ backgroundColor: "#1C1C1C" }}>
      <span className="text-[12px] block" style={{ color: "#A0A0A0" }}>
        {label}
      </span>
      <span className="font-dm-mono text-[24px] md:text-[28px] font-bold tabular-nums" style={{ color: "white" }}>
        {count}
        {suffix}
      </span>
    </div>
  );
}

function buildRadarFromPlaylist(playlist: VybeSong[]) {
  if (!playlist.length) {
    return [
      { axis: "Energy", value: 55 },
      { axis: "Dance", value: 50 },
      { axis: "Mood", value: 50 },
      { axis: "Tempo", value: 50 },
      { axis: "Acoustics", value: 40 },
      { axis: "Valence", value: 50 },
    ];
  }
  const avg = (fn: (s: VybeSong) => number) =>
    Math.round((playlist.map(fn).reduce((a, b) => a + b, 0) / playlist.length) * 100);
  const avgTempo =
    playlist.reduce((a, s) => a + Number(s.tempo ?? 0), 0) / playlist.length;
  const tempoScore = Math.min(100, Math.round(avgTempo / 2.2));
  return [
    { axis: "Energy", value: avg((s) => Number(s.energy ?? 0)) },
    { axis: "Dance", value: avg((s) => Number(s.energy ?? 0) * 0.95) },
    { axis: "Mood", value: avg((s) => Number(s.valence ?? 0)) },
    { axis: "Tempo", value: tempoScore },
    { axis: "Acoustics", value: avg((s) => 1 - Number(s.energy ?? 0) * 0.5) },
    { axis: "Valence", value: avg((s) => Number(s.valence ?? 0)) },
  ];
}

function ProfileScreen() {
  const user = useAuthUser();
  const personality = getVybePersonality();
  const playlist = getVybePlaylist();

  const displayOverride = getVybeDisplayName();
  const email = getVybeEmail();
  const title = personality?.title ?? "Your Vybe";
  const subtitle = personality?.desc ?? "Build your sound profile with the quiz and saved tracks.";
  const displayName = user?.displayName || displayOverride || (personality ? title : "Guest");
  const initials =
    displayName === "Guest"
      ? "G"
      : displayName
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

  const joinedHint = user ? "Synced account" : "Local profile on this device";
  const [photoBroken, setPhotoBroken] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return;
    window.localStorage.setItem(
      "vybe_firebase_profile_v1",
      JSON.stringify({ displayName: user.displayName ?? "", email: user.email ?? "", photoURL: user.photoURL ?? "" })
    );
  }, [user]);

  useEffect(() => {
    setPhotoBroken(false);
  }, [user?.photoURL]);

  const uniqueGenres = useMemo(() => {
    const set = new Set<string>();
    playlist.forEach((s) => {
      const g = (s.genre || "").trim();
      if (g) set.add(g);
    });
    return set.size;
  }, [playlist]);

  const avgEnergyPct = useMemo(() => {
    if (!playlist.length) return 0;
    return Math.round((playlist.reduce((a, s) => a + Number(s.energy ?? 0), 0) / playlist.length) * 100);
  }, [playlist]);

  const avgTempo = useMemo(() => {
    if (!playlist.length) return 0;
    const t = playlist.map((s) => Number(s.tempo ?? 0)).filter((x) => x > 0);
    if (!t.length) return 0;
    return Math.round(t.reduce((a, b) => a + b, 0) / t.length);
  }, [playlist]);

  const radarData = useMemo(() => buildRadarFromPlaylist(playlist), [playlist]);

  const genreData = useMemo(() => {
    const counts: Record<string, number> = {};
    playlist.forEach((s) => {
      const g = (s.genre || "").trim();
      if (!g) return;
      counts[g] = (counts[g] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [playlist]);

  const recentSongs = useMemo(() => {
    if (!playlist.length) {
      return [
        { name: "Save tracks from Playlist", artist: "or Face-Off", energy: 0.5, valence: 0.5, isPlaying: true as const },
      ];
    }
    return playlist.slice(0, 12).map((s, i) => ({
      name: s.name,
      artist: s.artist,
      energy: s.energy,
      valence: s.valence,
      isPlaying: i === 0,
    }));
  }, [playlist]);

  return (
    <PageWrapper>
      <h1 className="vybe-page-title">My Vybe</h1>

      <div className="vybe-card flex flex-col items-center mb-4">
        {user?.photoURL && !photoBroken ? (
          <img
            src={user.photoURL}
            alt="Profile"
            className="w-[72px] h-[72px] rounded-full object-cover mb-3 ring-1 ring-white/10"
            onError={() => setPhotoBroken(true)}
          />
        ) : (
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center font-dm-sans font-medium text-[24px] mb-3"
            style={{ background: "linear-gradient(135deg,#1DB954,#0a7a35)", color: "white" }}
          >
            {initials}
          </div>
        )}
        <h2 className="font-clash text-[20px] font-bold text-center px-2" style={{ color: "white" }}>
          {displayName}
        </h2>
        <p className="text-[14px] text-center px-3 mt-1" style={{ color: "#A0A0A0" }}>
          {subtitle}
        </p>
        <p className="font-dm-mono text-[12px] mt-2" style={{ color: "#666" }}>
          {user?.email || email || joinedHint}
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          {!user && (
            <>
              <Link to="/login" className="text-[13px]" style={{ color: "#1DB954" }}>
                Log in
              </Link>
              <Link to="/signup" className="text-[13px]" style={{ color: "#1DB954" }}>
                Sign up
              </Link>
            </>
          )}
          <Link to="/settings" className="text-[13px]" style={{ color: "#1DB954" }}>
            Settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Tracks saved" value={playlist.length} />
        <MetricCard label="Genres" value={uniqueGenres} />
        <MetricCard label="Avg energy" value={avgEnergyPct} suffix="%" />
        <MetricCard label="Avg tempo" value={avgTempo} />
      </div>

      <SectionHeader title="Audio DNA" action={false} />
      <div className="vybe-card mb-6 overflow-hidden">
        <ClientOnly>
          <ChartContainer className="h-[232px] md:h-[280px] lg:h-[300px]">
            <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <PolarGrid stroke="#1C1C1C" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "#A0A0A0", fontSize: 11 }} />
              <Radar dataKey="value" stroke="#1DB954" fill="rgba(29,185,84,0.19)" />
            </RadarChart>
          </ChartContainer>
        </ClientOnly>
      </div>

      <SectionHeader title="Top Genres" action={false} />
      <div className="vybe-card mb-6 overflow-hidden">
        {genreData.length === 0 ? (
          <p className="text-[13px] py-8 text-center" style={{ color: "#A0A0A0" }}>
            Save tracks with genres to see your mix here.
          </p>
        ) : (
          <ClientOnly>
            <ChartContainer className="h-[200px] md:h-[236px] lg:h-[260px]">
              <BarChart data={genreData} layout="vertical" margin={{ top: 8, left: 4, right: 12, bottom: 8 }}>
                <XAxis type="number" tick={{ fill: "#A0A0A0", fontSize: 10 }} />
                <YAxis type="category" dataKey="genre" tick={{ fill: "#A0A0A0", fontSize: 11 }} width={88} />
                <Bar dataKey="count" fill="#1DB954" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartContainer>
          </ClientOnly>
        )}
      </div>

      <SectionHeader title="Recent activity" action={false} />
      <SongCarousel songs={recentSongs} />
    </PageWrapper>
  );
}
