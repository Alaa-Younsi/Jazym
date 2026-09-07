import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({
  children,
  className,
  id,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "div" | "section" | "main" | "header" | "footer";
}) {
  return (
    <Tag id={id} className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </Tag>
  );
}

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = "center",
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className,
      )}
    >
      {kicker && (
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          <span className="h-px w-6 bg-brand/50" />
          {kicker}
        </span>
      )}
      <h2 className="fx-display text-3xl text-ink sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>
      )}
    </div>
  );
}
