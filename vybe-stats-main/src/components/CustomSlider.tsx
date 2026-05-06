import { useState, useRef, useCallback } from "react";

interface CustomSliderProps {
  label?: string;
  min?: number;
  max?: number;
  value: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}

export function CustomSlider({
  label,
  min = 0,
  max = 100,
  value,
  onChange,
  formatValue,
}: CustomSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const pct = ((value - min) / (max - min)) * 100;

  const updateFromEvent = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const newVal = Math.round(min + (x / rect.width) * (max - min));
      onChange(newVal);
    },
    [min, max, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromEvent(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    updateFromEvent(e.clientX);
  };

  const handlePointerUp = () => setDragging(false);

  return (
    <div className="w-full">
      {(label || formatValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-[13px] font-dm-sans" style={{ color: "#A0A0A0" }}>{label}</span>}
          <span className="text-[13px] font-dm-mono" style={{ color: "#1DB954" }}>
            {formatValue ? formatValue(value) : value}
          </span>
        </div>
      )}
      <div
        ref={trackRef}
        className="relative h-[6px] rounded-full cursor-pointer"
        style={{ backgroundColor: "#2A2A2A" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #F5A623, #1DB954)",
          }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center slider-thumb-glow ${dragging ? "scale-110" : ""}`}
          style={{
            left: `${pct}%`,
            backgroundColor: "#111111",
            border: "2px solid #1DB954",
            transition: dragging ? "none" : "left 0.1s",
          }}
        >
          <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: "white" }} />
        </div>
      </div>
    </div>
  );
}