import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import { setActiveAccountIdForVybe } from "./vybeStore";

const CHANGE_EVENT = "vybe:auth-changed";

let currentUser: User | null = null;
let started = false;

function canUseDom() {
  return typeof window !== "undefined";
}

export function getVybeUser(): User | null {
  if (currentUser) return currentUser;
  try {
    return getFirebaseAuth().currentUser;
  } catch {
    return null;
  }
}

export function startAuthListener() {
  if (started) return;
  started = true;
  try {
    const auth = getFirebaseAuth();
    onAuthStateChanged(auth, (u) => {
      currentUser = u;
      // Scope local data by logged-in account.
      setActiveAccountIdForVybe(u?.uid || u?.email || "guest");
      if (canUseDom()) window.dispatchEvent(new Event(CHANGE_EVENT));
    });
  } catch {
    // Firebase not configured; treat as signed out.
    currentUser = null;
  }
}

export function subscribeVybeAuth(cb: () => void) {
  if (!canUseDom()) return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

