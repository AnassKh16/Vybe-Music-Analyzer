import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { BellOff, CheckCheck } from "lucide-react";
import { PageWrapper } from "../components/PageWrapper";
import {
  getNotifications,
  clearNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
  type VybeNotification,
} from "../lib/notificationsFeed";
import { getVybeSettings, subscribeVybeSettings } from "../lib/settingsStore";

export const Route = createFileRoute("/notifications")({
  component: NotificationsScreen,
});

function NotificationsScreen() {
  const [items, setItems] = useState<VybeNotification[]>(() => getNotifications());
  const [settings, setSettings] = useState(() => getVybeSettings());

  useEffect(() => {
    setItems(getNotifications());
    return subscribeNotifications(() => setItems(getNotifications()));
  }, []);

  useEffect(() => {
    setSettings(getVybeSettings());
    return subscribeVybeSettings(() => setSettings(getVybeSettings()));
  }, []);

  const enabled = settings.notifications;

  return (
    <PageWrapper>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h1 className="vybe-page-title mb-0">Notifications</h1>
        {enabled && items.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {items.some((n) => !n.read) && (
              <button
                type="button"
                className="touch-manipulation flex items-center gap-1.5 text-[12px] font-dm-sans px-2 py-1 rounded-lg transition-opacity hover:opacity-90"
                style={{ color: "#1DB954" }}
                onClick={() => markAllNotificationsRead()}
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
            <button
              type="button"
              className="touch-manipulation text-[12px] font-dm-sans px-2 py-1 rounded-lg transition-opacity hover:opacity-90"
              style={{ color: "#A0A0A0" }}
              onClick={() => clearNotifications()}
              title="Remove all notifications"
            >
              Clear
            </button>
          </div>
        )}
      </div>
      <p className="text-[13px] mb-6" style={{ color: "#A0A0A0" }}>
        Live tips and Vybe updates while you use the app.{" "}
        <Link to="/settings" className="underline underline-offset-2" style={{ color: "#1DB954" }}>
          Manage in Settings
        </Link>
      </p>

      {!enabled ? (
        <div className="vybe-card flex flex-col items-center text-center py-10 px-4">
          <BellOff size={36} style={{ color: "#444" }} className="mb-3" />
          <p className="font-dm-sans text-[15px]" style={{ color: "white" }}>
            Notifications are off
          </p>
          <p className="text-[13px] mt-2 max-w-sm" style={{ color: "#A0A0A0" }}>
            Turn them on in Settings to see real-time tips and alerts here.
          </p>
          <Link to="/settings" className="vybe-btn-primary mt-5 px-6">
            Open Settings
          </Link>
        </div>
      ) : items.length === 0 ? (
        <div className="vybe-card py-10 px-4 text-center">
          <p className="text-[14px]" style={{ color: "#A0A0A0" }}>
            Nothing yet — keep exploring Vybe. Tips will appear here automatically.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className="w-full text-left vybe-card py-3 px-4 transition-opacity hover:opacity-95 active:opacity-90"
                style={{
                  borderLeft: n.read ? undefined : "3px solid #1DB954",
                  backgroundColor: n.read ? undefined : "rgba(29,185,84,0.04)",
                }}
                onClick={() => !n.read && markNotificationRead(n.id)}
              >
                <div className="flex justify-between gap-2 mb-1">
                  <span className="text-[13px] font-dm-sans font-medium" style={{ color: "white" }}>
                    {n.title}
                  </span>
                  <span className="font-dm-mono text-[10px] shrink-0" style={{ color: "#666" }}>
                    {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[12px] leading-snug" style={{ color: "#A0A0A0" }}>
                  {n.body}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PageWrapper>
  );
}
