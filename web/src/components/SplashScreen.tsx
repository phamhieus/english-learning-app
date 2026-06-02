import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const markRef = useRef<HTMLDivElement>(null);
  const [fading, setFading] = useState(false);

  // Inline-load icon-blink.svg so CSS can target .eye / .mouth / .sparkle paths
  useEffect(() => {
    let cancelled = false;
    fetch('/icon-blink.svg')
      .then((r) => r.text())
      .then((txt) => {
        if (cancelled || !markRef.current) return;
        markRef.current.innerHTML = txt.trim();
        const svg = markRef.current.querySelector('svg');
        if (svg) {
          svg.setAttribute('class', 'lg-mark');
          svg.removeAttribute('width');
          svg.removeAttribute('height');
        }
      });
    return () => { cancelled = true; };
  }, []);

  // After 2.8 s start fade-out, after 3.4 s call onFinish
  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2800);
    const doneTimer = setTimeout(() => onFinish(), 3400);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onFinish]);

  return (
    <>
      <style>{`
        /* ── Stage ─────────────────────────────────────── */
        .lg-splash {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #0b0122;
          color: #f3eaff;
          font-family: 'Quicksand', 'Inter', system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
          overflow: hidden;
          transition: opacity 0.6s ease;
        }
        .lg-splash.fading { opacity: 0; pointer-events: none; }

        /* ── Icon ─────────────────────────────────────── */
        .lg-mark {
          width: clamp(360px, 72vmin, 640px);
          height: clamp(360px, 72vmin, 640px);
          display: block;
          animation: lg-bob 3.6s ease-in-out infinite;
        }
        @keyframes lg-bob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }

        /* Eyes blink */
        .lg-mark .eye {
          transform-box: fill-box;
          transform-origin: center;
          animation: lg-blink 4s infinite;
        }
        @keyframes lg-blink {
          0%, 42%, 50%, 92%, 100% { transform: scaleY(1); }
          45%, 47%                 { transform: scaleY(0.06); }
          95%, 97%                 { transform: scaleY(0.06); }
        }

        /* Mouth talks */
        .lg-mark .mouth {
          transform-box: fill-box;
          transform-origin: center top;
          animation: lg-talk 1.8s ease-in-out infinite;
        }
        @keyframes lg-talk {
          0%, 100% { transform: scaleY(1)    translateY(0); }
          25%      { transform: scaleY(1.55) translateY(0.5px); }
          50%      { transform: scaleY(0.85) translateY(0); }
          75%      { transform: scaleY(1.35) translateY(0.3px); }
        }

        /* Sparkles appear one by one */
        .lg-mark .sparkle {
          transform-box: fill-box;
          transform-origin: center;
          opacity: 0;
          animation: lg-sparkle 1.8s ease-in-out infinite;
        }
        .lg-mark .s2 { animation-delay: 0s;    }
        .lg-mark .s1 { animation-delay: 0.22s; }
        .lg-mark .s3 { animation-delay: 0.44s; }
        @keyframes lg-sparkle {
          0%        { opacity: 0; transform: scale(0.3) rotate(-12deg); }
          18%       { opacity: 1; transform: scale(1.15) rotate(0deg);  }
          32%       { opacity: 1; transform: scale(1)    rotate(0deg);  }
          60%       { opacity: 1; transform: scale(1)    rotate(0deg);  }
          85%, 100% { opacity: 0; transform: scale(0.6)  rotate(8deg);  }
        }

        /* ── Wordmark ─────────────────────────────────── */
        .lg-wordmark {
          font-weight: 700;
          font-size: clamp(40px, 7.2vmin, 76px);
          letter-spacing: -0.025em;
          color: #f3eaff;
          line-height: 1;
          display: inline-flex;
          align-items: baseline;
        }
        .lg-wordmark .i-wrap {
          position: relative;
          margin-left: 0.02em;
        }
        .lg-wordmark .i-dot {
          position: absolute;
          left: 50%;
          top: -0.18em;
          transform: translateX(-50%);
          width: 0.18em;
          height: 0.18em;
          border-radius: 50%;
          background: #9c66fa;
        }

        /* ── Loading label with animated dots ─────────── */
        .lg-loader {
          display: flex;
          align-items: center;
          margin-top: 4px;
        }
        .lg-loader .lg-label {
          font-weight: 500;
          font-size: clamp(13px, 1.8vmin, 16px);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(243, 234, 255, 0.55);
        }
        .lg-loader .lg-label::after {
          content: "";
          display: inline-block;
          width: 1.6em;
          text-align: left;
          animation: lg-dots 1.4s steps(4, end) infinite;
        }
        @keyframes lg-dots {
          0%   { content: ""; }
          25%  { content: "."; }
          50%  { content: ".."; }
          75%  { content: "..."; }
          100% { content: ""; }
        }

        /* ── Floating violet dots ─────────────────────── */
        .lg-float-dot {
          position: absolute;
          border-radius: 50%;
          background: #9c66fa;
          box-shadow: 0 0 14px rgba(156,102,250,0.7),
                      0 0 28px rgba(156,102,250,0.4);
          pointer-events: none;
        }
        .lg-float-dot.d1 {
          width: 14px; height: 14px;
          top: 8%; left: 18%;
          animation: lg-float1 6s ease-in-out infinite;
        }
        .lg-float-dot.d2 {
          width: 10px; height: 10px;
          top: 22%; right: 14%;
          background: #b284fb;
          animation: lg-float2 7.5s ease-in-out infinite;
        }
        .lg-float-dot.d3 {
          width: 8px; height: 8px;
          bottom: 28%; left: 8%;
          animation: lg-float3 5.4s ease-in-out infinite;
        }
        @keyframes lg-float1 {
          0%, 100% { transform: translate(0, 0)        scale(1);    opacity: 0.85; }
          50%      { transform: translate(14px, -12px) scale(1.1);  opacity: 1; }
        }
        @keyframes lg-float2 {
          0%, 100% { transform: translate(0, 0)         scale(1);   opacity: 0.7; }
          50%      { transform: translate(-10px, 14px)  scale(0.9); opacity: 1; }
        }
        @keyframes lg-float3 {
          0%, 100% { transform: translate(0, 0)         scale(1);    opacity: 0.6; }
          50%      { transform: translate(12px, 10px)   scale(1.15); opacity: 1; }
        }
      `}</style>

      <div className={`lg-splash${fading ? ' fading' : ''}`}>
        {/* Floating violet dots */}
        <span className="lg-float-dot d1" />
        <span className="lg-float-dot d2" />
        <span className="lg-float-dot d3" />

        {/* Animated icon — SVG loaded inline so .eye/.mouth/.sparkle classes work */}
        <div ref={markRef} className="lg-mark" />

        {/* Wordmark: "Lingua" with purple dot on the i */}
        <div className="lg-wordmark">
          L<span className="i-wrap">i<span className="i-dot" /></span>ngua
        </div>

        {/* Loading indicator */}
        <div className="lg-loader">
          <span className="lg-label">Loading</span>
        </div>
      </div>
    </>
  );
};
