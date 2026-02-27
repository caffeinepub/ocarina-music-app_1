import React from 'react';
import type { FingeringMap } from '../hooks/useFingeringMap';
import { getFingeringForPitch } from '../utils/fingeringMap';

interface OcarinaVisualProps {
  currentNote: string | null;
  className?: string;
  style?: React.CSSProperties;
  fingeringMap?: FingeringMap;
}

export const OcarinaVisual: React.FC<OcarinaVisualProps> = ({
  currentNote,
  className = '',
  style,
  fingeringMap,
}) => {
  // Use custom fingering map if provided, otherwise fall back to static defaults
  const fingering: [boolean, boolean, boolean, boolean] = currentNote
    ? (fingeringMap
        ? (fingeringMap[currentNote] ?? [false, false, false, false])
        : getFingeringForPitch(currentNote))
    : [false, false, false, false];

  // Ocarina body: teardrop shape, mouthpiece at bottom
  // ViewBox: 0 0 300 480
  // Body center: cx=150, cy=200 (upper portion)
  // Mouthpiece: bottom center ~cy=390

  // Tone holes: 2×2 grid on the body center
  // Left hand at TOP, right hand at BOTTOM (near mouthpiece)
  // Holes: [TL, TR, BL, BR] mapped to body center
  const holePositions = [
    { cx: 133, cy: 178 }, // TL
    { cx: 167, cy: 178 }, // TR
    { cx: 133, cy: 210 }, // BL
    { cx: 167, cy: 210 }, // BR
  ];

  return (
    <div className={`relative ${className}`} style={style}>
      <svg
        viewBox="0 0 300 480"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-label={`Ocarina visual${currentNote ? ` playing ${currentNote}` : ''}`}
      >
        <defs>
          {/* Parchment background */}
          <radialGradient id="ov-bgGrad" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#f7edd5" />
            <stop offset="100%" stopColor="#e8d5b0" />
          </radialGradient>

          {/* Ceramic body gradient - warm terracotta/clay */}
          <radialGradient id="ov-bodyGrad" cx="38%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#e8b87a" />
            <stop offset="45%" stopColor="#c8883a" />
            <stop offset="80%" stopColor="#a06428" />
            <stop offset="100%" stopColor="#7a4a18" />
          </radialGradient>

          {/* Mouthpiece gradient */}
          <radialGradient id="ov-mouthGrad" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#c8883a" />
            <stop offset="100%" stopColor="#7a4a18" />
          </radialGradient>

          {/* Skin gradient for hands */}
          <radialGradient id="ov-skinGrad" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f2c898" />
            <stop offset="100%" stopColor="#d4956a" />
          </radialGradient>

          {/* Ceramic highlight */}
          <radialGradient id="ov-highlight" cx="35%" cy="25%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* Drop shadow filter */}
          <filter id="ov-shadow" x="-25%" y="-15%" width="150%" height="140%">
            <feDropShadow dx="2" dy="5" stdDeviation="6" floodColor="#3d2b1f" floodOpacity="0.35" />
          </filter>

          {/* Soft shadow for hands */}
          <filter id="ov-handShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#3d2b1f" floodOpacity="0.25" />
          </filter>

          {/* Clip path for body */}
          <clipPath id="ov-bodyClip">
            <path d="
              M 150 60
              C 210 60, 255 100, 258 155
              C 262 210, 240 265, 210 305
              C 185 338, 165 360, 150 375
              C 135 360, 115 338, 90 305
              C 60 265, 38 210, 42 155
              C 45 100, 90 60, 150 60
              Z
            " />
          </clipPath>
        </defs>

        {/* Background */}
        <rect width="300" height="480" fill="url(#ov-bgGrad)" rx="10" />

        {/* ===== LEFT HAND (TOP — index/middle fingers on top holes) ===== */}
        <g filter="url(#ov-handShadow)">
          {/* Left palm - positioned at top-left of body */}
          <ellipse cx="98" cy="118" rx="48" ry="36" fill="url(#ov-skinGrad)" />
          {/* Left thumb - pointing inward/right */}
          <ellipse cx="148" cy="100" rx="18" ry="11" fill="url(#ov-skinGrad)" transform="rotate(20, 148, 100)" />
          {/* Left fingers - pointing downward toward holes */}
          <ellipse cx="62" cy="88" rx="10" ry="22" fill="url(#ov-skinGrad)" transform="rotate(-8, 62, 88)" />
          <ellipse cx="84" cy="80" rx="10" ry="24" fill="url(#ov-skinGrad)" transform="rotate(-4, 84, 80)" />
          <ellipse cx="108" cy="78" rx="10" ry="24" fill="url(#ov-skinGrad)" transform="rotate(2, 108, 78)" />
          <ellipse cx="130" cy="82" rx="9" ry="22" fill="url(#ov-skinGrad)" transform="rotate(6, 130, 82)" />
          {/* Knuckle lines */}
          <line x1="61" y1="98" x2="63" y2="106" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
          <line x1="83" y1="92" x2="85" y2="100" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
          <line x1="107" y1="90" x2="109" y2="98" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
        </g>

        {/* ===== RIGHT HAND (BOTTOM — near mouthpiece) ===== */}
        <g filter="url(#ov-handShadow)">
          {/* Right palm - positioned at bottom-right of body */}
          <ellipse cx="202" cy="298" rx="48" ry="36" fill="url(#ov-skinGrad)" />
          {/* Right thumb - pointing inward/left */}
          <ellipse cx="152" cy="316" rx="18" ry="11" fill="url(#ov-skinGrad)" transform="rotate(-20, 152, 316)" />
          {/* Right fingers - pointing upward toward holes */}
          <ellipse cx="238" cy="328" rx="10" ry="22" fill="url(#ov-skinGrad)" transform="rotate(8, 238, 328)" />
          <ellipse cx="216" cy="336" rx="10" ry="24" fill="url(#ov-skinGrad)" transform="rotate(4, 216, 336)" />
          <ellipse cx="192" cy="338" rx="10" ry="24" fill="url(#ov-skinGrad)" transform="rotate(-2, 192, 338)" />
          <ellipse cx="170" cy="334" rx="9" ry="22" fill="url(#ov-skinGrad)" transform="rotate(-6, 170, 334)" />
          {/* Knuckle lines */}
          <line x1="237" y1="318" x2="239" y2="326" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
          <line x1="215" y1="324" x2="217" y2="332" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
          <line x1="191" y1="326" x2="193" y2="334" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
        </g>

        {/* ===== OCARINA BODY — teardrop/egg shape, mouthpiece at bottom ===== */}
        <g filter="url(#ov-shadow)">
          {/* Main ceramic body - teardrop path, wider at top, narrowing toward bottom */}
          <path
            d="
              M 150 58
              C 212 58, 260 100, 260 158
              C 260 215, 238 268, 208 308
              C 185 340, 165 362, 150 376
              C 135 362, 115 340, 92 308
              C 62 268, 40 215, 40 158
              C 40 100, 88 58, 150 58
              Z
            "
            fill="url(#ov-bodyGrad)"
          />

          {/* Ceramic highlight overlay */}
          <path
            d="
              M 150 58
              C 212 58, 260 100, 260 158
              C 260 215, 238 268, 208 308
              C 185 340, 165 362, 150 376
              C 135 362, 115 340, 92 308
              C 62 268, 40 215, 40 158
              C 40 100, 88 58, 150 58
              Z
            "
            fill="url(#ov-highlight)"
          />

          {/* Ceramic texture lines - horizontal arcs across body */}
          <path d="M 72 140 Q 150 128 228 140" stroke="#7a4a18" strokeWidth="1.2" fill="none" opacity="0.35" />
          <path d="M 58 175 Q 150 162 242 175" stroke="#7a4a18" strokeWidth="1.2" fill="none" opacity="0.35" />
          <path d="M 62 210 Q 150 198 238 210" stroke="#7a4a18" strokeWidth="1.2" fill="none" opacity="0.35" />
          <path d="M 72 245 Q 150 234 228 245" stroke="#7a4a18" strokeWidth="1.2" fill="none" opacity="0.3" />
          <path d="M 88 278 Q 150 268 212 278" stroke="#7a4a18" strokeWidth="1.2" fill="none" opacity="0.25" />

          {/* Body outline */}
          <path
            d="
              M 150 58
              C 212 58, 260 100, 260 158
              C 260 215, 238 268, 208 308
              C 185 340, 165 362, 150 376
              C 135 362, 115 340, 92 308
              C 62 268, 40 215, 40 158
              C 40 100, 88 58, 150 58
              Z
            "
            fill="none"
            stroke="#5a3010"
            strokeWidth="2"
            opacity="0.7"
          />

          {/* ===== MOUTHPIECE at BOTTOM ===== */}
          {/* Neck/stem connecting body to mouthpiece */}
          <path
            d="M 132 372 Q 150 385 168 372 L 172 400 Q 150 415 128 400 Z"
            fill="url(#ov-mouthGrad)"
          />
          {/* Mouthpiece tube */}
          <ellipse cx="150" cy="408" rx="22" ry="14" fill="#a06428" />
          <ellipse cx="150" cy="408" rx="14" ry="9" fill="#7a4a18" />
          {/* Mouthpiece opening */}
          <ellipse cx="150" cy="420" rx="18" ry="10" fill="#7a4a18" />
          <ellipse cx="150" cy="422" rx="12" ry="7" fill="#3d2010" />
          {/* Mouthpiece highlight */}
          <ellipse cx="144" cy="404" rx="6" ry="3" fill="white" opacity="0.2" transform="rotate(-10, 144, 404)" />

          {/* Voicing hole (small hole on top of mouthpiece) */}
          <ellipse cx="150" cy="378" rx="8" ry="5" fill="#3d2010" opacity="0.8" />
        </g>

        {/* ===== TONE HOLES — 2×2 grid on body center ===== */}
        {holePositions.map((pos, i) => (
          <g key={i}>
            {/* Hole depth shadow */}
            <circle
              cx={pos.cx + 1}
              cy={pos.cy + 2}
              r={11}
              fill="#3d1a08"
              opacity="0.45"
            />
            {/* Hole */}
            <circle
              cx={pos.cx}
              cy={pos.cy}
              r={11}
              fill={fingering[i] ? '#1a0a04' : 'none'}
              stroke="#3d2010"
              strokeWidth={2.5}
              className="transition-all duration-150"
            />
            {/* Open hole inner ring */}
            {!fingering[i] && (
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={6.5}
                fill="none"
                stroke="#5a3010"
                strokeWidth={1}
                opacity={0.5}
              />
            )}
            {/* Closed hole shine */}
            {fingering[i] && (
              <circle
                cx={pos.cx - 3}
                cy={pos.cy - 3}
                r={2.5}
                fill="white"
                opacity={0.12}
              />
            )}
          </g>
        ))}

        {/* ===== HAND LABELS ===== */}
        <text
          x="22"
          y="130"
          fontSize="9"
          fill="#7a4a18"
          opacity="0.65"
          fontFamily="'Lato', sans-serif"
          fontWeight="700"
          letterSpacing="0.5"
        >
          L
        </text>
        <text
          x="272"
          y="300"
          fontSize="9"
          fill="#7a4a18"
          opacity="0.65"
          fontFamily="'Lato', sans-serif"
          fontWeight="700"
          letterSpacing="0.5"
        >
          R
        </text>

        {/* ===== NOTE LABEL ===== */}
        {currentNote && (
          <g>
            <rect x="228" y="14" width="58" height="30" rx="6" fill="#3d2b1f" opacity="0.85" />
            <text
              x="257"
              y="34"
              textAnchor="middle"
              fill="#f5ead0"
              fontSize="15"
              fontFamily="'Playfair Display', serif"
              fontWeight="bold"
            >
              {currentNote}
            </text>
          </g>
        )}

        {/* Decorative border */}
        <rect
          x="2" y="2" width="296" height="476"
          rx="10" fill="none"
          stroke="#8b6340"
          strokeWidth="1.5"
          opacity="0.35"
        />
      </svg>
    </div>
  );
};
