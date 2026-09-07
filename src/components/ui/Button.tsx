import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-55";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand/90 focus-visible:outline-brand shadow-soft hover:shadow-lift",
  secondary:
    "border border-line bg-panel text-ink hover:border-brand hover:text-brand focus-visible:outline-brand",
  ghost: "text-ink hover:bg-panel-2 focus-visible:outline-brand",
  gold: "bg-gold text-ink hover:bg-gold/90 focus-visible:outline-gold shadow-soft",
  danger: "bg-danger text-white hover:bg-danger/90 focus-visible:outline-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-[3.25rem] px-8 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...rest}
    />
  );
});

export type ButtonLinkProps = CommonProps & Omit<LinkProps, "className"> & { className?: string };

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...rest}
    />
  );
}
