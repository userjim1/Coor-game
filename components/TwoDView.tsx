import React from 'react';
import { LigandMap, LigandType } from '../types';

interface TwoDViewProps {
  ligands: LigandMap;
  onSlotClick: (id: number) => void;
}

const TwoDView: React.FC<TwoDViewProps> = ({ ligands, onSlotClick }) => {
  // SVG coordinates for a standard octahedral projection
  // Center is 150, 150
  const points = {
    2: { x: 150, y: 50, label: 'Top' },      // Top
    3: { x: 150, y: 250, label: 'Bottom' },   // Bottom
    1: { x: 60, y: 120, label: 'Left' },     // Left (-X)
    0: { x: 240, y: 180, label: 'Right' },    // Right (+X)
    5: { x: 90, y: 180, label: 'Back' },     // Back (-Z)
    4: { x: 210, y: 120, label: 'Front' },    // Front (+Z)
  };

  const getLigandColor = (type?: LigandType) => {
    if (type === 'NH3') return '#3B82F6';
    if (type === 'Cl') return '#10B981';
    return 'rgba(255, 255, 255, 0.1)';
  };

  const center = { x: 150, y: 150 };

  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/5 shadow-inner">
      <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
        {/* Bonds */}
        {Object.entries(points).map(([id, p]) => (
          <line
            key={`bond-${id}`}
            x1={center.x} y1={center.y}
            x2={p.x} y2={p.y}
            stroke="#64748B"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}

        {/* Central Metal */}
        <circle cx={center.x} cy={center.y} r="25" fill="#F8FAFC" className="shadow-lg" />
        <text x={center.x} y={center.y + 5} textAnchor="middle" fill="#0F172A" className="font-bold text-xs pointer-events-none">M</text>

        {/* Ligands */}
        {Object.entries(points).map(([idStr, p]) => {
          const id = parseInt(idStr);
          const type = ligands[id];
          const color = getLigandColor(type);
          
          return (
            <g key={`ligand-${id}`} className="cursor-pointer transition-transform hover:scale-110" onClick={() => onSlotClick(id)}>
              <circle
                cx={p.x}
                cy={p.y}
                r="18"
                fill={color}
                stroke="white"
                strokeWidth={type ? 2 : 1}
                strokeDasharray={type ? "0" : "4"}
                className="transition-all duration-300"
              />
              <text x={p.x} y={p.y + 5} textAnchor="middle" fill="white" className="font-bold text-[10px] pointer-events-none">
                {type || '?'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default TwoDView;