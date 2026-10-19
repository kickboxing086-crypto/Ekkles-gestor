import React, { useState } from 'react';
import { WEEKLY_FREQUENCY } from '../data/mockData';

export const FrequencyChart: React.FC = () => {
  const [activeSeries, setActiveSeries] = useState<'both' | 'members' | 'visitors'>('both');
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null);

  const maxVal = 40; // Max on Y-axis as shown in the mockup

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]">
            RESUMO DE FREQUÊNCIA RECENTE
          </h2>
          <p className="text-[11px] text-[#A1A1AA]">
            Comparativo presencial de Membros e Visitantes
          </p>
        </div>

        {/* Series filters */}
        <div className="flex items-center gap-1.5 bg-[#09090B] p-1 rounded-lg border border-[#27272A] text-[11px]">
          <button
            onClick={() => setActiveSeries('both')}
            className={`px-2 py-0.5 rounded transition-all ${
              activeSeries === 'both'
                ? 'bg-[#27272A] text-[#FAFAFA] font-medium'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveSeries('members')}
            className={`px-2 py-0.5 rounded transition-all ${
              activeSeries === 'members'
                ? 'bg-[#27272A] text-[#FAFAFA] font-medium'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
            }`}
          >
            Membros
          </button>
          <button
            onClick={() => setActiveSeries('visitors')}
            className={`px-2 py-0.5 rounded transition-all ${
              activeSeries === 'visitors'
                ? 'bg-[#27272A] text-[#FAFAFA] font-medium'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
            }`}
          >
            Visitantes
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative pt-2 pb-1">
        {/* Y Axis Guide Lines */}
        <div className="h-40 sm:h-44 flex flex-col justify-between relative pl-6 sm:pl-8 pr-1 sm:pr-2">
          {[40, 30, 20, 10, 0].map((val) => (
            <div key={val} className="flex items-center w-full relative">
              <span className="absolute -left-6 sm:-left-7 text-[9px] sm:text-[10px] text-[#71717A] font-mono">
                {val}
              </span>
              <div className="w-full border-b border-[#27272A]/80 border-dashed" />
            </div>
          ))}

          {/* Bar Columns Container */}
          <div className="absolute inset-x-6 sm:inset-x-8 bottom-0 top-2 flex items-end justify-between gap-1 sm:gap-4 px-1 sm:px-2">
            {WEEKLY_FREQUENCY.map((item) => {
              const memberHeight = (item.members / maxVal) * 100;
              const visitorHeight = (item.visitors / maxVal) * 100;
              const isHovered = hoveredWeek === item.week;

              return (
                <div
                  key={item.week}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setHoveredWeek(item.week)}
                  onMouseLeave={() => setHoveredWeek(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 bg-[#27272A] border border-[#3F3F46] rounded-lg px-2 py-1 text-[10px] sm:text-[11px] shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in duration-150">
                      <div className="font-semibold text-[#FAFAFA]">{item.week}</div>
                      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#A1A1AA]">
                        <span>Membros: <strong className="text-white">{item.members}</strong></span>
                        <span>Visitantes: <strong className="text-emerald-400">{item.visitors}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Paired Bars matching reference image */}
                  <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full max-w-[28px] sm:max-w-[36px]">
                    {/* Members Bar (Bright White/Platinum) */}
                    {(activeSeries === 'both' || activeSeries === 'members') && (
                      <div
                        style={{ height: `${memberHeight}%` }}
                        className={`w-full rounded-t-xs sm:rounded-t-sm transition-all duration-300 ${
                          isHovered ? 'bg-white' : 'bg-[#E4E4E7]'
                        }`}
                      />
                    )}

                    {/* Visitors Bar (Graphite/Medium Grey) */}
                    {(activeSeries === 'both' || activeSeries === 'visitors') && (
                      <div
                        style={{ height: `${visitorHeight}%` }}
                        className={`w-full rounded-t-xs sm:rounded-t-sm transition-all duration-300 ${
                          isHovered ? 'bg-[#71717A]' : 'bg-[#52525B]'
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X Axis Labels */}
        <div className="flex justify-between pl-6 sm:pl-8 pr-1 sm:pr-2 pt-2.5 text-[10px] sm:text-[11px] text-[#A1A1AA] border-t border-[#27272A]">
          {WEEKLY_FREQUENCY.map((item) => (
            <div key={item.week} className="flex-1 text-center font-medium">
              {item.week}
            </div>
          ))}
        </div>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2 text-[10px] sm:text-[11px] text-[#A1A1AA]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#E4E4E7]" />
          <span>Membros</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#52525B]" />
          <span>Visitantes</span>
        </div>
      </div>
    </div>
  );
};
