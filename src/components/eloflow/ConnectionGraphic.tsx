/** Composição abstrata de conexão — sem fotos genéricas. */
export function ConnectionGraphic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={className}
      role="img"
      aria-label="Composição abstrata representando conexões entre empresas e talentos"
    >
      <defs>
        <linearGradient id="elo-line" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary-dark)" />
          <stop offset="100%" stopColor="var(--primary-soft)" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="var(--border)" strokeWidth="1">
        <circle cx="210" cy="160" r="132" />
        <circle cx="210" cy="160" r="94" />
      </g>
      <path
        d="M40 250 L120 170 L200 200 L270 110 L380 70"
        fill="none"
        stroke="url(#elo-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="520"
        strokeDashoffset="520"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="520"
          to="0"
          dur="1.6s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.22 1 0.36 1"
        />
      </path>
      <path
        d="M40 130 L130 90 L210 160 L300 210 L380 190"
        fill="none"
        stroke="var(--primary-soft)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
        strokeDasharray="520"
        strokeDashoffset="520"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="520"
          to="0"
          dur="2.1s"
          begin="0.2s"
          fill="freeze"
        />
      </path>
      {[
        [40, 250],
        [120, 170],
        [200, 200],
        [270, 110],
        [380, 70],
        [130, 90],
        [300, 210],
      ].map(([cx, cy], i) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="7" fill="var(--sand)" stroke="var(--primary)" strokeWidth="2">
            <animate
              attributeName="r"
              values="0;7"
              dur="0.5s"
              begin={`${0.25 + i * 0.16}s`}
              fill="freeze"
            />
          </circle>
        </g>
      ))}
    </svg>
  );
}
