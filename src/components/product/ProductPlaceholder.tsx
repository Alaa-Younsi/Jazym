import { FlowerMark } from "@/components/ui/FlowerMark";
import { cn } from "@/lib/cn";

/** On-brand placeholder shown when a product/category has no photo yet.
    The client replaces these by uploading real images in the admin. */
export function ProductPlaceholder({
  name,
  className,
  compact,
}: {
  name: string;
  className?: string;
  compact?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-panel-2",
        className,
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 100% at 12% 0%, rgb(var(--c-brand-soft)) 0%, transparent 58%), radial-gradient(90% 80% at 100% 100%, rgb(var(--c-gold) / 0.18) 0%, transparent 62%)",
        }}
      />
      <FlowerMark
        className={cn(
          "absolute text-brand/[0.14]",
          compact ? "-right-4 -top-4 h-20 w-20" : "-right-8 -bottom-8 h-40 w-40",
        )}
      />
      <span
        className={cn(
          "fx-display relative z-10 select-none text-ink/25",
          compact ? "text-2xl" : "text-4xl",
        )}
      >
        {initials || "JZ"}
      </span>
    </div>
  );
}
