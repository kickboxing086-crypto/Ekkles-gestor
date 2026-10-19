import React, { useState } from 'react';
import { Member } from '../types';
import { AlertCircle, MessageCircle, CheckCircle, PhoneCall, HeartHandshake, X } from 'lucide-react';

interface PastoralCareProps {
  members: Member[];
  onMarkContacted?: (memberId: string) => void;
  accountType?: 'pastor' | 'lider_gc';
}

export const PastoralCare: React.FC<PastoralCareProps> = ({ members, onMarkContacted, accountType = 'pastor' }) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Filter members with consecutive absences >= 1, sorted by absences descending
  const urgentMembers = members
    .filter((m) => m.consecutiveAbsences >= 1)
    .sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences);

  const handleOpenWhatsApp = (member: Member) => {
    const rawNumber = member.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Graça e paz, ${member.name}! Aqui é da liderança do ${member.gcName}. Sentimos muito a sua falta nos últimos encontros de célula e gostaríamos de saber como você está e se podemos orar por algo especial em sua vida esta semana. Um abraço fraterno!`
    );
    window.open(`https://wa.me/${rawNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]">
              CUIDADO PASTORAL
            </h2>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-[#A1A1AA]">
            Membros que necessitam follow-up (2+ faltas)
          </p>
        </div>
        <span className="text-[10px] text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
          {urgentMembers.filter((m) => m.consecutiveAbsences >= 2).length} críticos
        </span>
      </div>

      {/* List matching reference image */}
      <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1">
        {urgentMembers.map((member) => {
          const isHighAlert = member.consecutiveAbsences >= 2;
          return (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="p-3 rounded-xl bg-[#27272A]/40 hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#FAFAFA] group-hover:text-white">
                    {member.name}
                  </span>
                  <span className="text-xs text-zinc-500 font-normal">
                    — {member.consecutiveAbsences} {member.consecutiveAbsences === 1 ? 'Falta' : 'Faltas'}
                  </span>
                </div>
                <div className="text-[11px] text-[#A1A1AA] flex items-center gap-2">
                  <span>{member.gcName}</span>
                  {member.lastAttendance && (
                    <>
                      <span>•</span>
                      <span className="text-zinc-500">Última: {member.lastAttendance}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border font-mono ${
                    isHighAlert
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {member.consecutiveAbsences} {member.consecutiveAbsences === 1 ? 'Falta' : 'Faltas'}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenWhatsApp(member);
                  }}
                  title="Enviar mensagem carinhosa no WhatsApp"
                  className="p-1.5 rounded-lg bg-[#18181B] text-[#A1A1AA] hover:text-emerald-400 border border-[#3F3F46] hover:border-emerald-500/50 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer trigger */}
      <div className="pt-3 border-t border-[#27272A]/80 mt-2 flex items-center justify-between text-[11px] text-[#A1A1AA]">
        <span>Monitoramento inteligente de retenção de membros</span>
        <span className="text-zinc-300 font-medium">Relatório Geral →</span>
      </div>

      {/* Follow-up Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#18181B] border border-[#3F3F46] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold font-mono">
                  Alerta Pastoral de Ausência
                </span>
                <h3 className="text-lg font-bold text-[#FAFAFA] mt-0.5">
                  {selectedMember.name}
                </h3>
                <p className="text-xs text-[#A1A1AA]">
                  {selectedMember.gcName} • Tel: {selectedMember.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#27272A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-[#27272A] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Faltas consecutivas:</span>
                <span className="font-semibold text-rose-400">{selectedMember.consecutiveAbsences} reuniões</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Último comparecimento:</span>
                <span className="text-white">{selectedMember.lastAttendance || 'Não registrado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Papel na célula:</span>
                <span className="text-white capitalize">{selectedMember.role}</span>
              </div>
              {selectedMember.notes && (
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-[#A1A1AA] block mb-1">Observação do Líder:</span>
                  <p className="text-zinc-300 italic">{selectedMember.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleOpenWhatsApp(selectedMember)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar no WhatsApp com Mensagem Pastoral</span>
              </button>

              <button
                onClick={() => {
                  if (onMarkContacted) onMarkContacted(selectedMember.id);
                  setSelectedMember(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] border border-[#3F3F46] transition-colors"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Marcar como "Contato Pastoral Realizado"</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
