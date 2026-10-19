import React from 'react';
import {
  LayoutDashboard,
  Users,
  Plus,
  Share2,
  Menu,
  HeartHandshake
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewMeeting: () => void;
  onOpenShareLink: () => void;
  onOpenMobileMenu: () => void;
  urgentAlertsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewMeeting,
  onOpenShareLink,
  onOpenMobileMenu,
  urgentAlertsCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#121214]/95 backdrop-blur-lg border-t border-[#27272A] px-2 py-1.5 pb-safe flex items-center justify-around shadow-2xl">
      {/* 1. Painel */}
      <button
        onClick={() => onSelectTab('painel')}
        className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all active:scale-95 ${
          currentTab === 'painel'
            ? 'text-white'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <div
          className={`p-1 rounded-lg ${
            currentTab === 'painel' ? 'bg-zinc-800 text-white' : ''
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-medium mt-0.5">Painel</span>
      </button>

      {/* 2. Membros */}
      <button
        onClick={() => onSelectTab('membros')}
        className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all active:scale-95 ${
          currentTab === 'membros'
            ? 'text-white'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <div
          className={`p-1 rounded-lg ${
            currentTab === 'membros' ? 'bg-zinc-800 text-white' : ''
          }`}
        >
          <Users className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-medium mt-0.5">Membros</span>
      </button>

      {/* 3. Center Highlight: + Chamada Rápida */}
      <button
        onClick={onOpenNewMeeting}
        className="flex flex-col items-center justify-center -mt-5 group focus:outline-none"
      >
        <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 group-active:scale-90 transition-transform border-4 border-[#09090B]">
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </div>
        <span className="text-[10px] font-semibold text-white mt-0.5">Chamada</span>
      </button>

      {/* 4. Link do Membro */}
      <button
        onClick={onOpenShareLink}
        className="flex flex-col items-center justify-center w-14 py-1 rounded-xl text-zinc-500 hover:text-emerald-400 transition-all active:scale-95"
      >
        <div className="p-1 rounded-lg text-emerald-400">
          <Share2 className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-medium text-emerald-400 mt-0.5">Link GC</span>
      </button>

      {/* 5. Menu / Mais */}
      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center w-14 py-1 rounded-xl text-zinc-500 hover:text-white transition-all active:scale-95 relative"
      >
        <div className="p-1 rounded-lg">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-medium mt-0.5">Mais</span>

        {urgentAlertsCount > 0 && (
          <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        )}
      </button>
    </nav>
  );
};
