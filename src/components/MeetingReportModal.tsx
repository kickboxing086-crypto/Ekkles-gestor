import React, { useState } from 'react';
import { GC, Member } from '../types';
import { X, CheckCircle, Users, BookOpen, DollarSign, Calendar, Sparkles } from 'lucide-react';

interface MeetingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gcs: GC[];
  members: Member[];
  onSaveMeeting: (report: {
    gcId: string;
    topic: string;
    date: string;
    presentMemberIds: string[];
    visitorCount: number;
    visitorsNames: string[];
    offeringAmount: number;
    observations: string;
  }) => void;
  accountType?: 'pastor' | 'lider_gc';
  lockedGcId?: string;
  lockedGcName?: string;
}

export const MeetingReportModal: React.FC<MeetingReportModalProps> = ({
  isOpen,
  onClose,
  gcs,
  members,
  onSaveMeeting,
  accountType = 'pastor',
  lockedGcId,
  lockedGcName,
}) => {
  if (!isOpen) return null;

  const isLeader = accountType === 'lider_gc';
  const initialGcId = (isLeader && lockedGcId) ? lockedGcId : (gcs[0]?.id || '');
  const [selectedGcId, setSelectedGcId] = useState<string>(initialGcId);
  const [topic, setTopic] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [offering, setOffering] = useState('');
  const [observations, setObservations] = useState('');
  const [visitorNamesInput, setVisitorNamesInput] = useState('');

  // Filter members for selected GC
  const gcMembers = members.filter((m) => m.gcId === selectedGcId);
  const [attendance, setAttendance] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    gcMembers.forEach((m) => {
      init[m.id] = true; // default to present
    });
    return init;
  });

  const toggleMemberAttendance = (id: string) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const currentPresentCount = gcMembers.filter((m) => attendance[m.id]).length;
  const attendanceRate = gcMembers.length > 0 ? Math.round((currentPresentCount / gcMembers.length) * 100) : 0;

  const visitorsList = visitorNamesInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    if (topic.trim().length < 10) {
      alert('O tema/assunto do encontro deve ter no mínimo 10 caracteres.');
      return;
    }

    const presentMemberIds = Object.keys(attendance).filter((id) => attendance[id]);

    onSaveMeeting({
      gcId: selectedGcId,
      topic,
      date: meetingDate,
      presentMemberIds,
      visitorCount: visitorsList.length,
      visitorsNames: visitorsList,
      offeringAmount: parseFloat(offering) || 0,
      observations,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181B] border border-[#3F3F46] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#27272A] flex items-center justify-between bg-[#121214]">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-semibold block">
              Chamada Pastoral e Relatório
            </span>
            <h2 className="text-lg font-bold text-[#FAFAFA]">
              Registro da Reunião de Célula
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Row 1: Célula & Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[#A1A1AA] block font-medium mb-1.5">
                {isLeader ? 'Sua Célula / GC' : 'Selecione o GC'}
              </label>
              {isLeader ? (
                <div className="w-full bg-zinc-900 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-emerald-300 font-semibold flex items-center justify-between">
                  <span>{lockedGcName || 'Seu GC'}</span>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">GC Selecionado</span>
                </div>
              ) : (
                <select
                  value={selectedGcId}
                  onChange={(e) => {
                    setSelectedGcId(e.target.value);
                    // Reset attendance map for the new GC
                    const newMembers = members.filter((m) => m.gcId === e.target.value);
                    const newMap: Record<string, boolean> = {};
                    newMembers.forEach((m) => {
                      newMap[m.id] = true;
                    });
                    setAttendance(newMap);
                  }}
                  className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-3.5 py-2.5 text-[#FAFAFA] focus:outline-none focus:border-zinc-500 font-medium"
                >
                  {gcs.map((gc) => (
                    <option key={gc.id} value={gc.id}>
                      {gc.name} ({gc.weekday})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-[#A1A1AA] block font-medium mb-1.5">
                Data do Encontro
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-3.5 py-2.5 text-[#FAFAFA] focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Row 2: Tema da Palavra */}
          <div>
            <label className="text-[#A1A1AA] block font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                Tema da Palavra Ministrada *
              </span>
              <span className="text-[10px] text-zinc-500">Ex: Fruto do Espírito: Amor</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Digite o título do estudo ou passagem bíblica ministrada..."
              className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-3.5 py-2.5 text-[#FAFAFA] placeholder-zinc-600 focus:outline-none focus:border-zinc-500 text-sm"
            />
          </div>

          {/* Row 3: Lista de Chamada Interativa */}
          <div className="bg-zinc-900/60 border border-[#27272A] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#A1A1AA]" />
                <span className="text-xs font-semibold text-[#FAFAFA]">
                  Chamada Rápida dos Membros
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A1A1AA]">
                  Presentes: <strong className="text-white">{currentPresentCount}</strong> / {gcMembers.length}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {attendanceRate}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {gcMembers.map((member) => {
                const isPresent = attendance[member.id] ?? false;
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMemberAttendance(member.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between select-none ${
                      isPresent
                        ? 'bg-zinc-800/80 border-zinc-600 text-white'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className="truncate">
                      <p className={`text-xs font-medium truncate ${isPresent ? 'text-white' : 'text-zinc-500 line-through'}`}>
                        {member.name}
                      </p>
                      <span className="text-[10px] text-zinc-500 capitalize">{member.role}</span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all ${
                        isPresent
                          ? 'bg-emerald-500 text-black'
                          : 'border border-zinc-700 bg-zinc-800 text-transparent'
                      }`}
                    >
                      ✓
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 4: Visitantes e Oferta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[#A1A1AA] block font-medium mb-1.5">
                Visitantes (Nomes separados por vírgula)
              </label>
              <input
                type="text"
                value={visitorNamesInput}
                onChange={(e) => setVisitorNamesInput(e.target.value)}
                placeholder="Ex: Carlos Daniel, Bruna Santos"
                className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-3.5 py-2.5 text-[#FAFAFA] placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <span className="text-[10px] text-zinc-500 block mt-1">
                {visitorsList.length} visitante(s) detectado(s)
              </span>
            </div>

            <div>
              <label className="text-[#A1A1AA] block font-medium mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                Oferta Arrecadada (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={offering}
                onChange={(e) => setOffering(e.target.value)}
                placeholder="Ex: 120.00"
                className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-3.5 py-2.5 text-[#FAFAFA] placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
          </div>

          {/* Row 5: Observações pastorais */}
          <div>
            <label className="text-[#A1A1AA] block font-medium mb-1.5">
              Observações / Testemunhos da Reunião
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Tivemos 1 decisão por Cristo; comunhão excelente com 100% dos membros presentes."
              className="w-full bg-zinc-900 border border-[#27272A] rounded-xl p-3 text-[#FAFAFA] placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#27272A] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar e Salvar Reunião</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
