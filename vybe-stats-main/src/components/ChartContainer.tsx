import { ResponsiveContainer } from "recharts";
import { ClientOnly } from "./ClientOnly";
import { cloneElement, type ReactElement } from "react";

interface ChartContainerProps {
  children: ReactElement;
  /** Wrapper height; default scales up on md/lg desktops */
  className?: string;
}

export function ChartContainer({
  children,
  className = "h-[210px] min-[390px]:h-[228px] md:h-[268px] lg:h-[296px]",
}: ChartContainerProps) {
  const chartChild = cloneElement(children, {
    accessibilityLayer: false,
  });

  return (
    <div className={`min-h-0 w-full min-w-0 ${className}`}>
      <ClientOnly>
        <ResponsiveContainer width="100%" height="100%" debounce={120}>
          {chartChild}
        </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}
