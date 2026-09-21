const OUTER_KEYS = Array.from({ length: 12 }, (_, i) => `${i + 1}B`);
const INNER_KEYS = Array.from({ length: 12 }, (_, i) => `${i + 1}A`);

function wedgePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
) {
  const toXY = (r: number, deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = toXY(rOuter, startDeg);
  const [x2, y2] = toXY(rOuter, endDeg);
  const [x3, y3] = toXY(rInner, endDeg);
  const [x4, y4] = toXY(rInner, startDeg);
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 0 0 ${x4} ${y4} Z`;
}

function labelXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}

export function CamelotWheel({
  highlight,
  size = 280,
}: {
  highlight?: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuterEdge = size * 0.48;
  const rMid = size * 0.34;
  const rInnerEdge = size * 0.2;
  const step = 360 / 12;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Camelot mixing wheel, major keys on the outer ring, minor keys on the inner ring"
    >
      {OUTER_KEYS.map((key, i) => {
        const start = i * step;
        const end = start + step;
        const active = key === highlight;
        return (
          <path
            key={key}
            d={wedgePath(cx, cy, rOuterEdge, rMid, start, end)}
            fill={active ? "var(--color-amber)" : "var(--color-amber-dim)"}
            fillOpacity={active ? 1 : 0.35}
            stroke="var(--color-ink)"
            strokeWidth={1}
          />
        );
      })}
      {INNER_KEYS.map((key, i) => {
        const start = i * step;
        const end = start + step;
        const active = key === highlight;
        return (
          <path
            key={key}
            d={wedgePath(cx, cy, rMid, rInnerEdge, start, end)}
            fill={active ? "var(--color-teal)" : "var(--color-teal-dim)"}
            fillOpacity={active ? 1 : 0.35}
            stroke="var(--color-ink)"
            strokeWidth={1}
          />
        );
      })}
      {OUTER_KEYS.map((key, i) => {
        const [x, y] = labelXY(cx, cy, (rOuterEdge + rMid) / 2, i * step + step / 2);
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.032}
            fontFamily="var(--font-mono)"
            fill="var(--color-ink)"
          >
            {key}
          </text>
        );
      })}
      {INNER_KEYS.map((key, i) => {
        const [x, y] = labelXY(cx, cy, (rMid + rInnerEdge) / 2, i * step + step / 2);
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.032}
            fontFamily="var(--font-mono)"
            fill="var(--color-ink)"
          >
            {key}
          </text>
        );
      })}
    </svg>
  );
}
