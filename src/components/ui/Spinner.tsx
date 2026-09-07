import { cn } from "@/lib/cn";
import { FlowerMark } from "./FlowerMark";

export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex text-brand", className)} role="status" aria-label="loading">
      <FlowerMark className="h-6 w-6 animate-spin [animation-duration:1.4s]" />
    </span>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="scale-150" />
    </div>
  );
}
