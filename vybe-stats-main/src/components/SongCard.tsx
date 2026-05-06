import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAlbumArt, getTrackOverview } from "../services/lastfm";

interface SongCardProps {
  name: string;
  artist: string;
  energy?: number;
  valence?: number;
  isPlaying?: boolean;
  matchPct?: number;
  tempo?: number;
  genre?: string;
}

function getGradient(energy: number, valence: number, genre?: string) {
  const g = (genre || "").toLowerCase();
  if (g.includes("pop")) return "linear-gradient(135deg, #FF6B35, #FF0055)";
  if (g.includes("rock") || g.includes("metal")) return "linear-gradient(135deg, #FF3E3E, #C81D25)";
  if (g.includes("hip") || g.includes("rap") || g.includes("trap")) return "linear-gradient(135deg, #825FFF, #5A3FE6)";
  if (g.includes("elect") || g.includes("edm") || g.includes("house") || g.includes("techno")) return "linear-gradient(135deg, #21B7FF, #0A8FDB)";
  if (g.includes("jazz") || g.includes("blues") || g.includes("soul")) return "linear-gradient(135deg, #FFB000, #E38600)";
  if (g.includes("r&b") || g.includes("rnb")) return "linear-gradient(135deg, #EE50A4, #C73285)";
  if (g.includes("classical") || g.includes("orchestra")) return "linear-gradient(135deg, #947EFF, #6F59D8)";
  if (g.includes("country") || g.includes("folk")) return "linear-gradient(135deg, #E68A4A, #BA6A33)";
  if (g.includes("reggae") || g.includes("dancehall")) return "linear-gradient(135deg, #65C94F, #3FA339)";
  if (g.includes("bluegrass")) return "linear-gradient(135deg, #1DB954, #159447)";
  if (g) return "linear-gradient(135deg, #1DB954, #159447)";
  // Keep no-image fallback stable (avoid temporary blue mismatch while genre resolves).
  return "linear-gradient(135deg, #1DB954, #159447)";
}

const RECENT_KEY = "vybe_recent_song_card_v1";
const RECENT_EVENT = "vybe:recent-song-card";

function songKey(artist: string, name: string) {
  return `${artist.trim().toLowerCase()}::${name.trim().toLowerCase()}`;
}

function getRecentSongCardKey() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(RECENT_KEY) ?? "";
}

function setRecentSongCardKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_KEY, key);
  window.dispatchEvent(new Event(RECENT_EVENT));
}

export function SongCard({
  name,
  artist,
  energy = 0.5,
  valence = 0.5,
  isPlaying,
  matchPct,
  tempo,
  genre,
}: SongCardProps) {
  const [art, setArt] = useState<string | null>(null);
  const [isRecent, setIsRecent] = useState(false);
  const [resolvedGenre, setResolvedGenre] = useState<string | undefined>(genre);
  const key = songKey(artist, name);

  useEffect(() => {
    let alive = true;
    getAlbumArt(artist, name).then((url) => {
      if (!alive) return;
      setArt(url);
    });
    return () => {
      alive = false;
    };
  }, [artist, name]);

  useEffect(() => {
    if (genre && genre.trim()) {
      setResolvedGenre(genre);
      return;
    }
    let alive = true;
    getTrackOverview(artist, name).then((d) => {
      if (!alive) return;
      const g = d?.tags?.[0];
      if (g && g.trim()) setResolvedGenre(g);
    });
    return () => {
      alive = false;
    };
  }, [genre, artist, name]);

  useEffect(() => {
    const update = () => setIsRecent(getRecentSongCardKey() === key);
    update();
    if (typeof window === "undefined") return;
    window.addEventListener(RECENT_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(RECENT_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [key]);

  return (
    <Link
      to="/song"
      search={{
        track: name,
        artist,
        energy,
        valence,
        tempo: typeof tempo === "number" ? tempo : undefined,
        genre: resolvedGenre,
      }}
      className="block"
      aria-label={`Open ${name} by ${artist}`}
      onClick={() => setRecentSongCardKey(key)}
    >
      <motion.div
        whileTap={{ scale: 0.96 }}
        className="flex-shrink-0 w-[158px] sm:w-[172px] lg:w-[184px] min-h-[196px] lg:min-h-[208px] rounded-[20px] overflow-hidden relative"
        style={{ backgroundColor: "#1C1C1C" }}
      >
        {art ? (
          <img src={art} alt={`${name} cover`} className="h-[100px] w-full object-cover" loading="lazy" decoding="async" fetchPriority="high" />
        ) : (
          <div className="h-[100px] w-full" style={{ background: getGradient(energy, valence, resolvedGenre) }} />
        )}
        {matchPct !== undefined && (
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-dm-mono"
            style={{ backgroundColor: "#1DB954", color: "white" }}
          >
            {matchPct}%
          </div>
        )}
        <div className="p-3 flex flex-col justify-between h-[100px]">
          <div>
            <p className="font-dm-sans font-medium text-[14px] truncate" style={{ color: "white" }}>
              {name}
            </p>
            <p className="text-[12px] truncate" style={{ color: "#A0A0A0" }}>
              {artist}
            </p>
          </div>
          {isRecent && (
            <div className="flex items-end gap-[3px] h-5">
              <div className="w-[3px] rounded-full eq-bar-1" style={{ backgroundColor: "#1DB954" }} />
              <div className="w-[3px] rounded-full eq-bar-2" style={{ backgroundColor: "#1DB954" }} />
              <div className="w-[3px] rounded-full eq-bar-3" style={{ backgroundColor: "#1DB954" }} />
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}