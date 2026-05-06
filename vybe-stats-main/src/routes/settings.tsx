import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Trash2, LogOut } from "lucide-react";
import { PageWrapper } from "../components/PageWrapper";
import {
  getVybeDisplayName,
  getVybeEmail,
  getVybeSettings,
  setVybeSettings,
  subscribeVybeSettings,
  type VybeSettings,
} from "../lib/settingsStore";
import { useAuthUser } from "../lib/useAuthUser";
import { deleteFirebaseAccount, logoutFirebase, sendPasswordReset } from "../lib/firebase";

export const Route = createFileRoute("/settings")({
  component: SettingsScreen,
});

function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200]">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
            aria-label="Close"
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
          >
            <h3 className="font-clash text-[20px] font-bold mb-1 shrink-0" style={{ color: "white" }}>
              {title}
            </h3>
            <div className="min-h-0 flex-1 overflow-y-auto hide-scrollbar pr-1 pb-[calc(env(safe-area-inset-bottom,0px)+84px)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Toggle({
  on,
  onToggle,
  disabled,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      className="h-11 w-14 rounded-full px-[4px] py-[2px] flex items-center transition-colors shrink-0 touch-manipulation disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none"
      style={{ backgroundColor: on && !disabled ? "#1DB954" : "#333333" }}
    >
      <motion.div
        className="h-[24px] w-[24px] rounded-full"
        style={{ backgroundColor: "white" }}
        animate={{ x: on && !disabled ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

const chevronItems = ["Change password", "Connected accounts", "Privacy", "Help"];

function validateEmailStrict(raw: string): string | null {
  const em = raw.trim().toLowerCase();
  if (!em) return "Enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return "Enter a valid email address.";
  const badGmail = ["gmali.com", "gmali.cum", "gmai.com", "gmail.cum", "gnail.com"];
  const domain = em.split("@")[1] || "";
  if (badGmail.includes(domain) || domain === "gmail.con") {
    return `Did you mean ${em.split("@")[0]}@gmail.com ?`;
  }
  return null;
}

function SettingsScreen() {
  const nav = useNavigate();
  const user = useAuthUser();
  const [s, setS] = useState<VybeSettings>(() => getVybeSettings());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwEmail, setPwEmail] = useState("");
  const [pwSent, setPwSent] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [photoBroken, setPhotoBroken] = useState(false);

  useEffect(() => {
    setS(getVybeSettings());
    return subscribeVybeSettings(() => setS(getVybeSettings()));
  }, []);

  const displayName = user?.displayName || getVybeDisplayName() || "Guest";
  const email = user?.email || getVybeEmail();
  const initials =
    displayName === "Guest"
      ? "G"
      : displayName
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

  const patch = (p: Partial<VybeSettings>) => {
    setVybeSettings(p);
    setS(getVybeSettings());
  };

  const shareDisabled = !s.notifications;

  useEffect(() => {
    setPwEmail(user?.email || email || "");
  }, [user?.email, email]);

  useEffect(() => {
    setPhotoBroken(false);
  }, [user?.photoURL]);

  return (
    <PageWrapper className="max-h-[calc(100dvh-9.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] overflow-y-auto overscroll-contain hide-scrollbar [-webkit-overflow-scrolling:touch]">
      <div className="vybe-readable-column pb-3">
        <h1 className="vybe-page-title">Settings</h1>

        <div className="flex items-center gap-3 mb-6">
          {user?.photoURL && !photoBroken ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover shrink-0 ring-1 ring-white/10"
              onError={() => setPhotoBroken(true)}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-dm-sans font-medium text-[16px] shrink-0"
              style={{ background: "linear-gradient(135deg, #1DB954, #0a7a35)", color: "white" }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-dm-sans truncate" style={{ color: "white" }}>
              {displayName}
            </p>
            <p className="text-[13px] truncate" style={{ color: "#A0A0A0" }}>
              {email ?? "Not signed in"}
            </p>
          </div>
          <Link to="/profile" className="text-[13px] shrink-0" style={{ color: "#1DB954" }}>
            Profile →
          </Link>
        </div>

        <div className="flex items-center justify-between min-h-[52px] gap-3">
          <div>
            <span className="text-[14px] font-dm-sans block" style={{ color: "white" }}>
              Notifications
            </span>
            <span className="text-[11px] font-dm-sans" style={{ color: "#666" }}>
              Tips and alerts in the bell tab
            </span>
          </div>
          <Toggle on={s.notifications} onToggle={() => patch({ notifications: !s.notifications })} />
        </div>

        <div className="flex items-center justify-between min-h-[52px] gap-3 border-t border-white/5 pt-3 mt-1">
          <div className={shareDisabled ? "opacity-50" : ""}>
            <span className="text-[14px] font-dm-sans block" style={{ color: "white" }}>
              Share stats
            </span>
            <span className="text-[11px] font-dm-sans" style={{ color: "#666" }}>
              Allow sharing listening insights (needs notifications)
            </span>
          </div>
          <Toggle
            on={s.shareStats && !shareDisabled}
            disabled={shareDisabled}
            onToggle={() => {
              if (shareDisabled) return;
              patch({ shareStats: !s.shareStats });
            }}
          />
        </div>

        <div className="flex items-center justify-between min-h-[52px] gap-3 border-t border-white/5 pt-3 mt-1">
          <div>
            <span className="text-[14px] font-dm-sans block" style={{ color: "white" }}>
              Background effects
            </span>
            <span className="text-[11px] font-dm-sans" style={{ color: "#666" }}>
              Animated particles behind the app
            </span>
          </div>
          <Toggle on={s.backgroundEffects} onToggle={() => patch({ backgroundEffects: !s.backgroundEffects })} />
        </div>

        <div className="h-px my-4" style={{ backgroundColor: "#1C1C1C" }} />

        <p className="text-[11px] font-dm-sans mb-2" style={{ color: "#555" }}>
          Account &amp; security
        </p>
        {chevronItems.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setErr(null);
              if (item === "Change password") setPwOpen(true);
              else if (item === "Connected accounts") setAccountsOpen(true);
              else if (item === "Privacy") setPrivacyOpen(true);
              else if (item === "Help") setHelpOpen(true);
            }}
            className="flex items-center justify-between w-full min-h-[48px]"
          >
            <span className="text-[14px] font-dm-sans text-left" style={{ color: "white" }}>
              {item}
            </span>
            <ChevronRight size={18} color="#444444" />
          </button>
        ))}

        <div className="h-px my-4" style={{ backgroundColor: "#1C1C1C" }} />

        {err && (
          <div className="vybe-card mt-4" style={{ border: "1px solid rgba(255,107,107,0.35)" }}>
            <p className="text-[13px]" style={{ color: "#FF6B6B" }}>{err}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] mt-2">
          {user ? (
            <button
              type="button"
              onClick={async () => {
                setErr(null);
                try {
                  await logoutFirebase();
                  nav({ to: "/login" });
                } catch (e: any) {
                  setErr(String(e?.message || e));
                }
              }}
              className="inline-flex items-center gap-2"
              style={{ color: "#1DB954" }}
            >
              <LogOut size={14} />
              Log out
            </button>
          ) : (
            <>
              <Link to="/login" style={{ color: "#1DB954" }}>
                Log in
              </Link>
              <Link to="/signup" style={{ color: "#1DB954" }}>
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={`flex items-center gap-2 mt-6 ${user ? "" : "opacity-50 cursor-not-allowed"}`}
          disabled={!user}
          onClick={() => {
            setErr(null);
            setDeleteConfirm("");
            setDeleteOpen(true);
          }}
        >
          <Trash2 size={16} color="#FF6B6B" />
          <span className="text-[14px]" style={{ color: "#FF6B6B" }}>
            Delete account
          </span>
        </button>

        <AnimatePresence>
        {deleteOpen && (
          <div className="fixed inset-0 z-[220]">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/70"
              onClick={() => (!busy ? setDeleteOpen(false) : undefined)}
              aria-label="Close delete confirmation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] vybe-card"
              style={{ backgroundColor: "#111111" }}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <h3 className="font-clash text-[20px] mb-1" style={{ color: "white" }}>Delete account</h3>
              <p className="text-[12px] mb-3" style={{ color: "#A0A0A0" }}>
                Type <span className="font-dm-mono" style={{ color: "#FF6B6B" }}>DELETE</span> to confirm. This can’t be undone.
              </p>
              <div className="relative">
                <input
                  className="vybe-input"
                  placeholder="Type DELETE"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" className="vybe-btn-ghost flex-1" onClick={() => setDeleteOpen(false)} disabled={busy}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="vybe-btn-primary flex-1"
                  style={{ backgroundColor: "#FF6B6B", color: "#111111" }}
                  disabled={busy || deleteConfirm.trim().toUpperCase() !== "DELETE"}
                  onClick={async () => {
                    setErr(null);
                    try {
                      setBusy(true);
                      await deleteFirebaseAccount();
                      await logoutFirebase();
                      nav({ to: "/signup" });
                    } catch (e: any) {
                      const msg = String(e?.code || e?.message || e);
                      setErr(msg.includes("requires-recent-login") ? "Please log in again, then try deleting your account." : msg);
                    } finally {
                      setBusy(false);
                      setDeleteOpen(false);
                    }
                  }}
                >
                  {busy ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        <AnimatePresence>
          {pwOpen && (
            <div className="fixed inset-0 z-[220]">
              <motion.button
                type="button"
                className="absolute inset-0 bg-black/70"
                onClick={() => setPwOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] vybe-card"
                style={{ backgroundColor: "#111111" }}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              >
                <h3 className="font-clash text-[20px] mb-1" style={{ color: "white" }}>Change password</h3>
                <p className="text-[12px] mb-3" style={{ color: "#A0A0A0" }}>
                  We’ll send you a password reset link.
                </p>
                <input className="vybe-input mb-3" placeholder="Email" value={pwEmail} onChange={(e) => setPwEmail(e.target.value)} />
                {pwSent && (
                  <div className="vybe-card mb-3" style={{ backgroundColor: "rgba(29,185,84,0.10)", border: "1px solid rgba(29,185,84,0.25)" }}>
                    <p className="text-[13px]" style={{ color: "#1DB954" }}>{pwSent}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="button" className="vybe-btn-ghost flex-1" onClick={() => setPwOpen(false)} disabled={busy}>
                    Close
                  </button>
                  <button
                    type="button"
                    className="vybe-btn-primary flex-1"
                    disabled={busy || !pwEmail.trim()}
                    onClick={async () => {
                      setErr(null);
                      setPwSent(null);
                      const emailErr = validateEmailStrict(pwEmail);
                      if (emailErr) {
                        setErr(emailErr);
                        return;
                      }
                      try {
                        setBusy(true);
                        await sendPasswordReset(pwEmail);
                        setPwSent("Reset link sent. Check your inbox (and spam).");
                      } catch (e: any) {
                        const code = String(e?.code || "");
                        if (code.includes("auth/invalid-email")) setErr("That email looks invalid.");
                        else if (code.includes("auth/user-not-found")) setErr("No account found with this email.");
                        else setErr(String(e?.message || e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {busy ? "Sending..." : "Send reset link"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Sheet open={accountsOpen} onClose={() => setAccountsOpen(false)} title="Connected accounts">
            <p className="text-[12px] mb-3" style={{ color: "#A0A0A0" }}>
              Your sign-in providers for this account.
            </p>
              <div className="vybe-card" style={{ backgroundColor: "#0f0f0f" }}>
                <p className="text-[13px]" style={{ color: "white" }}>
                  {user ? "Signed in" : "Not signed in"}
                </p>
                <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
                  {user?.email ?? "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(user?.providerData ?? []).length ? (
                    user!.providerData.map((p, idx) => (
                      <span key={`${p.providerId}-${idx}`} className="px-3 py-1.5 rounded-full text-[12px] font-dm-mono" style={{ backgroundColor: "#1C1C1C", color: "#1DB954" }}>
                        {p.providerId.replace(".com", "")}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px]" style={{ color: "#A0A0A0" }}>No providers</span>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <button type="button" className="vybe-btn-primary w-full" onClick={() => setAccountsOpen(false)}>
                  Done
                </button>
              </div>
        </Sheet>

        <Sheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Privacy">
            <p className="text-[12px] mb-3" style={{ color: "#A0A0A0" }}>
              Control what’s stored on-device and what can be shared.
            </p>
              <div className="space-y-2">
                <div className="vybe-card" style={{ backgroundColor: "#0f0f0f" }}>
                  <p className="text-[13px]" style={{ color: "white" }}>Local storage</p>
                  <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
                    Vybe stores your playlist, settings, and page state on this device for a smoother experience.
                  </p>
                </div>
                <div className="vybe-card" style={{ backgroundColor: "#0f0f0f" }}>
                  <p className="text-[13px]" style={{ color: "white" }}>Sharing</p>
                  <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
                    Sharing buttons are enabled only when Notifications + Share stats are on.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button type="button" className="vybe-btn-primary w-full" onClick={() => setPrivacyOpen(false)}>
                  Done
                </button>
              </div>
        </Sheet>

        <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Help">
            <p className="text-[12px] mb-3" style={{ color: "#A0A0A0" }}>
              Quick answers and troubleshooting.
            </p>
              <div className="space-y-2">
                <div className="vybe-card" style={{ backgroundColor: "#0f0f0f" }}>
                  <p className="text-[13px]" style={{ color: "white" }}>Login issues</p>
                  <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
                    Use “Change password” to email yourself a reset link. If Delete Account says “log in again”, log out and sign back in.
                  </p>
                </div>
                <div className="vybe-card" style={{ backgroundColor: "#0f0f0f" }}>
                  <p className="text-[13px]" style={{ color: "white" }}>App data</p>
                  <p className="text-[12px] mt-1" style={{ color: "#A0A0A0" }}>
                    If something looks stuck, refresh once. Your interactive pages should restore automatically.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button type="button" className="vybe-btn-primary w-full" onClick={() => setHelpOpen(false)}>
                  Done
                </button>
              </div>
        </Sheet>

        <p className="text-center font-dm-mono text-[12px] mt-8" style={{ color: "#333333" }}>
          vybe v1.0.0
        </p>
      </div>
    </PageWrapper>
  );
}
