import { cn } from "@/lib/utils";

export const Star = ({ filled, className }: { filled: boolean; className?: string }) => (
  <span
    className={cn(
      "inline-block text-3xl transition-all",
      filled ? "text-warning drop-shadow-[0_2px_4px_hsl(var(--warning)/0.6)] animate-star-burst" : "text-muted",
      className
    )}
  >
    ★
  </span>
);
