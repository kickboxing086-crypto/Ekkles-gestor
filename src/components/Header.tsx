import React, { useState } from 'react';
import {
  Search,
  MessageSquare,
  Bell,
  ChevronDown,
  Plus,
  Calendar,
  Menu,
  Share2,
  Mail,
  KeyRound,
  Users,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { UserAccount } from '../types';

interface HeaderProps {
  onOpenNewMeeting: () => void;
  onOpenShareLink?: () => void;
  onOpenEmailNotice?: () => void;
  onOpenEditProfile?: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onToggleMobileMenu?: () => void;
  urgentAlertsCount: number;
  onSelectTab: (tab: string) => void;
  currentAccount: UserAccount;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewMeeting,
  onOpenShareLink,
  onOpenEmailNotice,
  onOpenEditProfile,
  onSearchChange,
  searchQuery,
  onToggleMobileMenu,
  urgentAlertsCount,
  onSelectTab,
  currentAccount,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-[#09090B]/90 backdrop-blur-xl border-b border-[#27272A] px-3 sm:px-8 flex items-center justify-between gap-2 sm:gap-4 transition-all">
      {/* Left Area: Mobile Toggle & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-[#A1A1AA] hover:text-[#FAFAFA] rounded-xl bg-[#18181B] border border-[#27272A] active:scale-95 shrink-0 transition-transform"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={`Buscar membros no ${currentAccount.gcName || 'meu GC'}...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#141416] border border-[#27272A] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
          />
        </div>
      </div>

      {/* Center: GC Leader Badge */}
      <div className="hidden lg:flex items-center justify-center">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold tracking-wide shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LÍDER DO GC: {currentAccount.gcName?.toUpperCase() || 'MINHA CÉLULA'}</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        
        {/* Email Notice Trigger (OAuth Gmail) */}
        {onOpenEmailNotice && (
          <button
            onClick={onOpenEmailNotice}
            title="Avisar membros por e-mail com código de presença"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-200 text-black shadow-sm transition-all active:scale-95"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Avisar por E-mail</span>
          </button>
        )}

        {/* Share Link button */}
        {onOpenShareLink && (
          <button
            onClick={onOpenShareLink}
            title="Enviar link aos membros do seu GC"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#18181B] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-[#27272A] transition-all active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Link do GC</span>
          </button>
        )}

        {/* Chamada / Nova Reunião button */}
        <button
          onClick={onOpenNewMeeting}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fazer Chamada</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            title="Alertas da Célula"
            className="relative p-2 sm:p-2.5 rounded-xl bg-[#141416] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46] transition-all active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {urgentAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                {urgentAlertsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[#18181B] border border-[#3F3F46] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <h3 className="text-xs font-bold text-[#FAFAFA] flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  Notificações do GC
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">Em tempo real</span>
              </div>

              <div className="py-2 space-y-2">
                {urgentAlertsCount > 0 ? (
                  <div
                    onClick={() => {
                      onSelectTab('discipulado');
                      setShowNotifications(false);
                    }}
                    className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer transition-colors"
                  >
                    <p className="text-rose-300 font-semibold text-xs flex items-center gap-1.5">
                      <span>⚠️</span> {urgentAlertsCount} membro(s) com faltas
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Abra o cuidado pastoral para enviar mensagem via WhatsApp.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 py-2 text-center">
                    Nenhuma pendência urgente no seu GC.
                  </p>
                )}

                <div
                  onClick={() => {
                    onSelectTab('gcs');
                    setShowNotifications(false);
                  }}
                  className="p-2.5 rounded-xl bg-[#27272A]/40 hover:bg-[#27272A] cursor-pointer transition-colors flex gap-2.5 items-start"
                >
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#FAFAFA] font-medium text-xs">Escala Semanal da Célula</p>
                    <p className="text-[11px] text-[#A1A1AA]">
                      {currentAccount.gcName || 'Seu GC'} com programação ativa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-[#18181B] border border-transparent hover:border-[#27272A] transition-all text-left active:scale-98"
          >
            <div className="relative">
              <img
                src={currentAccount.avatarUrl}
                alt={currentAccount.name}
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-zinc-700"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#09090B] bg-emerald-500" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-[#FAFAFA] leading-tight">
                {currentAccount.name}
              </div>
              <div className="text-[11px] text-[#A1A1AA] leading-none">
                Líder • {currentAccount.gcName || 'Meu GC'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA] hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-72 bg-[#18181B] border border-[#3F3F46] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profile Card */}
              <div className="p-3 bg-[#121214] border border-[#27272A] rounded-xl mb-2">
                <div className="flex items-center gap-3">
                  <img
                    src={currentAccount.avatarUrl}
                    alt={currentAccount.name}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-zinc-700"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-[#FAFAFA] truncate">{currentAccount.name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono truncate">{currentAccount.username}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      👤 Líder de GC
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Shortcuts */}
              <div className="py-1 space-y-1">
                {onOpenEditProfile && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenEditProfile();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-white hover:bg-[#27272A] rounded-xl transition-colors flex items-center justify-between font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Editar Meu Perfil & Senha</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">→</span>
                  </button>
                )}

                {onOpenEmailNotice && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenEmailNotice();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-white hover:bg-[#27272A] rounded-xl transition-colors flex items-center justify-between font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Avisar Reunião por E-mail</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">→</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onSelectTab('membros');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#FAFAFA] hover:bg-[#27272A] rounded-xl transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Membros do Meu GC</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">→</span>
                </button>
              </div>

              {/* Logout */}
              {onLogout && (
                <div className="pt-2 border-t border-[#27272A] mt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center justify-between font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da Conta (Logout)</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
