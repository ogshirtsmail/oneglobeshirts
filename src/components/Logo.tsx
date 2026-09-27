const GOLD_G = "#FFD24A";
const GOLD_O = "#F4BE3A";

const sparkles = [
  { x: 118, y: 142, s: 26, begin: "0s" },
  { x: 402, y: 168, s: 20, begin: "0.7s" },
  { x: 336, y: 318, s: 30, begin: "1.3s" },
  { x: 214, y: 352, s: 16, begin: "0.4s" },
  { x: 276, y: 122, s: 14, begin: "1.9s" },
  { x: 88, y: 300, s: 12, begin: "1.1s" },
  { x: 420, y: 330, s: 12, begin: "2.3s" },
];

/**
 * Glittering gold OG monogram + wordmark.
 * `idPrefix` keeps SVG gradient/filter ids unique when the logo appears more than once on a page.
 */
export default function Logo({
  className = "",
  idPrefix = "logo",
  markHeight = 44,
}: {
  className?: string;
  idPrefix?: string;
  markHeight?: number;
}) {
  const g = `${idPrefix}-gold-g`;
  const o = `${idPrefix}-gold-o`;
  const glitter = `${idPrefix}-glitter`;
  const glow = `${idPrefix}-glow`;
  const Gpath = "M372.8,162.2 A110,110 0 1,0 405,240 L305,240";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="20 70 430 340"
        height={markHeight}
        width={(markHeight * 430) / 340}
        role="img"
        aria-label="One Globe OG monogram"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFBE0" />
            <stop offset="0.3" stopColor={GOLD_G} />
            <stop offset="0.55" stopColor="#E0A82A" />
            <stop offset="0.75" stopColor={GOLD_G} />
            <stop offset="1" stopColor="#FFFBE0" />
          </linearGradient>
          <linearGradient id={o} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#FFF1B0" />
            <stop offset="0.35" stopColor={GOLD_O} />
            <stop offset="0.6" stopColor="#D9A020" />
            <stop offset="0.8" stopColor={GOLD_O} />
            <stop offset="1" stopColor="#FFF6CC" />
          </linearGradient>
          <filter id={glitter} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="noise" />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.85  9 0 0 0 -5.8"
              result="specks"
            />
            <feComposite in="specks" in2="SourceGraphic" operator="in" result="glit" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="glit" />
            </feMerge>
          </filter>
          <filter id={glow} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        <g opacity="0.6" filter={`url(#${glow})`}>
          <path d={Gpath} fill="none" stroke="#FFC933" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="185" cy="240" r="110" fill="none" stroke="#FFC933" strokeWidth="46" />
        </g>
        <g filter={`url(#${glitter})`}>
          <path d={Gpath} fill="none" stroke={`url(#${g})`} strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <circle cx="185" cy="240" r="110" fill="none" stroke="#0B0B0B" strokeWidth="72" />
        <g filter={`url(#${glitter})`}>
          <circle cx="185" cy="240" r="110" fill="none" stroke={`url(#${o})`} strokeWidth="46" />
        </g>

        {sparkles.map((sp) => (
          <g key={`${sp.x}-${sp.y}`} transform={`translate(${sp.x},${sp.y}) scale(${sp.s})`}>
            <path
              d="M0,-1 L0.22,-0.22 L1,0 L0.22,0.22 L0,1 L-0.22,0.22 L-1,0 L-0.22,-0.22 Z"
              fill="#FFFDF0"
              opacity="0"
            >
              <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin={sp.begin} repeatCount="indefinite" />
            </path>
          </g>
        ))}
      </svg>
      <span className="text-lg font-extrabold uppercase tracking-wide">One Globe</span>
    </span>
  );
}
