import React, { useRef, useEffect } from 'react';
import type { ScoreNote } from '../hooks/useScoreEditor';
import { getFingeringForPitch, STAFF_POSITIONS } from '../utils/fingeringMap';
import type { FingeringMap } from '../hooks/useFingeringMap';

interface SheetMusicProps {
  notes: ScoreNote[];
  selectedNoteIndex: number | null;
  currentPlayingIndex: number | null;
  onNoteSelect: (index: number) => void;
  onAddNoteAt?: (index: number) => void;
  fingeringMap?: FingeringMap;
}

const STAFF_TOP = 30;
const LINE_SPACING = 12;
const NOTE_X_START = 80;
const NOTE_X_SPACING = 72;
const NOTES_PER_ROW = 8;
const ROW_HEIGHT = 160;

// Staff line positions (5 lines)
const STAFF_LINE_Y = [
  STAFF_TOP,
  STAFF_TOP + LINE_SPACING,
  STAFF_TOP + LINE_SPACING * 2,
  STAFF_TOP + LINE_SPACING * 3,
  STAFF_TOP + LINE_SPACING * 4,
];

// Map pitch to Y position on staff
function getPitchY(pitch: string): number {
  const staffPos = STAFF_POSITIONS[pitch] ?? 0;
  const bottomLineY = STAFF_LINE_Y[4];
  const y = bottomLineY - (staffPos - 2) * (LINE_SPACING / 2);
  return y;
}

function getDurationLabel(durationMs: number): string {
  if (durationMs >= 1800) return 'W';
  if (durationMs >= 900) return 'H';
  if (durationMs >= 400) return 'Q';
  return 'E';
}

function isFilledNotehead(durationMs: number): boolean {
  return durationMs < 900;
}

