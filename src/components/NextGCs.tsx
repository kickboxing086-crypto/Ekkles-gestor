import React, { useState } from 'react';
import { GC, Scale } from '../types';
import { INITIAL_SCALES } from '../data/mockData';
import { MapPin, User, ChevronRight, Calendar, Sparkles, X, Coffee, BookOpen, Music, Home, Share2, Mail } from 'lucide-react';

interface NextGCsProps {
  gcs: GC[];
  onOpenMeetingForGC?: (gcId: string) => void;
  onShareLink?: (gcId: string) => void;
  onOpenEmailNotice?: (gcId: string) => void;
  accountType?: 'pastor' | 'lider_gc';
}

export const NextGCs: React.FC<NextGCsProps> = ({
  gcs,
  onOpenMeetingForGC,
  onShareLink,
  onOpenEmailNotice,
  accountType = 'lider_gc',
}) => {
  const isLeader = accountType === 'lider_gc';
  const [selectedGC, setSelectedGC] = useState<GC | null>(null);

  // If leader, use their single GC
  const leaderGC = isLeader ? (gcs[0] || null) : null;
  const leaderScale: Scale | null = leaderGC
    ? INITIAL_SCALES[leaderGC.id] || {
        id: `scale-${leaderGC.id}`,
        gcId: leaderGC.id,
        gcName: leaderGC.name,
        date: `${leaderGC.weekday} às ${leaderGC.time}`,
        anfitriao: leaderGC.hostName || 'A definir',
        louvor: 'Equipe de Louvor',
        palavra: leaderGC.leaderName,
        lanche: 'Comunitário',
        intercessao: 'Intercessores da Célula',
      }
    : null;

  const activeScale: Scale | null = selectedGC
    ? INITIAL_SCALES[selectedGC.id] || {
        id: `temp-${selectedGC.id}`,
        gcId: selectedGC.id,
        gcName: selectedGC.name,
        date: `${selectedGC.weekday} às ${selectedGC.time}`,
        anfitriao: selectedGC.hostName || 'A definir',
        louvor: 'Equipe de Louvor',
        palavra: selectedGC.leaderName,
        lanche: 'Membros do grupo (Comunitário)',
        intercessao: 'Intercessores da Célula',
      }
    : null;

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]">
            {isLeader ? 'SEU GC & PRÓXIMO ENCONTRO' : 'PRÓXIMOS GCs'}
          </h2>
          <p className="text-[11px] text-[#A1A1AA]">
            {isLeader ? 'Escala e programação do seu grupo' : 'Cronograma e escalas semanais das células'}
          </p>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
          isLeader
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-[#27272A] text-zinc-400 border-[#3F3F46]'
        }`}>
          {isLeader ? (leaderGC?.name || 'Seu GC') : `${gcs.length} grupos ativos`}
        </span>
      </div>

      {isLeader && leaderGC ? (
        /* Leader Single GC Detailed Card */
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{leaderGC.name}</span>
              <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                {leaderGC.weekday} • {leaderGC.time}
              </span>
            </div>

            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>{leaderGC.location} ({leaderGC.address})</span>
            </p>

            {/* Escala do Grupo */}
            {leaderScale && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-[11px]">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Home className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">Anfitrião: <strong className="text-white">{leaderScale.anfitriao}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Music className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">Louvor: <strong className="text-white">{leaderScale.louvor}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">Palavra: <strong className="text-white">{leaderScale.palavra}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Coffee className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">Lanche: <strong className="text-white">{leaderScale.lanche}</strong></span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => onOpenMeetingForGC && onOpenMeetingForGC(leaderGC.id)}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors shadow-sm text-center active:scale-98"
            >
              Fazer Chamada
            </button>
            {onOpenEmailNotice && (
              <button
                onClick={() => onOpenEmailNotice(leaderGC.id)}
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors flex items-center gap-1.5 active:scale-98"
                title="Avisar membros por e-mail com código de confirmação"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Avisar E-mail</span>
              </button>
            )}
            <button
              onClick={() => onShareLink && onShareLink(leaderGC.id)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center gap-1.5 active:scale-98"
              title="Link do Portal do Membro"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Link</span>
            </button>
          </div>
        </div>
      ) : (
        /* Pastor View: List of all GCs & Footer */
        <div className="flex flex-col flex-1 justify-between">
          <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1">
            {gcs.slice(0, 4).map((gc) => (
              <div
                key={gc.id}
                onClick={() => setSelectedGC(gc)}
                className="p-3 rounded-xl bg-[#27272A]/40 hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#FAFAFA] group-hover:text-white">
                      {gc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#A1A1AA]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-400" />
                      {gc.location}
                    </span>
                    <span>•</span>
                    <span className="text-zinc-400">
                      {gc.weekday} {gc.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onShareLink && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareLink(gc.id);
                      }}
                      title="Enviar link com informações aos membros"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600/30 text-zinc-400 hover:text-emerald-400 border border-zinc-700 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-[#FAFAFA] font-medium block">
                      {gc.leaderName}
                    </span>
                    <span className="text-[10px] text-[#A1A1AA]">
                      {gc.memberCount} membros
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#71717A] group-hover:text-[#FAFAFA] transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>

          {/* Footer trigger */}
          <div className="pt-3 border-t border-[#27272A]/80 mt-2 flex items-center justify-between text-[11px] text-[#A1A1AA]">
            <span>Clique para ver escala (louvor, palavra, lanche)</span>
            {onShareLink && (
              <button
                onClick={() => onShareLink(gcs[0]?.id || 'gc-1')}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                <span>Enviar Link</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal: Escala do GC */}
      {selectedGC && activeScale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#18181B] border border-[#3F3F46] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold font-mono">
                  Escala Semanal Oficial
                </span>
                <h3 className="text-lg font-bold text-[#FAFAFA] mt-0.5">
                  {selectedGC.name}
                </h3>
                <p className="text-xs text-[#A1A1AA]">
                  {selectedGC.location} • {selectedGC.address}
                </p>
              </div>
              <button
                onClick={() => setSelectedGC(null)}
                className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#27272A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#27272A]/50 border border-[#3F3F46]/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block">
                    Anfitrião / Recepção
                  </span>
                  <span className="text-sm font-semibold text-[#FAFAFA]">
                    {activeScale.anfitriao}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#27272A]/50 border border-[#3F3F46]/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block">
                    Ministração de Louvor
                  </span>
                  <span className="text-sm font-semibold text-[#FAFAFA]">
                    {activeScale.louvor}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#27272A]/50 border border-[#3F3F46]/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block">
                    Palavra / Estudo Bíblico
                  </span>
                  <span className="text-sm font-semibold text-[#FAFAFA]">
                    {activeScale.palavra}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#27272A]/50 border border-[#3F3F46]/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block">
                    Comunhão & Lanche
                  </span>
                  <span className="text-sm font-semibold text-[#FAFAFA]">
                    {activeScale.lanche}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-[#27272A] text-xs text-[#A1A1AA] flex items-center justify-between">
              <span>Data da Reunião: <strong className="text-white">{activeScale.date}</strong></span>
              <span className="text-emerald-400 font-medium">Confirmado</span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedGC(null)}
                className="px-3.5 py-2 rounded-xl text-xs text-[#A1A1AA] hover:text-white hover:bg-[#27272A]"
              >
                Fechar
              </button>
              {onShareLink && (
                <button
                  onClick={() => {
                    const id = selectedGC.id;
                    setSelectedGC(null);
                    onShareLink(id);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar Link aos Membros</span>
                </button>
              )}
              {onOpenMeetingForGC && (
                <button
                  onClick={() => {
                    const id = selectedGC.id;
                    setSelectedGC(null);
                    onOpenMeetingForGC(id);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors"
                >
                  Fazer Chamada
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
