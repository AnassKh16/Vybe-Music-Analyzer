type MoodIconProps = {
  size?: number;
  active?: boolean;
  className?: string;
};

function Svg({ size = 20, className = "", children }: { size?: number; className?: string; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

const STROKE = "#1DB954";
const STROKE_ACTIVE = "#3CFF9A";
const GLOW = "drop-shadow(0 0 10px rgba(29,185,84,0.55)) drop-shadow(0 0 18px rgba(29,185,84,0.28))";

export function StudyIcon({ size = 20, active = false, className = "" }: MoodIconProps) {
  const stroke = active ? STROKE_ACTIVE : STROKE;
  return (
    <Svg size={size} className={className}>
      <path
        d="M4.6 7.4c2.4-1.9 5.2-2.6 7.4-1.9 2.2-.7 5 .1 7.4 1.9v11.1c-2.5-1.7-5.3-2.3-7.4-1.6-2.1-.7-4.9-.1-7.4 1.6V7.4Z"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.92}
        style={{ filter: active ? GLOW : undefined }}
      />
      <path d="M12 5.5v12.4" stroke={stroke} strokeWidth="1.6" opacity={active ? 0.95 : 0.8} />
      {active && <path d="M6.6 10.2h3.9M6.6 13h3.1" stroke={stroke} strokeWidth="1.4" opacity={0.9} />}
    </Svg>
  );
}

export function GymIcon({ size = 20, active = false, className = "" }: MoodIconProps) {
  const stroke = active ? STROKE_ACTIVE : STROKE;
  return (
    <Svg size={size} className={className}>
      <path
        d="M6.2 10.2v3.6M17.8 10.2v3.6"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity={active ? 1 : 0.9}
        style={{ filter: active ? GLOW : undefined }}
      />
      <path
        d="M8 9.2v5.6M16 9.2v5.6"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={active ? 1 : 0.92}
      />
      <path d="M9.6 12h4.8" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 11.3h1.2M17.8 11.3H19" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity={0.85} />
      {active && (
        <path
          d="M4.2 12c0-4.1 3.4-7.4 7.6-7.4s7.6 3.3 7.6 7.4"
          stroke={stroke}
          strokeWidth="1.2"
          opacity={0.35}
        />
      )}
    </Svg>
  );
}

export function PartyIcon({ size = 20, active = false, className = "" }: MoodIconProps) {
  const stroke = active ? STROKE_ACTIVE : STROKE;
  return (
    <Svg size={size} className={className}>
      <path
        d="M6.4 16.8c3.1-.9 6.4-4.2 7.4-7.3l3.8 3.8c-1.5 2.9-3.9 5.3-6.8 6.8l-4.4-3.3Z"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.92}
        style={{ filter: active ? GLOW : undefined }}
      />
      <path d="M7.1 15.1l3 2.3" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity={0.85} />
      <path d="M15.9 6.6l1.6-1.6M18.5 9.2h2.2M14.6 4.9V2.7" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" opacity={active ? 0.9 : 0.7} />
    </Svg>
  );
}

export function HeartbreakIcon({ size = 20, active = false, className = "" }: MoodIconProps) {
  const stroke = active ? STROKE_ACTIVE : STROKE;
  return (
    <Svg size={size} className={className}>
      <path
        d="M12 20.6c-5.1-3.2-8.2-6.6-8.2-10.3 0-2.7 2-4.8 4.7-4.8 1.6 0 2.9.7 3.5 1.6.6-.9 1.9-1.6 3.5-1.6 2.7 0 4.7 2.1 4.7 4.8 0 3.7-3.1 7.1-8.2 10.3Z"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.92}
        style={{ filter: active ? GLOW : undefined }}
      />
      <path
        d="M12.1 6.8 10 10.1l2.2 1.7-2 2.6 2.7 2"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 0.95 : 0.75}
      />
    </Svg>
  );
}

export function RoadTripIcon({ size = 20, active = false, className = "" }: MoodIconProps) {
  const stroke = active ? STROKE_ACTIVE : STROKE;
  return (
    <Svg size={size} className={className}>
      <path
        d="M6.2 15.4 7.4 8.9c.2-1 1.1-1.8 2.1-1.8h5c1 0 1.9.7 2.1 1.8l1.2 6.5"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.92}
        style={{ filter: active ? GLOW : undefined }}
      />
      <path d="M6 15.4h12.2" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.4 12h2.2M13.4 12h2.2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity={0.85} />
      <path d="M8.2 17.4a1.6 1.6 0 1 0 0 .1M16 17.4a1.6 1.6 0 1 0 0 .1" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" opacity={active ? 1 : 0.9} />
    </Svg>
  );
}

export function LateNightIcon({ size = 20, active = false, className = "" }: MoodIconProps) {
  const stroke = active ? STROKE_ACTIVE : STROKE;
  return (
    <Svg size={size} className={className}>
      <path
        d="M15.7 4.9c-3.1.5-5.6 3.2-5.6 6.5 0 3.7 3 6.7 6.7 6.7 1.2 0 2.4-.3 3.3-.9-1 2.1-3.1 3.6-5.6 3.6-3.4 0-6.2-2.8-6.2-6.2 0-3 2.1-5.4 4.9-5.9 1-.2 1.9-.1 2.5.1Z"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.92}
        style={{ filter: active ? GLOW : undefined }}
      />
      <path d="M5.4 10.6l.7.3.3.7.3-.7.7-.3-.7-.3-.3-.7-.3.7-.7.3Z" fill={stroke} opacity={active ? 0.9 : 0.7} />
      <path d="M18.2 9.4l.8.4.4.8.4-.8.8-.4-.8-.4-.4-.8-.4.8-.8.4Z" fill={stroke} opacity={active ? 0.9 : 0.65} />
    </Svg>
  );
}

