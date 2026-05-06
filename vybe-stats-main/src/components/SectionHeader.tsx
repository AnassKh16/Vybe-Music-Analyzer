interface SectionHeaderProps {
  title: string;
  /** Use `false` or `""` to hide. When omitted, defaults to `"See all"`. */
  action?: string | false;
  onAction?: () => void;
}

function resolveActionLabel(action: string | false | undefined): string | null {
  if (action === false || action === "") return null;
  if (action === undefined) return "See all";
  return action;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  const label = resolveActionLabel(action);
  return (
    <div className="flex flex-wrap items-center gap-2 justify-between mb-3 md:mb-4">
      <h3 className="font-clash text-[18px] md:text-xl font-bold" style={{ color: "white" }}>
        {title}
      </h3>
      {label && (
        <button
          type="button"
          className="inline-flex min-h-11 items-center px-2 touch-manipulation text-[13px] font-dm-sans transition-opacity hover:opacity-90 active:opacity-70"
          style={{ color: "#1DB954" }}
          onClick={onAction}
        >
          {label}
        </button>
      )}
    </div>
  );
}