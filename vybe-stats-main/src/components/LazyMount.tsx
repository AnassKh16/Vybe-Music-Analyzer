import { type ReactNode, useEffect, useRef, useState } from "react";

type LazyMountProps = {
  children: ReactNode;
  placeholder: ReactNode;
  rootMargin?: string;
};

export function LazyMount({ children, placeholder, rootMargin = "220px" }: LazyMountProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = wrapRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { root: null, rootMargin, threshold: 0.01 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, visible]);

  return <div ref={wrapRef}>{visible ? children : placeholder}</div>;
}
