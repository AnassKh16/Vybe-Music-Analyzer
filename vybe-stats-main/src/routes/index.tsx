import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { VybeLogo } from "../components/VybeLogo";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  component: SplashScreen,
});

function FloatingDot({ i }: { i: number }) {
  const style = useMemo(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
  }), []);

  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full"
      style={{ ...style, backgroundColor: "#0A2010" }}
      animate={{
        x: [0, Math.random() * 40 - 20, 0],
        y: [0, Math.random() * 40 - 20, 0],
      }}
      transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function SplashScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[100dvh] relative overflow-hidden px-6 md:px-10 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
      style={{ backgroundColor: "transparent" }}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <FloatingDot key={i} i={i} />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <VybeLogo size="lg" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-[16px] font-dm-sans mt-4 relative z-10"
        style={{ color: "#A0A0A0" }}
      >
        Feel the data. Hear the stats.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full vybe-readable-column mt-10 relative z-10 flex flex-col items-center gap-4"
      >
        <Link to="/signup" className="vybe-btn-primary">
          Get Started
        </Link>
        <Link to="/login" className="text-[14px] font-dm-sans" style={{ color: "#A0A0A0" }}>
          I already have an account
        </Link>
      </motion.div>
    </div>
  );
}
