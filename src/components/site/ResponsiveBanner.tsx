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
  const title = alt ?? "";

  return (
    <div className={className ?? ""} aria-label={title}>
      <img className="hidden w-full sm:block" src={toCssUrl(desktopSrc)} alt={title} />
      <img className="w-full sm:hidden" src={toCssUrl(mobileSrc)} alt={title} />
    </div>
  );
}
