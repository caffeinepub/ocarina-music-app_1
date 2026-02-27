import React from 'react';
import type { Fingering } from '../utils/fingeringMap';
import type { FingeringMap } from '../hooks/useFingeringMap';

interface TablatureDiagramProps {
  fingering: Fingering;
  size?: 'sm' | 'md' | 'lg';
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
  size = 'sm',
  className = '',
  fingeringMap,
  note,
}) => {
  // Use custom fingering map if both map and note are provided
  const fingering: Fingering =
    fingeringMap && note
      ? (fingeringMap[note] ?? defaultFingering)
      : defaultFingering;

  const { total, holeR, gap, padding } = SIZE_CONFIG[size];
  const center = total / 2;
  const offset = holeR + gap / 2;

  // 2x2 grid positions: [TL, TR, BL, BR]
  const positions = [
    { x: center - offset, y: center - offset }, // TL
    { x: center + offset, y: center - offset }, // TR
    { x: center - offset, y: center + offset }, // BL
    { x: center + offset, y: center + offset }, // BR
  ];

  return (
    <svg
      width={total}
      height={total}
      viewBox={`0 0 ${total} ${total}`}
      className={className}
      aria-label="Ocarina fingering diagram"
    >
      {/* Ocarina body background */}
      <ellipse
        cx={center}
        cy={center}
        rx={center - padding / 2}
        ry={center - padding / 2}
        fill="#c8a96e"
        stroke="#8b6340"
        strokeWidth={1.5}
      />

      {/* Holes */}
      {positions.map((pos, i) => (
        <circle
          key={i}
          cx={pos.x}
          cy={pos.y}
          r={holeR}
          fill={fingering[i] ? '#3d2b1f' : 'none'}
          stroke="#3d2b1f"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
};
