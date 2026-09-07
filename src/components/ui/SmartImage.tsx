import { useState, type ImgHTMLAttributes } from "react";
import { responsiveSrcSet } from "@/lib/image";
import { cn } from "@/lib/cn";

interface SmartImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  /** REQUIRED — match the real rendered size or the srcset is defeated. */
  sizes: string;
  eager?: boolean;
}

/**
 * Drop-in <img> replacement: lazy + async by default, blur-up fade-in, and
 * self-healing — on a srcset candidate error it drops the srcset once and
 * re-renders against the original src (always a valid object URL). Browsers do
 * NOT fall back to src on a 404'd srcset candidate on their own. Skill 9.5.
 */
export function SmartImage({
  src,
  sizes,
  eager,
  className,
  alt = "",
  onLoad,
  onError,
  ...rest
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [useSrcSet, setUseSrcSet] = useState(true);
  const srcSet = useSrcSet ? responsiveSrcSet(src) : undefined;

  return (
    <img
      {...rest}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      className={cn(
        "transition-opacity duration-500",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        if (useSrcSet && responsiveSrcSet(src)) {
          setUseSrcSet(false);
          return;
        }
        setLoaded(true);
        onError?.(e);
      }}
    />
  );
}