export const SheetMusic: React.FC<SheetMusicProps> = ({
  notes,
  selectedNoteIndex,
  currentPlayingIndex,
  onNoteSelect,
  onAddNoteAt,
  fingeringMap,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentPlayingIndex !== null && scrollRef.current) {
      const row = Math.floor(currentPlayingIndex / NOTES_PER_ROW);
      scrollRef.current.scrollTop = row * ROW_HEIGHT - 20;
    }
  }, [currentPlayingIndex]);

  const rows = Math.max(1, Math.ceil(notes.length / NOTES_PER_ROW));
  const svgHeight = rows * ROW_HEIGHT + 20;
  const svgWidth = NOTE_X_START + NOTES_PER_ROW * NOTE_X_SPACING + 40;

  return (
    <div
      ref={scrollRef}
      className="overflow-auto scrollbar-thin bg-card rounded-lg border border-border shadow-parchment"
      style={{ maxHeight: '400px' }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="min-w-full"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        {/* Render each row */}
        {Array.from({ length: rows }).map((_, rowIdx) => {
          const rowY = rowIdx * ROW_HEIGHT + 10;
          const rowNotes = notes.slice(rowIdx * NOTES_PER_ROW, (rowIdx + 1) * NOTES_PER_ROW);

          return (
            <g key={rowIdx} transform={`translate(0, ${rowY})`}>
              {/* Staff lines */}
              {STAFF_LINE_Y.map((lineY, lineIdx) => (
                <line
                  key={lineIdx}
                  x1={20}
                  y1={lineY}
                  x2={svgWidth - 20}
                  y2={lineY}
                  stroke="#8b6340"
                  strokeWidth={1}
                  opacity={0.6}
                />
              ))}

              {/* Treble clef symbol */}
              <text
                x={22}
                y={STAFF_TOP + LINE_SPACING * 3.5}
                fontSize={52}
                fill="#5a3a1a"
                opacity={0.8}
                fontFamily="serif"
              >
                𝄞
              </text>

              {/* Notes */}
              {rowNotes.map((note, noteIdx) => {
                const globalIdx = rowIdx * NOTES_PER_ROW + noteIdx;
                const x = NOTE_X_START + noteIdx * NOTE_X_SPACING;
                const noteY = getPitchY(note.pitch);
                const durationMs = Number(note.duration);
                const filled = isFilledNotehead(durationMs);
                const isSelected = selectedNoteIndex === globalIdx;
                const isPlaying = currentPlayingIndex === globalIdx;

                // Use custom fingering map if provided, otherwise fall back to static defaults
                const fingering = fingeringMap
                  ? (fingeringMap[note.pitch] ?? getFingeringForPitch(note.pitch))
                  : getFingeringForPitch(note.pitch);

                return (
                  <g
                    key={globalIdx}
                    onClick={() => onNoteSelect(globalIdx)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Selection/playing highlight */}
                    {(isSelected || isPlaying) && (
                      <rect
                        x={x - 16}
                        y={STAFF_TOP - 8}
                        width={32}
                        height={STAFF_LINE_Y[4] - STAFF_TOP + 16}
                        rx={4}
                        fill={isPlaying ? '#c8613a' : '#8b6340'}
                        opacity={0.15}
                      />
                    )}

                    {/* Ledger line for C5 (below staff) */}
                    {note.pitch === 'C5' && (
                      <line
                        x1={x - 14}
                        y1={noteY}
                        x2={x + 14}
                        y2={noteY}
                        stroke="#8b6340"
                        strokeWidth={1}
                        opacity={0.7}
                      />
                    )}

                    {/* Stem */}
                    {durationMs < 2000 && (
                      <line
                        x1={x + 9}
                        y1={noteY}
                        x2={x + 9}
                        y2={noteY - 28}
                        stroke={isPlaying ? '#c8613a' : '#3d2b1f'}
                        strokeWidth={1.5}
                      />
                    )}

                    {/* Eighth note flag */}
                    {durationMs < 400 && (
                      <path
                        d={`M ${x + 9} ${noteY - 28} Q ${x + 22} ${noteY - 20} ${x + 18} ${noteY - 12}`}
                        stroke={isPlaying ? '#c8613a' : '#3d2b1f'}
                        strokeWidth={1.5}
                        fill="none"
                      />
                    )}

                    {/* Notehead */}
                    <ellipse
                      cx={x}
                      cy={noteY}
                      rx={9}
                      ry={7}
                      fill={filled ? (isPlaying ? '#c8613a' : '#3d2b1f') : 'none'}
                      stroke={isPlaying ? '#c8613a' : '#3d2b1f'}
                      strokeWidth={1.5}
                      transform={`rotate(-15, ${x}, ${noteY})`}
                    />

                    {/* Duration label (small) */}
                    <text
                      x={x}
                      y={STAFF_TOP - 12}
                      textAnchor="middle"
                      fontSize={8}
                      fill="#8b6340"
                      opacity={0.7}
                    >
                      {getDurationLabel(durationMs)}
                    </text>

                    {/* Pitch label */}
                    <text
                      x={x}
                      y={STAFF_LINE_Y[4] + 16}
                      textAnchor="middle"
                      fontSize={9}
                      fill={isPlaying ? '#c8613a' : '#5a3a1a'}
                      fontWeight={isPlaying ? 'bold' : 'normal'}
                    >
                      {note.pitch.replace('5', '').replace('6', "'")}
                    </text>

                    {/* Tablature diagram - use SVG directly, no foreignObject/HTML needed */}
                    <g transform={`translate(${x - 12}, ${STAFF_LINE_Y[4] + 22})`}>
                      <TablatureDiagramSVG fingering={fingering} size={24} />
                    </g>

                    {/* Lyrics */}
                    {note.lyrics && (
                      <text
                        x={x}
                        y={STAFF_LINE_Y[4] + 58}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#5a3a1a"
                        fontStyle="italic"
                      >
                        {note.lyrics.slice(0, 6)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Add note button at end of row */}
              {rowIdx === rows - 1 && onAddNoteAt && (
                <g
                  onClick={() => onAddNoteAt(notes.length)}
                  style={{ cursor: 'pointer' }}
                  opacity={0.4}
                >
                  <circle
                    cx={NOTE_X_START + rowNotes.length * NOTE_X_SPACING}
                    cy={STAFF_TOP + LINE_SPACING * 2}
                    r={10}
                    fill="none"
                    stroke="#8b6340"
                    strokeWidth={1.5}
                    strokeDasharray="3,2"
                  />
                  <text
                    x={NOTE_X_START + rowNotes.length * NOTE_X_SPACING}
                    y={STAFF_TOP + LINE_SPACING * 2 + 4}
                    textAnchor="middle"
                    fontSize={14}
                    fill="#8b6340"
                  >
                    +
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Empty state */}
        {notes.length === 0 && (
          <g>
            {STAFF_LINE_Y.map((lineY, lineIdx) => (
              <line
                key={lineIdx}
                x1={20}
                y1={lineY + 10}
                x2={svgWidth - 20}
                y2={lineY + 10}
                stroke="#8b6340"
                strokeWidth={1}
                opacity={0.4}
              />
            ))}
            <text
              x={svgWidth / 2}
              y={STAFF_TOP + LINE_SPACING * 2 + 10}
              textAnchor="middle"
              fontSize={13}
              fill="#8b6340"
              opacity={0.6}
              fontFamily="'Playfair Display', serif"
              fontStyle="italic"
            >
              Click piano keys or load a preset song to begin
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// Inline SVG-native tablature diagram (no foreignObject/HTML needed)
interface TablatureDiagramSVGProps {
  fingering: [boolean, boolean, boolean, boolean];
  size: number;
}

const TablatureDiagramSVG: React.FC<TablatureDiagramSVGProps> = ({ fingering, size }) => {
  const holeR = size * 0.17;
  const gap = size * 0.08;
  const center = size / 2;
  const offset = holeR + gap / 2;
  const bodyR = center - size * 0.08;

  const positions = [
    { x: center - offset, y: center - offset },
    { x: center + offset, y: center - offset },
    { x: center - offset, y: center + offset },
    { x: center + offset, y: center + offset },
  ];

  return (
    <>
      <ellipse
        cx={center}
        cy={center}
        rx={bodyR}
        ry={bodyR}
        fill="#c8a96e"
        stroke="#8b6340"
        strokeWidth={1}
      />
      {positions.map((pos, i) => (
        <circle
          key={i}
          cx={pos.x}
          cy={pos.y}
          r={holeR}
          fill={fingering[i] ? '#3d2b1f' : 'none'}
          stroke="#3d2b1f"
          strokeWidth={1}
        />
      ))}
    </>
  );
};
