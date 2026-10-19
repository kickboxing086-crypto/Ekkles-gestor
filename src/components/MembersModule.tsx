import React, { useState } from 'react';
import { Member, GC, PipelineStage, Role } from '../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MessageCircle,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Plus,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';

interface MembersModuleProps {
  members: Member[];
  gcs: GC[];
  onAddMember: (newMember: Omit<Member, 'id'>) => void;
  onUpdateStage: (memberId: string, newStage: PipelineStage) => void;
  accountType?: 'pastor' | 'lider_gc';
  lockedGcId?: string;
  lockedGcName?: string;
}

export const MembersModule: React.FC<MembersModuleProps> = ({
  members,
  gcs,
  onAddMember,
  onUpdateStage,
  accountType = 'pastor',
  lockedGcId,
  lockedGcName,
}) => {
  const isLeader = accountType === 'lider_gc';
  const effectiveGcId = isLeader && lockedGcId ? lockedGcId : null;

  const [activeSubTab, setActiveSubTab] = useState<'lista' | 'pipeline'>('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGcFilter, setSelectedGcFilter] = useState(effectiveGcId || 'all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for new member
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newGcId, setNewGcId] = useState(effectiveGcId || gcs[0]?.id || '');
  const [newRole, setNewRole] = useState<Role>('membro');
  const [newNotes, setNewNotes] = useState('');

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);
    const targetGc = effectiveGcId || (selectedGcFilter === 'all' ? null : selectedGcFilter);
    const matchesGc = targetGc ? m.gcId === targetGc : true;
    return matchesSearch && matchesGc;
  });

  const pipelineStages: { id: PipelineStage; label: string; desc: string; count: number }[] = [
    {
      id: 'primeiro_contato',
      label: '1º Contato / Boas-Vindas',
      desc: 'Visitou no domingo ou na reunião do GC pela 1ª vez',
      count: members.filter((m) => m.pipelineStage === 'primeiro_contato').length,
    },
    {
      id: 'em_acompanhamento',
      label: 'Em Acompanhamento',
      desc: 'Recebendo visitas e orações da liderança',
      count: members.filter((m) => m.pipelineStage === 'em_acompanhamento').length,
    },
    {
      id: 'integrado',
      label: 'Integrado ao GC',
      desc: 'Participando ativamente das escalas e reuniões',
      count: members.filter((m) => m.pipelineStage === 'integrado').length,
    },
    {
      id: 'batizado',
      label: 'Discipulado & Liderança',
      desc: 'Pronto para curso de líderes ou batismo',
      count: members.filter((m) => m.pipelineStage === 'batizado').length,
    },
  ];

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    if (newName.trim().length < 10) {
      alert('O nome do membro deve ter no mínimo 10 caracteres (Nome e Sobrenome).');
      return;
    }

    const matchedGc = gcs.find((g) => g.id === newGcId);

    onAddMember({
      gcId: newGcId,
      gcName: matchedGc ? matchedGc.name : 'GC Alpha',
      name: newName,
      phone: newPhone,
      birthDate: newBirthDate || '1995-01-01',
      role: newRole,
      consecutiveAbsences: 0,
      needsFollowUp: false,
      pipelineStage: newRole === 'visitante' ? 'primeiro_contato' : 'integrado',
      notes: newNotes,
    });

    setNewName('');
    setNewPhone('');
    setNewBirthDate('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & SubTabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181B] border border-[#27272A] p-4 sm:p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-300" />
            Gestão de Membros & Consolidação Pastoral
          </h2>
          <p className="text-xs text-[#A1A1AA]">
            {isLeader
              ? `Exibindo membros do ${lockedGcName || 'seu GC'} (${filteredMembers.length} pessoas)`
              : `Total de ${members.length} membros e visitantes catalogados na rede`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Subtabs */}
          <div className="bg-[#09090B] p-1 rounded-xl border border-[#27272A] flex text-xs">
            <button
              onClick={() => setActiveSubTab('lista')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'lista'
                  ? 'bg-[#27272A] text-white shadow'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Lista Completa
            </button>
            <button
              onClick={() => setActiveSubTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'pipeline'
                  ? 'bg-[#27272A] text-white shadow'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              Pipeline de Visitantes
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all shadow active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Membro</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: LISTA COMPLETA DE MEMBROS */}
      {activeSubTab === 'lista' && (
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isLeader ? `Buscar no ${lockedGcName || 'seu GC'}...` : "Buscar por nome ou WhatsApp..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {isLeader ? (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{lockedGcName || 'Seu GC'}</span>
                </div>
              ) : (
                <>
                  <span className="text-xs text-[#A1A1AA]">Filtrar por GC:</span>
                  <select
                    value={selectedGcFilter}
                    onChange={(e) => setSelectedGcFilter(e.target.value)}
                    className="bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="all">Todos os GCs ({members.length})</option>
                    {gcs.map((gc) => (
                      <option key={gc.id} value={gc.id}>
                        {gc.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Mobile Card List (Visible on phones < 640px) */}
          <div className="space-y-2.5 sm:hidden">
            {filteredMembers.map((member) => {
              const isCritical = member.consecutiveAbsences >= 2;
              return (
                <div
                  key={member.id}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-[#27272A] space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {member.name}
                        </span>
                        {member.needsFollowUp && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 block mt-0.5">
                        {member.gcName}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 capitalize text-[10px] border border-zinc-700">
                      {member.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
                    <span className="text-zinc-400 font-mono text-[11px]">
                      {member.phone}
                    </span>

                    {member.consecutiveAbsences === 0 ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                        Assíduo
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                          isCritical
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {member.consecutiveAbsences} {member.consecutiveAbsences === 1 ? 'falta' : 'faltas'}
                      </span>
                    )}
                  </div>

                  {member.notes && (
                    <p className="text-[11px] text-zinc-400 italic bg-black/40 p-2 rounded-lg border border-zinc-800">
                      "{member.notes}"
                    </p>
                  )}

                  <button
                    onClick={() => {
                      const raw = member.phone.replace(/\D/g, '');
                      window.open(
                        `https://wa.me/${raw}?text=${encodeURIComponent(
                          `Graça e paz, ${member.name}! Aqui é a liderança do ${member.gcName}. Como você está?`
                        )}`,
                        '_blank'
                      );
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white transition-colors text-xs font-semibold"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Conversar no WhatsApp</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop Members Table (Hidden on small mobile screens) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#27272A] text-[#A1A1AA] uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-3 px-3">Membro</th>
                  <th className="py-3 px-3">Célula / GC</th>
                  <th className="py-3 px-3">WhatsApp</th>
                  <th className="py-3 px-3">Nascimento</th>
                  <th className="py-3 px-3">Função</th>
                  <th className="py-3 px-3">Frequência</th>
                  <th className="py-3 px-3 text-right">Ação Pastoral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/60">
                {filteredMembers.map((member) => {
                  const isCritical = member.consecutiveAbsences >= 2;
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-[#27272A]/40 transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white group-hover:text-zinc-100 flex items-center gap-2">
                          <span>{member.name}</span>
                          {member.needsFollowUp && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          )}
                        </div>
                        {member.notes && (
                          <span className="text-[10px] text-zinc-500 line-clamp-1">
                            {member.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#A1A1AA]">
                        {member.gcName}
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-mono">
                        {member.phone}
                      </td>
                      <td className="py-3 px-3 text-[#A1A1AA]">
                        {member.birthDate}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 capitalize text-[10px] border border-zinc-700">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {member.consecutiveAbsences === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                            Assíduo
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-medium ${
                              isCritical
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {member.consecutiveAbsences} {member.consecutiveAbsences === 1 ? 'falta' : 'faltas'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            const raw = member.phone.replace(/\D/g, '');
                            window.open(
                              `https://wa.me/${raw}?text=${encodeURIComponent(
                                `Graça e paz, ${member.name}! Aqui é a liderança do ${member.gcName}. Como você está?`
                              )}`,
                              '_blank'
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-300 transition-colors text-[11px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                          <span>WhatsApp</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PIPELINE DE VISITANTES / CONSOLIDAÇÃO */}
      {activeSubTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineStages.map((stage) => {
            const stageMembers = members.filter(
              (m) => (m.pipelineStage || 'primeiro_contato') === stage.id
            );

            return (
              <div
                key={stage.id}
                className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 flex flex-col justify-between min-h-[420px]"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        {stage.label}
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                        {stage.desc}
                      </p>
                    </div>
                    <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 text-xs font-mono font-bold flex items-center justify-center border border-zinc-700">
                      {stageMembers.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[320px] pr-1">
                    {stageMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 rounded-xl bg-zinc-900/80 border border-[#27272A] hover:border-zinc-500 transition-all text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-semibold text-white">
                            {member.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {member.gcName.split('-')[0]}
                          </span>
                        </div>

                        <div className="text-[11px] text-zinc-400">
                          {member.phone}
                        </div>

                        {member.notes && (
                          <p className="text-[10px] text-zinc-400 italic bg-black/40 p-1.5 rounded border border-zinc-800">
                            "{member.notes}"
                          </p>
                        )}

                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                          <button
                            onClick={() => {
                              const raw = member.phone.replace(/\D/g, '');
                              window.open(`https://wa.me/${raw}`, '_blank');
                            }}
                            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            Contatar
                          </button>

                          {/* Move to next stage button */}
                          {stage.id !== 'batizado' && (
                            <button
                              onClick={() => {
                                const nextIndex =
                                  pipelineStages.findIndex((s) => s.id === stage.id) + 1;
                                if (nextIndex < pipelineStages.length) {
                                  onUpdateStage(member.id, pipelineStages[nextIndex].id);
                                }
                              }}
                              className="text-[10px] text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded flex items-center gap-1"
                            >
                              <span>Avançar</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {stageMembers.length === 0 && (
                      <div className="text-center py-10 text-zinc-600 text-xs italic">
                        Nenhum visitante nesta etapa
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Adicionar Novo Membro */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#18181B] border border-[#3F3F46] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold font-mono">
                  Cadastro Pastoral
                </span>
                <h3 className="text-lg font-bold text-[#FAFAFA] mt-0.5">
                  Adicionar Membro ou Visitante
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#27272A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A1A1AA] block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="text-[#A1A1AA] block mb-1">WhatsApp com DDD *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Ex: +55 11 99999-8888"
                    className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[#A1A1AA] block mb-1">Célula / GC</label>
                  {isLeader ? (
                    <div className="w-full bg-zinc-900 border border-emerald-500/30 rounded-xl px-2.5 py-2 text-emerald-300 text-xs font-medium truncate">
                      {lockedGcName || 'Seu GC'} (Sua célula)
                    </div>
                  ) : (
                    <select
                      value={newGcId}
                      onChange={(e) => setNewGcId(e.target.value)}
                      className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-2.5 py-2 text-white focus:outline-none"
                    >
                      {gcs.map((gc) => (
                        <option key={gc.id} value={gc.id}>
                          {gc.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-[#A1A1AA] block mb-1">Função no GC</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-2.5 py-2 text-white focus:outline-none capitalize"
                  >
                    <option value="membro">Membro</option>
                    <option value="visitante">Visitante</option>
                    <option value="anfitriao">Anfitrião</option>
                    <option value="vice_lider">Vice-Líder</option>
                    <option value="lider">Líder de GC</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#A1A1AA] block mb-1">Data Nascimento</label>
                  <input
                    type="date"
                    value={newBirthDate}
                    onChange={(e) => setNewBirthDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#A1A1AA] block mb-1">Notas Pastorais / Acompanhamento</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Primeiro contato no culto de domingo; interessado em participar do louvor..."
                  className="w-full bg-zinc-900 border border-[#27272A] rounded-xl p-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A1A1AA] hover:text-white hover:bg-[#27272A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors"
                >
                  Cadastrar no Sistema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
