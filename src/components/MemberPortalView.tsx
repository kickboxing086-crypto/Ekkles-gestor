import React, { useState } from 'react';
import { GC, Scale, PrayerRequest } from '../types';
import { INITIAL_SCALES } from '../data/mockData';
import {
  Church,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Copy,
  Check,
  CheckCircle2,
  Users,
  Flame,
  BookOpen,
  Music,
  Coffee,
  Home,
  Heart,
  MessageCircle,
  DollarSign,
  ArrowLeft,
  Sparkles,
  Share2,
  Send
} from 'lucide-react';

interface MemberPortalViewProps {
  gc: GC;
  onBackToAdmin: () => void;
  prayers: PrayerRequest[];
  onAddPrayer: (newPrayer: Omit<PrayerRequest, 'id' | 'prayingCount' | 'isAnswered' | 'userPrayed'>) => void;
  onTogglePray: (prayerId: string) => void;
}

export const MemberPortalView: React.FC<MemberPortalViewProps> = ({
  gc,
  onBackToAdmin,
  prayers,
  onAddPrayer,
  onTogglePray,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [hasConfirmedRsvp, setHasConfirmedRsvp] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(gc.rsvpCount || 16);

  // Prayer form
  const [memberName, setMemberName] = useState('');
  const [prayerText, setPrayerText] = useState('');
  const [prayerSent, setPrayerSent] = useState(false);

  const scale: Scale = INITIAL_SCALES[gc.id] || {
    id: `scale-${gc.id}`,
    gcId: gc.id,
    gcName: gc.name,
    date: `${gc.weekday} às ${gc.time}`,
    anfitriao: gc.hostName || 'Carlos & Ana',
    louvor: 'Gabriel Lima & Violão',
    palavra: gc.leaderName,
    lanche: 'Comunitário (Traga um prato doce ou salgado)',
    intercessao: 'Equipe de Intercessão',
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${gc.location} - ${gc.address}`);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  const handleCopyPix = () => {
    const pix = gc.pixKey || 'pix.gc@igreja.com.br';
    navigator.clipboard.writeText(pix);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleRsvp = () => {
    if (!hasConfirmedRsvp) {
      setHasConfirmedRsvp(true);
      setRsvpCount((prev) => prev + 1);
    } else {
      setHasConfirmedRsvp(false);
      setRsvpCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleSendPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !prayerText.trim()) return;

    onAddPrayer({
      authorName: memberName,
      gcName: gc.name,
      request: prayerText,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    });

    setPrayerSent(true);
    setMemberName('');
    setPrayerText('');
    setTimeout(() => setPrayerSent(false), 4000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${gc.address}`
  )}`;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans pb-16">
      {/* Top Admin Return Bar */}
      <div className="bg-[#18181B] border-b border-[#27272A] px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-40">
        <button
          onClick={onBackToAdmin}
          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Voltar ao Painel do Líder</span>
        </button>

        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Visualização do Membro
        </span>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Church & GC Hero Header */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 text-center space-y-3 relative overflow-hidden shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#27272A] border border-[#3F3F46] mx-auto flex items-center justify-center text-white shadow-md">
            <Church className="w-7 h-7 text-white" />
          </div>

          <div>
            <span className="text-[11px] uppercase font-mono tracking-widest text-emerald-400 font-semibold">
              Portal da Célula
            </span>
            <h1 className="text-2xl font-bold text-white mt-0.5">
              {gc.name}
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Liderança: <strong className="text-zinc-200">{gc.leaderName}</strong> • {gc.weekday}s às {gc.time}
            </p>
          </div>

          {/* Key Verse Banner */}
          {gc.verse && (
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs italic text-zinc-300 leading-relaxed">
              {gc.verse}
            </div>
          )}
        </div>

        {/* CARD 1: INFORMAÇÕES DA PRÓXIMA REUNIÃO */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Próximo Encontro
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
              Reunião Confirmada
            </span>
          </div>

          {/* Time & Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Dia do Encontro
                </span>
                <span className="text-sm font-semibold text-white">
                  {gc.weekday}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Horário de Início
                </span>
                <span className="text-sm font-semibold text-white">
                  {gc.time} pontual
                </span>
              </div>
            </div>
          </div>

          {/* Location & Navigation */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-800 text-emerald-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Localização / Recepção
                </span>
                <p className="text-sm font-bold text-white">{gc.location}</p>
                <p className="text-zinc-300">{gc.address}</p>
                <p className="text-[11px] text-zinc-500">
                  Anfitrião responsável: <span className="text-zinc-300 font-medium">{gc.hostName}</span>
                </p>
              </div>
            </div>

            {/* Address Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={handleCopyAddress}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-white font-medium transition-colors"
              >
                {copiedAddress ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-xs">Endereço Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-300" />
                    <span className="text-xs">Copiar Endereço</span>
                  </>
                )}
              </button>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold transition-colors text-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Abrir no GPS / Maps</span>
              </a>
            </div>
          </div>

          {/* RSVP Confirmation */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Você vai estar presente neste encontro?
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {rsvpCount} irmãos já confirmaram presença para organização do lanche e espaço.
              </p>
            </div>

            <button
              onClick={handleRsvp}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all shrink-0 active:scale-95 text-xs ${
                hasConfirmedRsvp
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {hasConfirmedRsvp ? '✓ Presença Confirmada!' : 'Confirmar Presença'}
            </button>
          </div>
        </div>

        {/* CARD 2: ESCALA SEMANAL DA CÉLULA */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Escala da Semana
              </h2>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              Equipe do Encontro
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-amber-400">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Anfitrião / Recepção</span>
                <span className="font-semibold text-white">{scale.anfitriao}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-purple-400">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Louvor & Adoração</span>
                <span className="font-semibold text-white">{scale.louvor}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-emerald-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Palavra & Estudo</span>
                <span className="font-semibold text-white">{scale.palavra}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-rose-400">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Comunhão & Lanche</span>
                <span className="font-semibold text-white">{scale.lanche}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: TEMA DO ESTUDO DA SEMANA */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#27272A] pb-3">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Tema do Estudo
            </h2>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h3 className="text-base font-bold text-white">
              "{gc.theme || 'Andando no Espírito e Vivendo em Comunhão'}"
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Traga sua Bíblia e um coração aberto para compartilhar o que Deus tem falado com você ao longo dos dias. Teremos tempo de oração em duplas e aplicação prática.
            </p>
          </div>
        </div>

        {/* CARD 4: MURAL DE ORAÇÃO & ENVIO DIRETO */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Intercessão & Oração
              </h2>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              Oração em Família
            </span>
          </div>

          {/* Form to submit prayer request */}
          <form onSubmit={handleSendPrayer} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Pedir Oração para a Célula:</span>
              {prayerSent && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Pedido enviado à liderança!
                </span>
              )}
            </div>

            <input
              type="text"
              required
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Seu nome..."
              className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />

            <textarea
              required
              rows={2}
              value={prayerText}
              onChange={(e) => setPrayerText(e.target.value)}
              placeholder="Como podemos orar por você nesta semana? (Saúde, família, trabalho, direção)..."
              className="w-full bg-[#09090B] border border-[#27272A] rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
            />

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors text-xs shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Pedido de Oração</span>
            </button>
          </form>

          {/* Active prayer list with pray button */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-semibold text-zinc-400 block">
              Motivos da Nossa Célula:
            </span>
            {prayers.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs"
              >
                <div className="pr-3 space-y-0.5">
                  <span className="font-semibold text-white">{p.authorName}</span>
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{p.request}</p>
                </div>
                <button
                  onClick={() => onTogglePray(p.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-colors ${
                    p.userPrayed
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-[#27272A] text-zinc-400 hover:text-white border border-[#3F3F46]'
                  }`}
                >
                  <Flame className={`w-3.5 h-3.5 ${p.userPrayed ? 'text-rose-400 fill-rose-400' : ''}`} />
                  <span>{p.prayingCount}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 5: DÍZIMOS E OFERTAS DA CÉLULA (CHAVE PIX) */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Dízimos & Ofertas Voluntárias
              </h2>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              Contribuição
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 text-xs">
            <p className="text-zinc-300">
              Sua contribuição voluntária sustenta as missões da igreja e a estrutura dos encontros do nosso GC.
            </p>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#09090B] border border-zinc-800">
              <div className="truncate">
                <span className="text-[10px] text-zinc-500 block">Chave PIX da Célula:</span>
                <span className="font-mono text-xs font-semibold text-emerald-400 truncate block">
                  {gc.pixKey || 'pix.gc.alpha@igreja.com.br'}
                </span>
              </div>
              <button
                onClick={handleCopyPix}
                className="px-3 py-1.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-white font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copiedPix ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Copiar PIX</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CARD 6: GRUPO OFICIAL NO WHATSAPP */}
        <div className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] text-center space-y-3">
          <MessageCircle className="w-8 h-8 text-emerald-400 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-white">Grupo de WhatsApp do {gc.name}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Fique por dentro de avisos diários, fotos dos encontros e pedidos urgentes.
            </p>
          </div>
          <button
            onClick={() => {
              const text = encodeURIComponent(`Olá! Sou membro do ${gc.name} e gostaria de entrar no grupo oficial.`);
              window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Acessar Grupo do WhatsApp</span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-zinc-600 pt-4">
          Sistema de Gestão de Células • Portal do Membro v2.4
        </div>
      </div>
    </div>
  );
};
