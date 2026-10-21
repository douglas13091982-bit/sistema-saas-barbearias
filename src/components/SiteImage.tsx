import { useState, type ImgHTMLAttributes } from 'react';
import { resolveSiteImage } from '@/lib/site-images';

type SiteImageProps = ImgHTMLAttributes<HTMLImageElement> & { fallbackSrc?: string };

export function SiteImage({ src, alt = '', fallbackSrc, onError, ...props }: SiteImageProps) {
  const resolved = resolveSiteImage(src);
  const fallback = resolveSiteImage(fallbackSrc);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = !resolved || failedSource === resolved;
  const displaySource = failed ? fallback : resolved;
  const [failedFallback, setFailedFallback] = useState<string | null>(null);

  if (!displaySource || (failed && failedFallback === fallback)) {
    return <span role="img" aria-label={alt || 'Imagem indisponível'} className={props.className}
      style={{ ...props.style, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#292524', color: '#c9a96e' }}>
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 6-6 5 5 3-3 4 4" />
      </svg>
    </span>;
  }
  return <img {...props} src={displaySource} alt={alt} onError={event => {
    if (failed) setFailedFallback(fallback); else setFailedSource(resolved);
    onError?.(event);
  }} />;
}
