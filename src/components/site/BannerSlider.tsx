"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type BannerSliderProps = {
  desktopImages: string[];
  mobileImages: string[];
  intervalMs?: number;
  className?: string;
  fit?: "cover" | "contain";
  kenBurns?: boolean;
  mode?: "background" | "inline";
};

function toCssUrl(src: string) {
  return encodeURI(src);
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setIsDesktop(mq.matches);
    update();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }

    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  return isDesktop;
}

export function BannerSlider({
  desktopImages,
  mobileImages,
  intervalMs = 4000,
  className,
  fit = "cover",
  kenBurns = false,
  mode = "background",
}: BannerSliderProps) {
  const isDesktop = useIsDesktop();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on client side before rendering to prevent SSR mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const images = useMemo(() => {
    if (!isClient) return []; // Don't render images until client-side
    const list = isDesktop ? desktopImages : mobileImages;
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }, [desktopImages, isDesktop, mobileImages, isClient]);

  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  useEffect(() => {
    if (!isClient) return;
    setIndex(0);
    setPrevIndex(null);
    setTransitioning(false);
  }, [images.length, isClient]);

  useEffect(() => {
    if (images.length <= 1) return;

    const id = window.setInterval(() => {
      setIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % images.length;
        setPrevIndex(currentIndex);
        setTransitioning(false);

        const raf = window.requestAnimationFrame(() => setTransitioning(true));
        window.setTimeout(() => {
          setPrevIndex(null);
          setTransitioning(false);
          window.cancelAnimationFrame(raf);
        }, 800);

        return nextIndex;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [images.length, intervalMs]);

  if (images.length === 0 || !isClient) return null;

  const current = images[index] ?? images[0];
  const previous = prevIndex !== null ? images[prevIndex] : null;
  const objectFitClass = fit === "contain" ? "object-contain" : "object-cover";
  const activeAnim = kenBurns ? "banner-kenburns" : "";
  const isInline = mode === "inline";

  const containerClassName = isInline
    ? "relative w-full overflow-hidden " + (className ?? "")
    : "pointer-events-none absolute inset-0 overflow-hidden " + (className ?? "");

  return (
    <div className={containerClassName} style={isInline ? ({ aspectRatio } as CSSProperties) : undefined}>
      {previous ? (
        <div
          className={
            "absolute inset-0 transition-opacity duration-700 ease-out " +
            (transitioning ? "opacity-0" : "opacity-100")
          }
        >
          <img
            className={"h-full w-full " + objectFitClass}
            src={toCssUrl(previous)}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        </div>
      ) : null}

      <div
        key={index}
        className={
          "absolute inset-0 transition-all duration-700 ease-out " +
          (previous && transitioning ? "opacity-100 translate-x-0" : previous ? "opacity-0 translate-x-2" : "opacity-100")
        }
      >
        <img
          className={"h-full w-full will-change-transform " + objectFitClass + (activeAnim ? " " + activeAnim : "")}
          src={toCssUrl(current)}
          onLoad={(event) => {
            if (!isInline) return;
            const img = event.currentTarget;
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            if (w > 0 && h > 0) setAspectRatio(w / h);
          }}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </div>

      <style jsx>{`
        .banner-kenburns {
          transform-origin: center;
          animation: bannerKenBurns 10s ease-in-out infinite alternate;
        }
        @keyframes bannerKenBurns {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.06);
          }
        }
      `}</style>
    </div>
  );
}
