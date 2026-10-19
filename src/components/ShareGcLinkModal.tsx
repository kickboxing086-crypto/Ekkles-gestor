import React, { useState } from 'react';
import { GC, Scale } from '../types';
import { INITIAL_SCALES } from '../data/mockData';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  QrCode,
  X,
  Info,
  Calendar,
  MapPin,
  Sparkles,
  Users
} from 'lucide-react';

interface ShareGcLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  gcs: GC[];
  initialGcId?: string;
  onPreviewMemberPortal: (gcId: string) => void;
  accountType?: 'pastor' | 'lider_gc';
}

export const ShareGcLinkModal: React.FC<ShareGcLinkModalProps> = ({
  isOpen,
  onClose,
  gcs,
  initialGcId,
  onPreviewMemberPortal,
  accountType = 'pastor',
}) => {
  if (!isOpen) return null;

  const isLeader = accountType === 'lider_gc';
  const [selectedGcId, setSelectedGcId] = useState<string>(
    initialGcId || gcs[0]?.id || 'gc-1'
  );
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const selectedGc = gcs.find((g) => g.id === selectedGcId) || gcs[0];
  const scale = INITIAL_SCALES[selectedGc?.id || ''] || null;

  // Build the member link with URL parameter
  const shareableUrl = `${window.location.origin}${window.location.pathname}?portal_gc=${selectedGc?.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const scaleText = scale
      ? `\n🎵 Louvor: ${scale.louvor}\n📖 Palavra: ${scale.palavra}\n🥪 Lanche: ${scale.lanche}`
      : '';

    const text = encodeURIComponent(
      `👋 Graça e paz, família do *${selectedGc.name}*!\n\n` +
      `📅 *Próxima Reunião:* ${selectedGc.weekday} às ${selectedGc.time}\n` +
      `📍 *Local:* ${selectedGc.location} (${selectedGc.address})\n` +
      `✨ *Tema:* "${selectedGc.theme || 'Comunhão e Crescimento Espiritual'}"${scaleText}\n\n` +
      `🔗 *Acesse todas as informações e confirme sua presença pelo link exclusivo dos membros:*\n` +
      `${shareableUrl}\n\n` +
      `Esperamos você!`
    );

    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181B] border border-[#3F3F46] rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#27272A] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-semibold block">
                Comunicação Celular
              </span>
              <h2 className="text-base font-bold text-[#FAFAFA]">
                Enviar Link para Membros do GC
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* GC Selector */}
          <div>
            <label className="text-[#A1A1AA] block font-medium mb-1.5">
              {isLeader ? 'Sua Célula / GC' : 'Selecione a Célula / GC'}
            </label>
            {isLeader ? (
              <div className="w-full bg-zinc-900 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-emerald-300 font-semibold flex items-center justify-between">
                <span>{selectedGc.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono font-normal">Sua Célula</span>
              </div>
            ) : (
              <select
                value={selectedGcId}
                onChange={(e) => setSelectedGcId(e.target.value)}
                className="w-full bg-zinc-900 border border-[#27272A] rounded-xl px-3.5 py-2.5 text-[#FAFAFA] focus:outline-none focus:border-zinc-500 font-medium"
              >
                {gcs.map((gc) => (
                  <option key={gc.id} value={gc.id}>
                    {gc.name} ({gc.weekday} {gc.time})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick info preview banner */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-[#27272A] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">{selectedGc.name}</span>
              <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {selectedGc.weekday} • {selectedGc.time}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              📍 {selectedGc.location} — {selectedGc.address}
            </p>
            {selectedGc.theme && (
              <p className="text-[11px] text-zinc-300 italic pt-1 border-t border-zinc-800">
                ✨ Tema: "{selectedGc.theme}"
              </p>
            )}
          </div>

          {/* Shareable Link Box */}
          <div>
            <label className="text-[#A1A1AA] block font-medium mb-1.5 flex items-center justify-between">
              <span>Link Exclusivo para os Membros</span>
              <span className="text-[10px] text-zinc-500">Sem necessidade de senha</span>
            </label>
            <div className="flex items-center gap-2 bg-[#09090B] border border-[#27272A] rounded-xl p-1.5 pl-3">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="bg-transparent text-zinc-300 text-xs flex-1 truncate focus:outline-none font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-white font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* What members will see */}
          <div className="p-3 rounded-xl bg-[#27272A]/40 border border-[#27272A] space-y-1.5">
            <span className="text-[11px] font-semibold text-[#FAFAFA] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-400" />
              O que os membros terão acesso neste link?
            </span>
            <ul className="text-[11px] text-[#A1A1AA] space-y-1 list-disc list-inside">
              <li><strong>Local & Horário:</strong> Endereço exato com botão para abrir no Google Maps/Waze.</li>
              <li><strong>Escala Semanal:</strong> Quem está no Louvor, Palavra, Recepção e Lanche.</li>
              <li><strong>Tema do Estudo:</strong> Tópico bíblico ministrado na reunião.</li>
              <li><strong>Confirmação de Presença (RSVP):</strong> Membro confirma presença em 1 clique.</li>
              <li><strong>Pedidos de Oração:</strong> Envio de motivos de oração da semana.</li>
              <li><strong>Chave PIX da Célula:</strong> Para dízimos e ofertas voluntárias.</li>
            </ul>
          </div>

          {/* QR Code toggle */}
          {showQr && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center space-y-2 animate-in fade-in">
              <div className="w-36 h-36 bg-white p-2.5 rounded-xl flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path fill="#000" d="M0,0 h30 v30 h-30 z M40,0 h20 v10 h-20 z M70,0 h30 v30 h-30 z M0,40 h10 v20 h-10 z M20,40 h20 v20 h-20 z M50,30 h10 v20 h-10 z M70,40 h10 v30 h-10 z M90,40 h10 v10 h-10 z M0,70 h30 v30 h-30 z M40,70 h20 v10 h-20 z M70,80 h30 v20 h-30 z M10,10 h10 v10 h-10 z M80,10 h10 v10 h-10 z M10,80 h10 v10 h-10 z" />
                </svg>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                Aponte a câmera do celular para abrir
              </span>
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleSendWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar no Grupo de WhatsApp do GC</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowQr(!showQr)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium bg-[#27272A] hover:bg-[#3F3F46] text-white border border-[#3F3F46] transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-zinc-300" />
                <span>{showQr ? 'Ocultar QR Code' : 'Exibir QR Code'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onPreviewMemberPortal(selectedGc.id);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium bg-white text-black hover:bg-zinc-200 transition-colors font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Como Membro</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
