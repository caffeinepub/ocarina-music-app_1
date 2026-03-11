import type React from "react";
import type { FingeringMap } from "../hooks/useFingeringMap";
import type { Fingering } from "../utils/fingeringMap";

interface TablatureDiagramProps {
  fingering: Fingering;
  size?: "sm" | "md" | "lg";
  className?: string;
  fingeringMap?: FingeringMap;
  note?: string;
}

const SIZE_CONFIG = {
  sm: { total: 24, holeR: 4, gap: 2, padding: 4 },
  md: { total: 40, holeR: 7, gap: 3, padding: 6 },
  lg: { total: 60, holeR: 10, gap: 4, padding: 8 },
};

export const TablatureDiagram: React.FC<TablatureDiagramProps> = ({
  fingering: defaultFingering,
  size = "sm",
  className = "",
  fingeringMap,
  note,
}) => {
  const fingering: Fingering =
    fingeringMap && note
      ? (fingeringMap[note] ?? defaultFingering)
      : defaultFingering;
  const { total, holeR, gap, padding } = SIZE_CONFIG[size];
  const center = total / 2;
  const offset = holeR + gap / 2;
  const positions = [
    { id: "tl", x: center - offset, y: center - offset },
    { id: "tr", x: center + offset, y: center - offset },
    { id: "bl", x: center - offset, y: center + offset },
    { id: "br", x: center + offset, y: center + offset },
  ];
  return (
    <svg
      width={total}
      height={total}
      viewBox={`0 0 ${total} ${total}`}
      className={className}
      aria-label="Ocarina fingering diagram"
    >
      <title>Fingering</title>
      <ellipse
        cx={center}
        cy={center}
        rx={center - padding / 2}
        ry={center - padding / 2}
        fill="#c8a96e"
        stroke="#8b6340"
        strokeWidth={1.5}
      />
      {positions.map((pos, i) => (
        <circle
          key={pos.id}
          cx={pos.x}
          cy={pos.y}
          r={holeR}
          fill={fingering[i] ? "#3d2b1f" : "none"}
          stroke="#3d2b1f"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
};
