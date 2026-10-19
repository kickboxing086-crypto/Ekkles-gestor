import React, { useState } from 'react';
import { PrayerRequest } from '../types';
import { Users, Flame, Plus, Check, Heart, X } from 'lucide-react';

interface ActivePrayersProps {
  prayers: PrayerRequest[];
  onTogglePray: (id: string) => void;
  onAddPrayer: (newPrayer: Omit<PrayerRequest, 'id' | 'prayingCount' | 'isAnswered' | 'userPrayed'>) => void;
}

export const ActivePrayers: React.FC<ActivePrayersProps> = ({
  prayers,
  onTogglePray,
  onAddPrayer,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [requestText, setRequestText] = useState('');
  const [gcName, setGcName] = useState('GC Alpha');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !requestText.trim()) return;
    if (requestText.trim().length < 10) {
      alert('O pedido de oração deve ter no mínimo 10 caracteres.');
      return;
    }

    onAddPrayer({
      authorName,
      gcName,
      request: requestText,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    });

    setAuthorName('');
    setRequestText('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header matching mockup */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]">
            PEDIDOS DE ORAÇÃO ATIVOS
          </h2>
          <p className="text-[11px] text-[#A1A1AA]">
            Clamor e intercessão comunitária das células
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] border border-[#3F3F46] transition-colors"
            title="Adicionar Pedido de Oração"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-[#27272A]/70 flex items-center justify-center text-[#A1A1AA]">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* List matching mockup layout */}
      <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1">
        {prayers.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl bg-[#27272A]/40 hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] transition-all flex items-center justify-between group"
          >
            <div className="space-y-0.5 flex-1 pr-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#FAFAFA] group-hover:text-white">
                  {item.authorName}
                </span>
                {item.isAnswered && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    Atendido
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A1A1AA] line-clamp-1">
                {item.request}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-zinc-500 font-mono">
                {item.date}
              </span>

              {/* Intercession button */}
              <button
                onClick={() => onTogglePray(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  item.userPrayed
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#3F3F46]'
                }`}
                title="Estou orando por este pedido"
              >
                <Flame className={`w-3.5 h-3.5 ${item.userPrayed ? 'text-rose-400 fill-rose-400' : ''}`} />
                <span>{item.prayingCount}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer trigger */}
      <div className="pt-3 border-t border-[#27272A]/80 mt-2 flex items-center justify-between text-[11px] text-[#A1A1AA]">
        <span>Total de {prayers.length} motivos na intercessão geral</span>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-zinc-300 font-medium hover:text-white"
        >
          + Novo Pedido
        </button>
      </div>

      {/* Modal: Adicionar Pedido */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#18181B] border border-[#3F3F46] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold font-mono">
                  Cadastrar Intercessão
                </span>
                <h3 className="text-lg font-bold text-[#FAFAFA] mt-0.5">
                  Novo Pedido de Oração
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#27272A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#A1A1AA] block mb-1">Nome do Solicitante / Membro</label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex: Pr. Marcos Silva ou Mariana"
                  className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="text-[#A1A1AA] block mb-1">Célula / GC</label>
                <select
                  value={gcName}
                  onChange={(e) => setGcName(e.target.value)}
                  className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-zinc-500"
                >
                  <option value="GC Alpha - Casa de Ana">GC Alpha - Casa de Ana</option>
                  <option value="GC Betel - Sala 3">GC Betel - Sala 3</option>
                  <option value="GC Conexão Jovem">GC Conexão Jovem</option>
                  <option value="Geral (Toda a Igreja)">Geral (Toda a Igreja)</option>
                </select>
              </div>

              <div>
                <label className="text-[#A1A1AA] block mb-1">Motivo de Oração</label>
                <textarea
                  required
                  rows={3}
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="Descreva o motivo de oração (saúde, família, salvação de parentes, trabalho)..."
                  className="w-full bg-zinc-900 border border-[#27272A] rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A1A1AA] hover:text-white hover:bg-[#27272A]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors"
                >
                  Salvar Pedido de Oração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
