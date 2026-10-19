import React, { useState } from 'react';
import { FINANCIAL_DATA } from '../data/mockData';
import { TrendingUp, DollarSign } from 'lucide-react';

export const FinancialSummary: React.FC = () => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const points = FINANCIAL_DATA.weeklyPoints;

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header matching mockup */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]">
            RESUMO FINANCEIRO (OFERTAS)
          </h2>
          <p className="text-[11px] text-[#A1A1AA]">
            Arrecadação voluntária das células no mês
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#27272A]/70 flex items-center justify-center text-[#A1A1AA]">
          <TrendingUp className="w-4 h-4 text-zinc-300" />
        </div>
      </div>

      {/* Numeric Highlights */}
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-2xl font-bold tracking-tight text-[#FAFAFA]">
            R$ {FINANCIAL_DATA.totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-[#A1A1AA] block mt-0.5">
            Média por célula: R$ {FINANCIAL_DATA.averagePerGC.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <span>+{FINANCIAL_DATA.growthPercentage}% vs mês ant.</span>
        </div>
      </div>

      {/* Smooth Curved SVG Area Chart matching the mockup */}
      <div className="relative h-28 w-full mt-2">
        <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="financialGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FAFAFA" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#A1A1AA" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#18181B" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path
            d="M 0 85 C 50 82, 80 50, 130 55 C 180 60, 220 85, 260 30 C 280 15, 290 8, 300 5 L 300 100 L 0 100 Z"
            fill="url(#financialGradient)"
          />

          {/* Spline Stroke */}
          <path
            d="M 0 85 C 50 82, 80 50, 130 55 C 180 60, 220 85, 260 30 C 280 15, 290 8, 300 5"
            fill="none"
            stroke="#FAFAFA"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Subtle Dots on key milestones */}
          <circle cx="0" cy="85" r="3" fill="#FAFAFA" />
          <circle cx="130" cy="55" r="3" fill="#FAFAFA" />
          <circle cx="260" cy="30" r="3" fill="#FAFAFA" />
          <circle cx="300" cy="5" r="3.5" fill="#FAFAFA" className="animate-pulse" />
        </svg>
      </div>

      {/* Footer labels */}
      <div className="flex justify-between items-center text-[10px] text-[#71717A] pt-2 border-t border-[#27272A]/80 font-mono">
        <span>Semana 1</span>
        <span>Semana 2</span>
        <span>Semana 3</span>
        <span>Semana 4</span>
        <span className="text-[#A1A1AA]">Semana 5 (Hoje)</span>
      </div>
    </div>
  );
};
