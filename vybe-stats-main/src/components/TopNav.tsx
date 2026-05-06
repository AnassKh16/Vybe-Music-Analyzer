import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { VybeLogo } from "./VybeLogo";
import { Bell, Settings } from "lucide-react";
import { getUnreadNotificationCount, subscribeNotifications } from "../lib/notificationsFeed";
import { getVybeSettings, subscribeVybeSettings } from "../lib/settingsStore";
import { useAuthUser } from "../lib/useAuthUser";

export function TopNav() {
  const location = useLocation();
  const settingsActive = location.pathname.startsWith("/settings");
  const profileActive = location.pathname.startsWith("/profile");
  const notifActive = location.pathname.startsWith("/notifications");
  const user = useAuthUser();
  const [unread, setUnread] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(() => getVybeSettings().notifications);
  const [photoBroken, setPhotoBroken] = useState(false);

  useEffect(() => {
    const tick = () => {
      setUnread(getUnreadNotificationCount());
      setNotifEnabled(getVybeSettings().notifications);
    };
    tick();
    const u1 = subscribeNotifications(tick);
    const u2 = subscribeVybeSettings(tick);
    return () => {
      u1();
      u2();
    };
  }, []);

  useEffect(() => {
    setPhotoBroken(false);
  }, [user?.photoURL]);

  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 md:px-6 bg-black/90 backdrop-blur-md supports-[backdrop-filter]:bg-black/70"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <VybeLogo size="sm" />
      <div className="flex items-center gap-3">
        <Link
          to="/notifications"
          aria-label="Notifications"
          className={`group relative inline-flex items-center justify-center ${notifActive ? "text-[#1DB954]" : "text-[#A0A0A0] hover:text-[#1DB954] active:text-[#1DB954]"}`}
        >
          <Bell
            size={22}
            className="transition-all duration-200 text-current group-hover:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))] group-active:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))]"
          />
          {notifEnabled && unread > 0 && (
            <span
              className="absolute -top-0.5 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-dm-mono font-bold flex items-center justify-center"
              style={{ backgroundColor: "#1DB954", color: "#000" }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
        <Link
          to="/settings"
          aria-label="Go to settings"
          className={`group inline-flex items-center justify-center ${settingsActive ? "text-[#1DB954]" : "text-[#A0A0A0] hover:text-[#1DB954] active:text-[#1DB954]"}`}
        >
          <Settings
            size={20}
            className="transition-all duration-200 text-current group-hover:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))] group-active:[filter:drop-shadow(0_0_8px_rgba(29,185,84,0.55))]"
          />
        </Link>
        <Link
          to="/profile"
          aria-label="Go to profile"
          className={`group inline-flex items-center justify-center ${profileActive ? "text-[#1DB954]" : "text-[#A0A0A0] hover:text-[#1DB954] active:text-[#1DB954]"}`}
        >
          {user?.photoURL && !photoBroken ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-7 h-7 rounded-full object-cover ring-1"
              style={{ ringColor: profileActive ? "#1DB95455" : "rgba(255,255,255,0.12)" } as any}
              loading="lazy"
              decoding="async"
              onError={() => setPhotoBroken(true)}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-dm-sans"
              style={{ backgroundColor: "#1C1C1C", color: profileActive ? "#1DB954" : "#A0A0A0" }}
              aria-hidden
            >
              {(user?.displayName?.trim()?.[0] || user?.email?.trim()?.[0] || "G").toUpperCase()}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}