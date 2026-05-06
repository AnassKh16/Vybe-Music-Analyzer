import { ReactNode } from "react";

export function PageWrapper({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`min-w-0 w-full px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-5 md:px-6 md:pb-[calc(7rem+env(safe-area-inset-bottom,0px))] ${className}`}
    >
      {children}
    </div>
  );
}