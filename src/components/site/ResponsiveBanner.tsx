"use client";

import { useState, useEffect } from "react";

type ResponsiveBannerProps = {
  desktopSrc: string;
  mobileSrc: string;
  alt?: string;
  className?: string;
};

function toCssUrl(src: string) {
  return encodeURI(src);
}

export function ResponsiveBanner({ desktopSrc, mobileSrc, alt, className }: ResponsiveBannerProps) {
  const [isClient, setIsClient] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 640);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  if (!isClient) {
    // Return placeholder on server to prevent hydration mismatch
    return (
      <div className={className ?? ""} aria-label={alt ?? ""}>
        <div className="w-full h-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  const title = alt ?? "";
  const currentSrc = isDesktop ? desktopSrc : mobileSrc;

  return (
    <div className={className ?? ""} aria-label={title}>
      <img 
        className="w-full" 
        src={toCssUrl(currentSrc)} 
        alt={title} 
      />
    </div>
  );
}
