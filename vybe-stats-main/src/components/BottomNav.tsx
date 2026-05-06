import { useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Music, Zap, Swords, Brain, Rewind, Headphones, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { PlaylistVybeIcon } from "./icons/PlaylistVybeIcon";

type NavIcon = ComponentType<{ size?: number; className?: string; color?: string }>;

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

function PlaylistNavIcon({ size = 22, className = "" }: { size?: number; className?: string }) {
  return <PlaylistVybeIcon size={size} className={className} color="currentColor" />;
}

type MenuOption = {
  to: string;
  label: string;
  desc: string;
  icon: NavIcon;
};

type NavTab =
  | { key: "home" | "playlist"; to: string; icon: NavIcon; label: string; type: "direct" }
  | { key: "predict" | "battle" | "quiz"; icon: NavIcon; label: string; type: "menu"; options: MenuOption[] };
type MenuTab = Extract<NavTab, { type: "menu" }>;

const tabs: NavTab[] = [
  { key: "home", to: "/home", icon: Home, label: "Home", type: "direct" },
  { key: "playlist", to: "/playlist", icon: PlaylistNavIcon, label: "Playlist", type: "direct" },
  {
    key: "predict",
    icon: Zap,
    label: "Predict",
    type: "menu",
    options: [
      { to: "/rewind", label: "Year Rewind", desc: "Explore eras", icon: Rewind },
      { to: "/timemachine", label: "Music Time Machine", desc: "Travel through decades", icon: Headphones },
      { to: "/probability", label: "Hit Song Probability", desc: "Predict viral odds", icon: Sparkles },
      { to: "/explore", label: "Data Explorer", desc: "Dive into track stats", icon: Home },
    ],
  },
  {
    key: "battle",
    icon: Swords,
    label: "Battle",
    type: "menu",
    options: [
      { to: "/battle", label: "Genre Battle", desc: "Compare genres", icon: Swords },
      { to: "/faceoff", label: "Face-Off", desc: "Song vs song", icon: Zap },
    ],
  },
  {
    key: "quiz",
    icon: Brain,
    label: "Quiz",
    type: "menu",
    options: [
      { to: "/livequiz", label: "Live Quiz", desc: "Real-time challenge", icon: Brain },
      { to: "/quiz", label: "Personality Quiz", desc: "Find your vybe", icon: QuizEmojiIcon },
    ],
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<null | "predict" | "battle" | "quiz">(null);
  const menuTab = useMemo(
    () => tabs.find((tab): tab is MenuTab => tab.type === "menu" && tab.key === activeMenu) ?? null,
    [activeMenu],
  );

  const isActive = (tab: NavTab) => {
    if (tab.type === "direct") {
      return location.pathname.startsWith(tab.to);
    }
    return tab.options.some((opt) => location.pathname.startsWith(opt.to));
  };

  return (
    <>
      <AnimatePresence>
        {menuTab && (
          <div className="fixed inset-0 z-[70]">
            <motion.button
              aria-label="Close menu"
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
              onClick={() => setActiveMenu(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ y: 44, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 44, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 vybe-shell-width rounded-t-[24px] p-4 pb-6 overflow-hidden"
              style={{ backgroundColor: "#111111" }}
            >
              <div
                className="max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain hide-scrollbar pb-[env(safe-area-inset-bottom,16px)] pr-1"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
              <h3 className="font-clash text-[20px] font-bold mb-3" style={{ color: "white" }}>
                {menuTab.label}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {menuTab.options.map((option: MenuOption) => (
                  <button
                    key={option.to}
                    className="group text-left rounded-[16px] p-3 min-h-[96px] touch-manipulation transition-all duration-200 hover:-translate-y-0.5 active:-translate-y-0.5 active:scale-[0.99]"
                    style={{ backgroundColor: "#1C1C1C" }}
                    onClick={() => {
                      setActiveMenu(null);
                      navigate({ to: option.to });
                    }}
                  >
                    <option.icon
                      size={20}
                      color="#1DB954"
                      className="mb-2 transition-all duration-200 group-hover:scale-105 group-hover:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))] group-active:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))]"
                    />
                    <p className="text-[13px] font-dm-sans font-medium" style={{ color: "white" }}>
                      {option.label}
                    </p>
                    <p className="text-[11px]" style={{ color: "#A0A0A0" }}>
                      {option.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 vybe-shell-width z-50"
        style={{ backgroundColor: "#000000" }}
      >
        <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,8px)]">
          {tabs.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                className="group relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 touch-manipulation"
                onClick={() => {
                  if (tab.type === "direct") {
                    navigate({ to: tab.to });
                    return;
                  }
                  setActiveMenu(tab.key);
                }}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Icon
                    size={22}
                    className={`transition-all duration-200 ${
                      active
                        ? "text-[#1DB954] group-hover:[filter:drop-shadow(0_0_7px_rgba(29,185,84,0.55))] group-active:[filter:drop-shadow(0_0_7px_rgba(29,185,84,0.55))]"
                        : "text-[#444444] group-hover:text-[#7A7A7A] group-hover:[filter:drop-shadow(0_0_6px_rgba(180,180,180,0.35))] group-active:text-[#8A8A8A] group-active:[filter:drop-shadow(0_0_6px_rgba(190,190,190,0.38))]"
                    }`}
                  />
                </motion.div>
                <span
                  className={`text-[11px] font-dm-sans transition-colors duration-200 ${
                    active ? "text-[#1DB954]" : "text-[#444444] group-hover:text-[#7A7A7A] group-active:text-[#8A8A8A]"
                  }`}
                >
                  {tab.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="navDot"
                    className="absolute -bottom-1 w-[3px] h-[3px] rounded-full"
                    style={{ backgroundColor: "#1DB954" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}