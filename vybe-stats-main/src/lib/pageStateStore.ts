import { getActiveAccountId } from "./vybeStore";

const PREFIX = "vybe_page_state_v1:";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function keyFor(id: string) {
  return `${PREFIX}${getActiveAccountId()}:${id}`;
}

export function loadPageState<T>(id: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(id));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function savePageState<T>(id: string, state: T) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(keyFor(id), JSON.stringify(state));
  } catch {
    // ignore quota/serialization issues
  }
}

export function clearPageState(id: string) {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(keyFor(id));
}

