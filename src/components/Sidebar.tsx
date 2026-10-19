import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  HeartHandshake,
  BarChart3,
  Flame,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Plus,
  Mail,
  KeyRound,
} from 'lucide-react';
import { UserAccount } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  urgentAlertsCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenNewMeeting: () => void;
  onOpenShareLink: () => void;
  onOpenEmailNotice?: () => void;
  onOpenEditProfile?: () => void;
  currentAccount: UserAccount;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  urgentAlertsCount,
  mobileOpen,
  onCloseMobile,
  onOpenNewMeeting,
  onOpenShareLink,
  onOpenEmailNotice,
  onOpenEditProfile,
  currentAccount,
}) => {
  const menuItems = [
    { id: 'painel', label: 'Painel do Meu GC', icon: LayoutDashboard },
    { id: 'membros', label: 'Membros da Célula', icon: Users },
    { id: 'gcs', label: 'Escalas & Reunião', icon: CalendarCheck },
    { id: 'frequencia', label: 'Chamada do Encontro', icon: CalendarCheck },
    {
      id: 'discipulado',
      label: 'Cuidado Pastoral (GC)',
      icon: HeartHandshake,
      badge: urgentAlertsCount > 0 ? urgentAlertsCount : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    { id: 'relatorios', label: 'Relatórios do GC', icon: BarChart3 },
    { id: 'pedidos', label: 'Pedidos de Oração', icon: Flame },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-screen z-50 md:z-40 bg-[#09090B] border-r border-[#27272A] flex flex-col justify-between transition-all duration-300 ease-in-out ${
          mobileOpen
            ? 'translate-x-0 w-[280px] shadow-2xl'
            : '-translate-x-full md:translate-x-0'
        } ${
          collapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Top Branding with Black-and-White Church Logo */}
        <div>
          <div className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-5 border-b border-[#27272A]/80">
            <button
              onClick={() => {
                onSelectTab('painel');
                onCloseMobile();
              }}
              className="flex items-center gap-3 group text-left w-full overflow-hidden focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-black border border-zinc-300 flex items-center justify-center shadow-md shrink-0 transition-transform group-hover:scale-105">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L3 9v12h18V9l-9-7zm0 2.84L18.16 9H5.84L12 4.84zM5 19v-8h3v8H5zm5 0v-5h4v5h-4zm6 0v-8h3v8h-3z"/>
                </svg>
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="truncate">
                  <span className="text-sm font-semibold tracking-wide text-[#FAFAFA] block">
                    EKKLES
                  </span>
                  <span className="text-[10px] tracking-tight block truncate font-medium text-emerald-400">
                    {currentAccount.gcName || 'Líder de GC'}
                  </span>
                </div>
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 focus:outline-none"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Buttons */}
          {(!collapsed || mobileOpen) && (
            <div className="p-3 space-y-2 border-b border-[#27272A]/70">
              {onOpenEmailNotice && (
                <button
                  onClick={() => {
                    onOpenEmailNotice();
                    onCloseMobile();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                >
                  <Mail className="w-4 h-4" />
                  <span>Avisar por E-mail</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => {
                    onOpenNewMeeting();
                    onCloseMobile();
                  }}
                  className="py-1.5 px-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-zinc-200 border border-[#27272A] font-medium flex items-center justify-center gap-1 transition-colors text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chamada</span>
                </button>

                {onOpenEditProfile && (
                  <button
                    onClick={() => {
                      onOpenEditProfile();
                      onCloseMobile();
                    }}
                    className="py-1.5 px-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-zinc-200 border border-[#27272A] font-medium flex items-center justify-center gap-1 transition-colors text-[11px]"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Senha/Perfil</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-900 text-white border border-zinc-700/80 shadow-sm'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                  } ${collapsed && !mobileOpen ? 'justify-center px-0' : ''}`}
                  title={item.label}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-emerald-400' : 'text-[#71717A]'
                    }`}
                  />
                  {(!collapsed || mobileOpen) && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {(!collapsed || mobileOpen) && item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Summary & Collapse Toggle */}
        <div className="p-3 border-t border-[#27272A]/80">
          {(!collapsed || mobileOpen) && (
            <div className="p-3 rounded-2xl bg-[#141416] border border-[#27272A] flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={currentAccount.avatarUrl}
                  alt={currentAccount.name}
                  className="w-8 h-8 rounded-xl object-cover border border-zinc-700 shrink-0"
                />
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{currentAccount.name}</p>
                  <p className="text-[10px] text-emerald-400 truncate font-mono">{currentAccount.username}</p>
                </div>
              </div>
              {onOpenEditProfile && (
                <button
                  onClick={onOpenEditProfile}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                  title="Editar dados de acesso"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex w-full items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#18181B] transition-colors"
            title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
