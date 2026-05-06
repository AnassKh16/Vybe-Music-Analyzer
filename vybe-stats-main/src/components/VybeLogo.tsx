import { motion } from "framer-motion";

interface VybeLogoProps {
  size?: "sm" | "lg";
}

export function VybeLogo({ size = "sm" }: VybeLogoProps) {
  const iconSize = size === "lg" ? 64 : 32;
  const textSize = size === "lg" ? "text-[48px]" : "text-[22px]";

  return (
    <div className="flex items-center gap-1">
      <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1DB954" />
            <stop offset="100%" stopColor="#F5A623" />
          </linearGradient>
        </defs>
        <text
          x="8"
          y="50"
          fontFamily="'Clash Display', sans-serif"
          fontWeight="800"
          fontSize="52"
          fill="white"
        >
          V
        </text>
        <path
          d="M8 36 Q20 18 32 34 Q44 50 56 30"
          stroke="url(#waveGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className={`font-clash font-medium ${textSize}`} style={{ color: "white" }}>
        ybe
      </span>
    </div>
  );
}