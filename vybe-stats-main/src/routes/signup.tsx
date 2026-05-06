import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { PageWrapper } from "../components/PageWrapper";
import { GoogleLogo } from "../components/icons/GoogleLogo";
import { loginWithGoogle, signUpEmailPassword } from "../lib/firebase";
import { useState } from "react";

function validateEmailStrict(raw: string): string | null {
  const em = raw.trim().toLowerCase();
  if (!em) return "Enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return "Enter a valid email address.";
  // Block common Gmail typos (users almost always mean gmail.com)
  const badGmail = ["gmali.com", "gmali.cum", "gmai.com", "gmail.cum", "gnail.com"];
  const domain = em.split("@")[1] || "";
  if (badGmail.includes(domain)) return `Did you mean ${em.split("@")[0]}@gmail.com ?`;
  if (domain === "gmail.con") return `Did you mean ${em.split("@")[0]}@gmail.com ?`;
  return null;
}

function friendlyAuthError(e: any): string {
  const code = String(e?.code || "");
  if (code.includes("auth/invalid-email")) return "That email looks invalid.";
  if (code.includes("auth/email-already-in-use")) return "An account already exists with this email.";
  if (code.includes("auth/weak-password")) return "Password is too weak. Use at least 6 characters.";
  if (code.includes("auth/too-many-requests")) return "Too many attempts. Try again in a minute.";
  if (code.includes("Firebase env vars are missing")) return "Firebase is not configured yet. Add your VITE_FIREBASE_* keys.";
  return String(e?.message || e);
}

export const Route = createFileRoute("/signup")({
  component: SignUpScreen,
});

const fields = [
  { icon: User, placeholder: "Full Name", type: "text" },
  { icon: Mail, placeholder: "Email", type: "email" },
  { icon: Lock, placeholder: "Password", type: "password" },
  { icon: Lock, placeholder: "Confirm Password", type: "password" },
];

function SignUpScreen() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doSignup = async () => {
    setErr(null);
    const em = email.trim();
    const emailErr = validateEmailStrict(em);
    if (emailErr) {
      setErr(emailErr);
      return;
    }
    if (!em || !password) {
      setErr("Enter email and password.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      await signUpEmailPassword({ email: em, password, displayName: fullName.trim() || undefined });
      nav({ to: "/home" });
    } catch (e: any) {
      setErr(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  const doGoogle = async () => {
    setErr(null);
    try {
      setLoading(true);
      await loginWithGoogle();
      nav({ to: "/home" });
    } catch (e: any) {
      setErr(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="pt-4">
      <div className="vybe-readable-column">
      <Link
        to="/"
        className="inline-flex mb-6 min-h-11 min-w-11 items-center justify-start rounded-full p-2 -ml-2 touch-manipulation transition-opacity active:opacity-70"
      >
        <ChevronLeft size={24} color="white" />
      </Link>

      <h1 className="vybe-page-title !mb-3">Create your account</h1>
      <p className="text-[14px] mt-1 mb-8" style={{ color: "#A0A0A0" }}>
        Let's find your Vybe
      </p>

      <div className="flex flex-col gap-4">
        {fields.map((f, i) => (
          <motion.div
            key={f.placeholder}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="relative"
          >
            <f.icon size={18} color="#1DB954" className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
            <input
              type={
                f.placeholder === "Password"
                  ? (showPw ? "text" : "password")
                  : f.placeholder === "Confirm Password"
                    ? (showConfirm ? "text" : "password")
                    : f.type
              }
              placeholder={f.placeholder}
              className="vybe-input"
              value={
                f.placeholder === "Full Name"
                  ? fullName
                  : f.placeholder === "Email"
                    ? email
                    : f.placeholder === "Password"
                      ? password
                      : confirm
              }
              onChange={(e) => {
                const v = e.target.value;
                if (f.placeholder === "Full Name") setFullName(v);
                else if (f.placeholder === "Email") setEmail(v);
                else if (f.placeholder === "Password") setPassword(v);
                else setConfirm(v);
              }}
            />
            {(f.placeholder === "Password" || f.placeholder === "Confirm Password") && (
              <button
                type="button"
                onClick={() => (f.placeholder === "Password" ? setShowPw((v) => !v) : setShowConfirm((v) => !v))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-80 hover:opacity-100"
                aria-label={
                  f.placeholder === "Password"
                    ? (showPw ? "Hide password" : "Show password")
                    : (showConfirm ? "Hide password" : "Show password")
                }
              >
                {(f.placeholder === "Password" ? showPw : showConfirm) ? (
                  <EyeOff size={18} color="#A0A0A0" />
                ) : (
                  <Eye size={18} color="#A0A0A0" />
                )}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {err && (
        <div className="vybe-card mt-5" style={{ border: "1px solid rgba(255,107,107,0.35)" }}>
          <p className="text-[13px]" style={{ color: "#FF6B6B" }}>{err}</p>
        </div>
      )}

      <button className="vybe-btn-primary mt-6" onClick={doSignup} disabled={loading}>
        {loading ? "Creating..." : "Create Account"}
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ backgroundColor: "#333333" }} />
        <span className="text-[13px]" style={{ color: "#A0A0A0" }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "#333333" }} />
      </div>

      <button
        type="button"
        className="vybe-btn-oauth w-full h-[52px] rounded-[50px] flex items-center justify-center gap-3 text-[15px] font-dm-sans font-medium"
        style={{ backgroundColor: "#1C1C1C", color: "white" }}
        onClick={doGoogle}
        disabled={loading}
      >
        <GoogleLogo size={20} />
        Continue with Google
      </button>

      <p className="text-center text-[14px] mt-6" style={{ color: "#A0A0A0" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#1DB954" }}>Log in</Link>
      </p>
      </div>
    </PageWrapper>
  );
}