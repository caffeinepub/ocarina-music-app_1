import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { FingeringMap } from '../hooks/useFingeringMap';
import { getFingeringForPitch } from '../utils/fingeringMap';
import { Upload, X, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OcarinaVisualProps {
  currentNote: string | null;
  className?: string;
  style?: React.CSSProperties;
  fingeringMap?: FingeringMap;
  /** Optional external image URL loaded from a profile in the showcase panel */
  externalImageUrl?: string | null;
}

interface HoleConfig {
  x: number;   // percentage of container width
  y: number;   // percentage of container height
  radius: number; // px
}

const MIN_RADIUS = 6;
const MAX_RADIUS = 60;

// Default hole positions as percentages of container (2×2 grid centered)
const DEFAULT_HOLE_CONFIGS: HoleConfig[] = [
  { x: 38, y: 38, radius: 20 }, // TL
  { x: 62, y: 38, radius: 20 }, // TR
  { x: 38, y: 58, radius: 20 }, // BL
  { x: 62, y: 58, radius: 20 }, // BR
];

type DragState =
  | { type: 'move'; holeIndex: number; startX: number; startY: number; startHoleX: number; startHoleY: number }
  | { type: 'resize'; holeIndex: number; startX: number; startY: number; startRadius: number };

export const OcarinaVisual: React.FC<OcarinaVisualProps> = ({
  currentNote,
  className = '',
  style,
  fingeringMap,
  externalImageUrl = null,
}) => {
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [holeConfigs, setHoleConfigs] = useState<HoleConfig[]>(DEFAULT_HOLE_CONFIGS.map(h => ({ ...h })));
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [editMode, setEditMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When an external profile image is loaded from the showcase, display it
  useEffect(() => {
    if (externalImageUrl) {
      // Revoke any existing local blob URL
      if (localImage && localImage.startsWith('blob:')) {
        URL.revokeObjectURL(localImage);
      }
      setLocalImage(null); // clear local so external takes precedence
      setHoleConfigs(DEFAULT_HOLE_CONFIGS.map(h => ({ ...h })));
      setEditMode(false);
    }
  }, [externalImageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // The image to display: local upload takes priority, then external profile image
  const customImage = localImage ?? externalImageUrl ?? null;

  // Use custom fingering map if provided, otherwise fall back to static defaults
  const fingering: [boolean, boolean, boolean, boolean] = currentNote
    ? (fingeringMap
        ? (fingeringMap[currentNote] ?? [false, false, false, false])
        : getFingeringForPitch(currentNote))
    : [false, false, false, false];

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setLocalImage(url);
    setHoleConfigs(DEFAULT_HOLE_CONFIGS.map(h => ({ ...h })));
    setEditMode(true);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  const handleRemoveImage = useCallback(() => {
    if (localImage && localImage.startsWith('blob:')) {
      URL.revokeObjectURL(localImage);
    }
    setLocalImage(null);
    setHoleConfigs(DEFAULT_HOLE_CONFIGS.map(h => ({ ...h })));
    setEditMode(false);
  }, [localImage]);

  // Pointer event handlers for drag/resize
  const handleHolePointerDown = useCallback((
    e: React.PointerEvent,
    holeIndex: number,
    type: 'move' | 'resize'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (type === 'move') {
      setDragState({
        type: 'move',
        holeIndex,
        startX: e.clientX,
        startY: e.clientY,
        startHoleX: holeConfigs[holeIndex].x,
        startHoleY: holeConfigs[holeIndex].y,
      });
    } else {
      setDragState({
        type: 'resize',
        holeIndex,
        startX: e.clientX,
        startY: e.clientY,
        startRadius: holeConfigs[holeIndex].radius,
      });
    }
  }, [holeConfigs]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;

    if (dragState.type === 'move') {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      const dxPct = (dx / containerW) * 100;
      const dyPct = (dy / containerH) * 100;

      const hole = holeConfigs[dragState.holeIndex];
      const radiusPctX = (hole.radius / containerW) * 100;
      const radiusPctY = (hole.radius / containerH) * 100;

      const newX = Math.max(radiusPctX, Math.min(100 - radiusPctX, dragState.startHoleX + dxPct));
      const newY = Math.max(radiusPctY, Math.min(100 - radiusPctY, dragState.startHoleY + dyPct));

      setHoleConfigs(prev => prev.map((h, i) =>
        i === dragState.holeIndex ? { ...h, x: newX, y: newY } : h
      ));
    } else if (dragState.type === 'resize') {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const delta = Math.sqrt(dx * dx + dy * dy) * (dx + dy > 0 ? 1 : -1);
      const newRadius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, dragState.startRadius + delta * 0.3));

      setHoleConfigs(prev => prev.map((h, i) =>
        i === dragState.holeIndex ? { ...h, radius: newRadius } : h
      ));
    }
  }, [dragState, holeConfigs]);

  const handlePointerUp = useCallback((_e: React.PointerEvent) => {
    if (dragState) {
      setDragState(null);
    }
  }, [dragState]);

  // Cleanup local blob URL on unmount
  useEffect(() => {
    return () => {
      if (localImage && localImage.startsWith('blob:')) URL.revokeObjectURL(localImage);
    };
  }, [localImage]);

  // SVG hole positions (original)
  const svgHolePositions = [
    { cx: 133, cy: 178 }, // TL
    { cx: 167, cy: 178 }, // TR
    { cx: 133, cy: 210 }, // BL
    { cx: 167, cy: 210 }, // BR
  ];

  return (
    <div className={`relative flex flex-col gap-2 ${className}`} style={style}>
      {/* Upload controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {!customImage ? (
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-7"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3 h-3" />
            Upload Custom Image
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-7"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3 h-3" />
              Replace Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-7 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={handleRemoveImage}
            >
              <X className="w-3 h-3" />
              Remove
            </Button>
            <Button
              variant={editMode ? 'default' : 'outline'}
              size="sm"
              className="text-xs gap-1.5 h-7"
              onClick={() => setEditMode(v => !v)}
            >
              <Move className="w-3 h-3" />
              {editMode ? 'Done Editing' : 'Edit Holes'}
            </Button>
          </>
        )}
      </div>

      {/* Visual area */}
      {customImage ? (
        // Custom image mode: image + overlay holes
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-lg border border-border select-none"
          style={{ aspectRatio: '3/4', cursor: dragState?.type === 'move' ? 'grabbing' : 'default' }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img
            src={customImage}
            alt="Custom ocarina"
            className="w-full h-full object-contain"
            draggable={false}
          />

          {/* Overlay holes */}
          {holeConfigs.map((hole, i) => {
            const isClosed = fingering[i];
            const r = hole.radius;
            const left = `${hole.x}%`;
            const top = `${hole.y}%`;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  transform: 'translate(-50%, -50%)',
                  width: r * 2,
                  height: r * 2,
                  pointerEvents: editMode ? 'auto' : 'none',
                }}
              >
                {/* Hole shadow */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'rgba(30,10,0,0.35)',
                    transform: 'translate(1px, 2px)',
                  }}
                />
                {/* Main hole circle */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: isClosed ? '#1a0a04' : 'transparent',
                    border: `${Math.max(2, r * 0.12)}px solid #3d2010`,
                    boxSizing: 'border-box',
                    cursor: editMode ? 'grab' : 'default',
                    transition: 'background 0.15s',
                  }}
                  onPointerDown={editMode ? (e) => handleHolePointerDown(e, i, 'move') : undefined}
                >
                  {/* Open hole inner ring */}
                  {!isClosed && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: '25%',
                        borderRadius: '50%',
                        border: `${Math.max(1, r * 0.06)}px solid rgba(90,48,16,0.5)`,
                      }}
                    />
                  )}
                  {/* Closed hole shine */}
                  {isClosed && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '18%',
                        left: '18%',
                        width: '28%',
                        height: '28%',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                      }}
                    />
                  )}
                </div>

                {/* Resize handle — only visible in edit mode */}
                {editMode && (
                  <div
                    title="Drag to resize"
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: Math.max(10, r * 0.4),
                      height: Math.max(10, r * 0.4),
                      borderRadius: '50%',
                      background: '#f5ead0',
                      border: '2px solid #8b6340',
                      cursor: 'nwse-resize',
                      zIndex: 10,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    }}
                    onPointerDown={(e) => handleHolePointerDown(e, i, 'resize')}
                  />
                )}

                {/* Hole index label in edit mode */}
                {editMode && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: Math.max(8, r * 0.45),
                      fontWeight: 700,
                      color: isClosed ? 'rgba(255,255,255,0.6)' : 'rgba(61,32,16,0.7)',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      lineHeight: 1,
                    }}
                  >
                    {i + 1}
                  </div>
                )}
              </div>
            );
          })}

          {/* Edit mode hint */}
          {editMode && (
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(30,10,0,0.7)',
                color: '#f5ead0',
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              Drag holes to move · Drag ● handle to resize
            </div>
          )}
        </div>
      ) : (
        // Original SVG mode
        <div className="relative w-full">
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
              <ellipse cx="98" cy="118" rx="48" ry="36" fill="url(#ov-skinGrad)" />
              <ellipse cx="148" cy="100" rx="18" ry="11" fill="url(#ov-skinGrad)" transform="rotate(20, 148, 100)" />
              <ellipse cx="62" cy="88" rx="10" ry="22" fill="url(#ov-skinGrad)" transform="rotate(-8, 62, 88)" />
              <ellipse cx="84" cy="80" rx="10" ry="24" fill="url(#ov-skinGrad)" transform="rotate(-4, 84, 80)" />
              <ellipse cx="108" cy="78" rx="10" ry="24" fill="url(#ov-skinGrad)" transform="rotate(2, 108, 78)" />
              <ellipse cx="130" cy="82" rx="9" ry="22" fill="url(#ov-skinGrad)" transform="rotate(6, 130, 82)" />
              <line x1="61" y1="98" x2="63" y2="106" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
              <line x1="83" y1="92" x2="85" y2="100" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
              <line x1="107" y1="90" x2="109" y2="98" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
            </g>

            {/* ===== RIGHT HAND (BOTTOM — near mouthpiece) ===== */}
            <g filter="url(#ov-handShadow)">
              <ellipse cx="202" cy="298" rx="48" ry="36" fill="url(#ov-skinGrad)" />
              <ellipse cx="152" cy="316" rx="18" ry="11" fill="url(#ov-skinGrad)" transform="rotate(-20, 152, 316)" />
              <ellipse cx="238" cy="328" rx="10" ry="22" fill="url(#ov-skinGrad)" transform="rotate(8, 238, 328)" />
              <ellipse cx="216" cy="336" rx="10" ry="24" fill="url(#ov-skinGrad)" transform="rotate(4, 216, 336)" />
              <ellipse cx="192" cy="338" rx="10" ry="24" fill="url(#ov-skinGrad)" transform="rotate(-2, 192, 338)" />
              <ellipse cx="170" cy="334" rx="9" ry="22" fill="url(#ov-skinGrad)" transform="rotate(-6, 170, 334)" />
              <line x1="237" y1="318" x2="239" y2="326" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
              <line x1="215" y1="324" x2="217" y2="332" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
              <line x1="191" y1="326" x2="193" y2="334" stroke="#c4845a" strokeWidth="1" opacity="0.5" />
            </g>

            {/* ===== OCARINA BODY — teardrop/egg shape, mouthpiece at bottom ===== */}
            <g filter="url(#ov-shadow)">
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
              {/* Decorative lines */}
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
              {/* Mouthpiece at bottom */}
              <path
                d="M 128 370 C 128 390, 172 390, 172 370"
                fill="url(#ov-mouthGrad)"
                stroke="#5a3010"
                strokeWidth="1.5"
              />
              <ellipse cx="150" cy="388" rx="18" ry="8" fill="url(#ov-mouthGrad)" stroke="#5a3010" strokeWidth="1.5" />
              <ellipse cx="150" cy="388" rx="10" ry="4" fill="#3d1a08" opacity="0.8" />
            </g>

            {/* ===== TONE HOLES ===== */}
            {svgHolePositions.map((pos, i) => {
              const isClosed = fingering[i];
              return (
                <g key={i}>
                  {/* Shadow */}
                  <circle
                    cx={pos.cx + 1}
                    cy={pos.cy + 2}
                    r="13"
                    fill="rgba(30,10,0,0.3)"
                  />
                  {/* Hole */}
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r="13"
                    fill={isClosed ? '#1a0a04' : 'transparent'}
                    stroke="#3d2010"
                    strokeWidth="2.5"
                    style={{ transition: 'fill 0.15s' }}
                  />
                  {/* Open hole inner ring */}
                  {!isClosed && (
                    <circle
                      cx={pos.cx}
                      cy={pos.cy}
                      r="7"
                      fill="none"
                      stroke="rgba(90,48,16,0.4)"
                      strokeWidth="1.5"
                    />
                  )}
                  {/* Closed hole shine */}
                  {isClosed && (
                    <circle
                      cx={pos.cx - 4}
                      cy={pos.cy - 4}
                      r="3"
                      fill="rgba(255,255,255,0.18)"
                    />
                  )}
                </g>
              );
            })}

            {/* Current note label */}
            {currentNote && (
              <text
                x="150"
                y="450"
                textAnchor="middle"
                fontSize="18"
                fontWeight="bold"
                fill="#5a3010"
                fontFamily="Georgia, serif"
                opacity="0.85"
              >
                {currentNote}
              </text>
            )}
          </svg>
        </div>
      )}
    </div>
  );
};
