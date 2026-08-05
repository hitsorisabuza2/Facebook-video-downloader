import { useEffect, useRef } from "react";

// ─── Native Banner ────────────────────────────────────────────────────────────
// script + named container div — works anywhere in the page body
export function NativeBanner({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || injected.current) return;
    injected.current = true;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://examinerashtrayquizmaster.com/81db1aefc2f9894a4ebd32fad28281c1/invoke.js";
    el.appendChild(script);

    return () => {
      injected.current = false;
    };
  }, []);

  return (
    <div className={className}>
      <div
        id="container-81db1aefc2f9894a4ebd32fad28281c1"
        ref={containerRef}
      />
    </div>
  );
}

// ─── atOptions iframe banners ─────────────────────────────────────────────────
interface AtBannerProps {
  adKey: string;
  width: number;
  height: number;
  className?: string;
}

function AtBanner({ adKey, width, height, className = "" }: AtBannerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || injected.current) return;
    injected.current = true;

    // Set atOptions before the invoke script loads
    (window as Record<string, unknown>).atOptions = {
      key: adKey,
      format: "iframe",
      height,
      width,
      params: {},
    };

    const script = document.createElement("script");
    script.src = `https://examinerashtrayquizmaster.com/${adKey}/invoke.js`;
    wrap.appendChild(script);

    return () => {
      injected.current = false;
    };
  }, [adKey, width, height]);

  return (
    <div
      className={className}
      style={{ width, height, overflow: "hidden" }}
      ref={wrapRef}
    />
  );
}

// ─── Convenience exports ──────────────────────────────────────────────────────

/** 728 × 90 — desktop leaderboard */
export function Banner728x90({ className = "" }: { className?: string }) {
  return (
    <AtBanner
      adKey="8df69a87352c31783e10f8cf582a69c0"
      width={728}
      height={90}
      className={className}
    />
  );
}

/** 468 × 60 — medium banner, good for mobile */
export function Banner468x60({ className = "" }: { className?: string }) {
  return (
    <AtBanner
      adKey="e48c9a168b761ea4d3c721cbefeec38b"
      width={468}
      height={60}
      className={className}
    />
  );
}

/** 160 × 300 — half-page / sidebar */
export function Banner160x300({ className = "" }: { className?: string }) {
  return (
    <AtBanner
      adKey="d63f7b62d6399d2e4ac8a505d104eb67"
      width={160}
      height={300}
      className={className}
    />
  );
}

// ─── Responsive slot: 728x90 on md+, 468x60 on small ─────────────────────────
export function ResponsiveBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      {/* Desktop ≥ 768px */}
      <div className="hidden md:block">
        <Banner728x90 />
      </div>
      {/* Mobile < 768px */}
      <div className="block md:hidden">
        <Banner468x60 />
      </div>
    </div>
  );
}
