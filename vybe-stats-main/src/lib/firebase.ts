import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  type Auth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function persistProfile(user: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem("vybe_firebase_profile_v1");
    return;
  }
  window.localStorage.setItem(
    "vybe_firebase_profile_v1",
    JSON.stringify({
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
    })
  );
}

function getFirebaseConfig() {
  const env = (import.meta as any).env ?? {};
  const fromEnv = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  // Non-secret fallback (helps when .env isn't picked up yet).
  const fallback = {
    apiKey: "AIzaSyB0gIdXFVchrmW9yMxsXm_PfyMZUsmDoFM",
    authDomain: "vybe-e17e6.firebaseapp.com",
    projectId: "vybe-e17e6",
    storageBucket: "vybe-e17e6.firebasestorage.app",
    messagingSenderId: "244593210532",
    appId: "1:244593210532:web:381773f3c5850a3b7be231",
    measurementId: "G-KMBJ1M5F3Z",
  };

  return {
    apiKey: fromEnv.apiKey || fallback.apiKey,
    authDomain: fromEnv.authDomain || fallback.authDomain,
    projectId: fromEnv.projectId || fallback.projectId,
    storageBucket: fromEnv.storageBucket || fallback.storageBucket,
    messagingSenderId: fromEnv.messagingSenderId || fallback.messagingSenderId,
    appId: fromEnv.appId || fallback.appId,
    measurementId: fromEnv.measurementId || fallback.measurementId,
  };
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const cfg = getFirebaseConfig();
  const missing = ["apiKey", "authDomain", "projectId", "appId"].filter((k) => !(cfg as any)[k]);
  if (missing.length) {
    throw new Error(`Firebase config is missing: ${missing.join(", ")}.`);
  }
  app = initializeApp(cfg);
  // Analytics is optional and only works in browser contexts.
  try {
    if (typeof window !== "undefined" && cfg.measurementId) {
      getAnalytics(app);
    }
  } catch {
    // ignore analytics failures (adblock, unsupported env)
  }
  auth = getAuth(app);
  return auth;
}

export async function signUpEmailPassword(opts: { email: string; password: string; displayName?: string }) {
  const a = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(a, opts.email, opts.password);
  if (opts.displayName?.trim()) {
    await updateProfile(cred.user, { displayName: opts.displayName.trim() });
  }
  persistProfile(cred.user);
  return cred.user;
}

export async function loginEmailPassword(opts: { email: string; password: string }) {
  const a = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(a, opts.email, opts.password);
  persistProfile(cred.user);
  return cred.user;
}

export async function loginWithGoogle() {
  const a = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(a, provider);
  persistProfile(cred.user);
  return cred.user;
}

export async function logoutFirebase() {
  const a = getFirebaseAuth();
  await signOut(a);
  persistProfile(null);
}

export async function deleteFirebaseAccount() {
  const a = getFirebaseAuth();
  if (!a.currentUser) throw new Error("Not signed in.");
  await deleteUser(a.currentUser);
  persistProfile(null);
}

export async function sendPasswordReset(email: string) {
  const a = getFirebaseAuth();
  await sendPasswordResetEmail(a, email.trim());
}

