"use client";

import { useMemo, useRef, useState } from "react";

export interface ActivityPoint {
  date: Date;
  count: number;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 30 };

/**
 * Single-series area chart of workspace activity. One hue (the app primary),
 * recessive grid, crosshair + tooltip on hover, text in text tokens.
 */
export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { linePath, areaPath, points, maxValue, ticks } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.count));
    // integer y ticks: 0, mid (if >1), max
    const tickValues = max <= 2 ? [0, max] : [0, Math.round(max / 2), max];

    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

    const pts = data.map((d, i) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + innerH - (d.count / max) * innerH,
      ...d,
    }));

    const line = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${
      PAD.top + innerH
    } L${pts[0].x.toFixed(1)},${PAD.top + innerH} Z`;

    return { linePath: line, areaPath: area, points: pts, maxValue: max, ticks: tickValues };
  }, [data]);

  function yFor(value: number) {
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    return PAD.top + innerH - (value / maxValue) * innerH;
  }

  function onPointerMove(event: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const distance = Math.abs(p.x - x);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });
    setHovered(nearest);
  }

  const active = hovered !== null ? points[hovered] : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Documents added per day over the last ${data.length} days`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* recessive grid + y tick labels */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray={tick === 0 ? undefined : "3 5"}
            />
            <text
              x={PAD.left - 8}
              y={yFor(tick) + 3.5}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="10"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* sparse x labels */}
        {points.map((p, i) => {
          const show = i === 0 || i === points.length - 1 || i % 3 === 0;
          if (!show) return null;
          return (
            <text
              key={i}
              x={p.x}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="10"
            >
              {p.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </text>
          );
        })}

        <path d={areaPath} fill="url(#activity-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* crosshair + hovered marker */}
        {active && (
          <g>
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD.top}
              y2={HEIGHT - PAD.bottom}
              stroke="hsl(var(--muted-foreground) / 0.35)"
              strokeWidth="1"
            />
            <circle
              cx={active.x}
              cy={active.y}
              r="5"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--card))"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {/* tooltip */}
      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-raised"
          style={{
            left: `${(active.x / WIDTH) * 100}%`,
            top: Math.max(0, (active.y / HEIGHT) * 100 - 22) + "%",
          }}
        >
          <span className="font-semibold">{active.count}</span>{" "}
          <span className="text-muted-foreground">
            {active.count === 1 ? "item" : "items"} ·{" "}
            {active.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      )}
    </div>
  );
}
