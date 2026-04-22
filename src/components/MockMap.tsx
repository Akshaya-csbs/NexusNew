import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { RoomStatus, CrisisEvent } from '../services/firebaseService';
import { cn } from '../lib/utils';
import { MapPin, Shield, AlertCircle } from 'lucide-react';

interface MockMapProps {
  rooms: RoomStatus[];
  crises: CrisisEvent[];
  className?: string;
  onRoomClick?: (roomNumber: string) => void;
  highlightRoom?: string;
}

const MockMap: React.FC<MockMapProps> = ({ rooms, crises, className, onRoomClick, highlightRoom }) => {
  // Generate a mock grid-based floor plan
  const grid = useMemo(() => {
    const layout = [];
    const cols = 8;
    const rows = 5;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Leave some gaps for hallways
        if (c === 3 || r === 2) continue;
        
        const floor = 4;
        const roomIdx = (r * cols + c).toString().padStart(2, '0');
        const roomNumber = `${floor}${roomIdx}`;
        
        layout.push({
          x: c * 100,
          y: r * 100,
          w: 90,
          h: 90,
          id: roomNumber
        });
      }
    }
    return layout;
  }, []);

  return (
    <div className={cn("relative bg-slate-50 rounded-3xl overflow-hidden border border-slate-200", className)}>
      <svg 
        viewBox="-20 -20 820 520" 
        className="w-full h-full drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Hallways / Background text */}
        <text x="315" y="250" className="fill-slate-200 font-headline font-black text-2xl uppercase tracking-[0.5em] rotate-90" textAnchor="middle">Main Hallway</text>
        <text x="400" y="215" className="fill-slate-200 font-headline font-black text-2xl uppercase tracking-[0.5em]" textAnchor="middle">Wing Connector</text>

        {/* Room Grid */}
        {grid.map((room) => {
          const roomData = rooms.find(r => r.roomNumber === room.id);
          const crisis = crises.find(c => c.roomNumber === room.id && c.status === 'active');
          const isHighlighted = highlightRoom === room.id;
          
          let statusColor = "fill-white stroke-slate-200";
          let textColor = "fill-slate-400";
          let animate = false;

          if (crisis) {
            statusColor = "fill-error/20 stroke-error";
            textColor = "fill-error";
            animate = true;
          } else if (roomData?.occupancyStatus === 'occupied') {
            statusColor = "fill-slate-900 stroke-slate-800";
            textColor = "fill-white";
          } else if (roomData?.occupancyStatus === 'evacuated') {
            statusColor = "fill-emerald-50/50 stroke-emerald-500";
            textColor = "fill-emerald-600";
          }

          if (isHighlighted) {
            statusColor = "fill-secondary/20 stroke-secondary stroke-[3px]";
          }

          return (
            <motion.g 
              key={room.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => onRoomClick?.(room.id)}
            >
              <rect 
                x={room.x} y={room.y} width={room.w} height={room.h} rx="12"
                className={cn("transition-colors duration-500", statusColor)}
              />
              
              {animate && (
                <motion.rect 
                  x={room.x - 5} y={room.y - 5} width={room.w + 10} height={room.h + 10} rx="16"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0, 0.5, 0], scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="fill-error/10 stroke-error/30 stroke-1 pointer-events-none"
                />
              )}

              <text 
                x={room.x + room.w / 2} 
                y={room.y + room.h / 2} 
                textAnchor="middle" 
                dominantBaseline="central"
                className={cn("font-headline font-black text-lg italic", textColor)}
              >
                {room.id}
              </text>

              {crisis && (
                <circle cx={room.x + room.w - 15} cy={room.y + 15} r="8" className="fill-error stroke-white stroke-2" />
              )}
            </motion.g>
          );
        })}

        {/* Legend Overlay in SVG space or just float it? Let's fix a floating UI instead */}
      </svg>

      {/* Floating Legend */}
      <div className="absolute bottom-6 left-6 p-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl space-y-2 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-error" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Active Alert</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-slate-900" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Occupied</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Evacuated</span>
        </div>
      </div>
    </div>
  );
};

export default MockMap;
