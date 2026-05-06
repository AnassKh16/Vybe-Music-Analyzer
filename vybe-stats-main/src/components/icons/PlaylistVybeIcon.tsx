/** Playlist Generator — hollow stacked lines + note glyph. */
export function PlaylistVybeIcon({
  size = 20,
  className = "",
  color = "#1DB954",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="2.4" y="4.3" width="12.2" height="2.7" rx="1.2" stroke={color} strokeWidth="1.5" />
      <rect x="2.4" y="8.8" width="9.2" height="2.7" rx="1.2" stroke={color} strokeWidth="1.5" opacity="0.92" />
      <rect x="2.4" y="13.3" width="13.5" height="2.8" rx="1.2" stroke={color} strokeWidth="1.5" opacity="0.86" />
      <rect x="2.4" y="17.8" width="10.4" height="2.8" rx="1.2" stroke={color} strokeWidth="1.5" />
      <path d="M17.1 4.2v10.8" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <ellipse cx="14.6" cy="17.4" rx="2.55" ry="2.05" transform="rotate(-18 14.6 17.4)" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
