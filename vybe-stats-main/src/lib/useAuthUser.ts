import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { getVybeUser, startAuthListener, subscribeVybeAuth } from "./authStore";

export function useAuthUser(): User | null {
  const [u, setU] = useState<User | null>(() => getVybeUser());

  useEffect(() => {
    startAuthListener();
    const sync = () => setU(getVybeUser());
    sync();
    return subscribeVybeAuth(sync);
  }, []);

  return u;
}

