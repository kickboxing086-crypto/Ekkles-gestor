import React from 'react';
import { Users, UserPlus, Network, TrendingUp } from 'lucide-react';

interface KPICardsProps {
  totalMembers: number;
  averageAttendance: number;
  activeGCs: number;
  monthVisitors: number;
  onFilterClick?: (filter: string) => void;
  accountType?: 'pastor' | 'lider_gc';
  gcName?: string;
}

export const KPICards: React.FC<KPICardsProps> = ({
  totalMembers,
  averageAttendance,
  activeGCs,
  monthVisitors,
  onFilterClick,
  accountType = 'pastor',
  gcName,
}) => {
  const isLeader = accountType === 'lider_gc';
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. TOTAL MEMBROS */}
      <div
        onClick={() => onFilterClick && onFilterClick('membros')}
        className="bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] rounded-xl p-3.5 sm:p-5 transition-all shadow-sm group cursor-pointer active:scale-98"
      >
        <div className="flex items-center justify-between text-[#A1A1AA] mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">
            {isLeader ? 'MEMBROS DO GC' : 'TOTAL MEMBROS'}
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#27272A]/70 flex items-center justify-center text-[#A1A1AA] group-hover:text-[#FAFAFA] transition-colors shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between flex-wrap gap-1">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            {totalMembers}
          </span>
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            <span>{isLeader ? 'Seu Grupo' : '+12% Rede'}</span>
          </div>
        </div>
      </div>

      {/* 2. MÉDIA PRESENÇA SEMANAL com Mini Sparkline */}
      <div
        onClick={() => onFilterClick && onFilterClick('frequencia')}
        className="bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] rounded-xl p-3.5 sm:p-5 transition-all shadow-sm group cursor-pointer active:scale-98"
      >
        <div className="flex items-center justify-between text-[#A1A1AA] mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">
            {isLeader ? 'PRESENÇA DO GC' : 'MÉDIA PRESENÇA'}
          </span>
          <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono hidden xs:inline">
            {isLeader ? 'Últimos encontros' : '6 sem.'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            {averageAttendance.toFixed(1).replace('.', ',')}%
          </span>
          {/* Mini Sparkline Wave matching the mockup */}
          <div className="w-16 sm:w-24 h-7 sm:h-9">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="sparklineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 32 Q 25 35 45 18 T 85 8 T 100 12 L 100 40 L 0 40 Z"
                fill="url(#sparklineGrad)"
              />
              <path
                d="M 0 32 Q 25 35 45 18 T 85 8 T 100 12"
                fill="none"
                stroke="#FAFAFA"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. GRUPOS ATIVOS */}
      <div
        onClick={() => onFilterClick && onFilterClick('gcs')}
        className="bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] rounded-xl p-3.5 sm:p-5 transition-all shadow-sm group cursor-pointer active:scale-98"
      >
        <div className="flex items-center justify-between text-[#A1A1AA] mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">
            {isLeader ? 'MEU GC' : 'GRUPOS ATIVOS'}
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#27272A]/70 flex items-center justify-center text-[#A1A1AA] group-hover:text-[#FAFAFA] transition-colors shrink-0">
            <Network className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between flex-wrap gap-1">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            {activeGCs}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded-full border border-zinc-700">
            {isLeader ? (gcName || 'Ativo') : '2 em plantio'}
          </span>
        </div>
      </div>

      {/* 4. VISITANTES DO MÊS */}
      <div
        onClick={() => onFilterClick && onFilterClick('membros')}
        className="bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] rounded-xl p-3.5 sm:p-5 transition-all shadow-sm group cursor-pointer active:scale-98"
      >
        <div className="flex items-center justify-between text-[#A1A1AA] mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">
            {isLeader ? 'VISITANTES GC' : 'VISITANTES MÊS'}
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#27272A]/70 flex items-center justify-center text-[#A1A1AA] group-hover:text-[#FAFAFA] transition-colors shrink-0">
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between flex-wrap gap-1">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
            {monthVisitors}
          </span>
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            <span>{isLeader ? 'Novos contatos' : '+18 novos'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
