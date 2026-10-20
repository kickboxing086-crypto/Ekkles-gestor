import React, { useState, useEffect } from 'react';
import { GC, Member, Scale } from '../types';
import {
  signInWithGoogle,
  sendMeetingNoticeEmail,
  getGoogleAccessToken,
  disconnectGoogle,
} from '../services/gmailService';
import { auth } from '../firebase';
import {
  Mail,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  KeyRound,
  Users,
} from 'lucide-react';

interface EmailNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gc: GC;
  members: Member[];
  scale?: Scale | null;
  leaderName: string;
}

export const EmailNoticeModal: React.FC<EmailNoticeModalProps> = ({
  isOpen,
  onClose,
  gc,
  members,
  scale,
  leaderName,
}) => {
  if (!isOpen) return null;

  // Generate 6-digit confirmation code
  const generateCode = () => `GC-${Math.floor(100000 + Math.random() * 900000)}`;
  const [confirmationCode, setConfirmationCode] = useState<string>(generateCode());

  // Email targets
  const membersWithEmail = members.filter((m) => m.email && m.email.includes('@'));
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    membersWithEmail.map((m) => m.id)
  );
  const [customTestEmail, setCustomTestEmail] = useState<string>('samuellsilvva02@gmail.com');
  const [includeCustomEmail, setIncludeCustomEmail] = useState(true);

  // Message personalization states
  const [noticeCategory, setNoticeCategory] = useState<string>('Convocação Semanal');
  const [customNote, setCustomNote] = useState<string>(
    'Que a graça e a paz do Senhor estejam com você! Nesta semana teremos um momento muito especial de louvor, palavra e comunhão fraterna. Venha com o coração aberto!'
  );

  // Auth & status
  const [googleUser, setGoogleUser] = useState(auth.currentUser);
  const [accessToken, setAccessToken] = useState<string | null>(getGoogleAccessToken());
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    count?: number;
    error?: string;
  } | null>(null);

  // Destructive/send confirmation dialog state (Mandatory per Workspace guideline)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const token = getGoogleAccessToken();
    setAccessToken(token);
    setGoogleUser(auth.currentUser);
  }, [isOpen]);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await signInWithGoogle();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      alert(`Falha na autorização do Google: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleTriggerSendFlow = (e: React.FormEvent) => {
    e.preventDefault();
    setSendResult(null);

    const recipientList: string[] = [];
    selectedMemberIds.forEach((id) => {
      const mem = members.find((m) => m.id === id);
      if (mem?.email) recipientList.push(mem.email);
    });
    if (includeCustomEmail && customTestEmail.trim()) {
      recipientList.push(customTestEmail.trim());
    }

    if (recipientList.length === 0) {
      alert('Selecione pelo menos um destinatário de e-mail.');
      return;
    }

    if (!accessToken) {
      alert('Por favor, conecte sua conta Google antes de enviar.');
      return;
    }

    // Open explicit confirmation dialog as required by Workspace safety guidelines
    setShowConfirmDialog(true);
  };

  const handleConfirmAndSend = async () => {
    setShowConfirmDialog(false);
    setIsSending(true);
    setSendResult(null);

    try {
      const recipients: { email: string; name?: string }[] = [];
      selectedMemberIds.forEach((id) => {
        const mem = members.find((m) => m.id === id);
        if (mem?.email) recipients.push({ email: mem.email, name: mem.name });
      });
      if (includeCustomEmail && customTestEmail.trim()) {
        recipients.push({ email: customTestEmail.trim(), name: 'Destinatário de Teste' });
      }

      let successCount = 0;
      let lastError = '';

      for (const rec of recipients) {
        const res = await sendMeetingNoticeEmail(
          {
            toEmail: rec.email,
            recipientName: rec.name,
            gcName: gc.name,
            meetingDate: gc.weekday,
            meetingTime: gc.time,
            location: gc.location,
            address: gc.address,
            confirmationCode,
            leaderName,
            noticeCategory,
            customNote: customNote.trim() || undefined,
            theme: gc.theme,
            verse: gc.verse,
            scales: scale
              ? {
                  louvor: scale.louvor,
                  palavra: scale.palavra,
                  anfitriao: scale.anfitriao,
                  lanche: scale.lanche,
                }
              : undefined,
          },
          accessToken!
        );

        if (res.success) {
          successCount++;
        } else {
          lastError = res.error || 'Erro no envio';
        }
      }

      if (successCount > 0) {
        setSendResult({ success: true, count: successCount });
      } else {
        setSendResult({ success: false, error: lastError || 'Nenhum e-mail pôde ser enviado.' });
      }
    } catch (err: any) {
      setSendResult({ success: false, error: err.message || 'Falha ao despachar e-mails.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Avisar Membros por E-mail</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Gmail OAuth
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Dispare avisos do encontro com código de presença aos membros do {gc.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Status Alert */}
          {sendResult?.success && (
            <div className="p-4 bg-emerald-950/50 border border-emerald-800/80 rounded-2xl text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white">E-mails enviados com sucesso!</p>
                <p className="text-[11px] text-emerald-400">
                  {sendResult.count} destinatário(s) notificado(s) com o código de confirmação{' '}
                  <strong className="text-white font-mono">{confirmationCode}</strong>.
                </p>
              </div>
            </div>
          )}

          {sendResult?.error && (
            <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-2xl text-red-300 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Falha no envio</p>
                <p className="text-[11px] text-red-300">{sendResult.error}</p>
              </div>
            </div>
          )}

          {/* Google Auth Status Banner */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xs">
                G
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {accessToken ? (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Google Conectado ({googleUser?.email || 'Gmail Ativo'})
                    </span>
                  ) : (
                    'Conexão com Google necessária para envio'
                  )}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {accessToken
                    ? 'Pronto para enviar e-mails oficiais de convocação em nome da liderança.'
                    : 'Autorize o envio de e-mails de convocação e códigos de presença.'}
                </p>
              </div>
            </div>

            {accessToken ? (
              <button
                onClick={async () => {
                  await disconnectGoogle();
                  setAccessToken(null);
                  setGoogleUser(null);
                }}
                className="px-3 py-1.5 rounded-xl text-[11px] text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                Desconectar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span>{isConnectingGoogle ? 'Conectando...' : 'Conectar com Google'}</span>
              </button>
            )}
          </div>

          {/* Confirmation Code Card */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold block flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                Código de Confirmação da Reunião
              </span>
              <p className="text-xl sm:text-2xl font-bold font-mono tracking-widest text-white">
                {confirmationCode}
              </p>
              <p className="text-[11px] text-zinc-400">
                Os membros receberão este código no e-mail para confirmar a presença.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmationCode(generateCode())}
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
              title="Gerar novo código"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Novo Código</span>
            </button>
          </div>

          {/* Meeting Details Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-[11px]">
            <div className="flex items-center gap-2 text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Data: <strong className="text-white">{gc.weekday}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Horário: <strong className="text-white">{gc.time}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300 col-span-1 sm:col-span-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">Local: <strong className="text-white">{gc.location}</strong> ({gc.address})</span>
            </div>
          </div>

          {/* Personalized Message & Notice Type Section */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Personalizar Mensagem aos Membros</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                100% Personalizado
              </span>
            </div>

            {/* Notice Category Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400 font-medium block">Tipo de Aviso / Convocação:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'Convocação Semanal', label: '📢 Convocação', note: 'Que a graça e a paz do Senhor estejam com você! Nesta semana teremos um momento muito especial de louvor, palavra e comunhão fraterna. Venha com o coração aberto!' },
                  { id: 'Lembrete de Escala', label: '📋 Escalas & Tarefas', note: 'Olá, amado(a)! Passando para lembrar com carinho da nossa reunião e confirmar sua escala na equipe. Sua dedicação faz toda a diferença!' },
                  { id: 'Noite de Comunhão', label: '☕ Noite de Comunhão', note: 'Paz do Senhor! Nosso encontro desta semana terá um momento maravilhoso de partilha e gratidão a Deus. Venha celebrar conosco e traga um convidado!' },
                  { id: 'Cuidado & Oração', label: '🙏 Cuidado Pastoral', note: 'Querido(a) irmão(ã), sua vida é preciosa para o nosso grupo! Estaremos reunidos em amor para interceder por sua família e seus sonhos.' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setNoticeCategory(cat.id);
                      setCustomNote(cat.note);
                    }}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-medium text-left transition-all border ${
                      noticeCategory === cat.id
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Note Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">
                  Palavra da Liderança (destacada no corpo do e-mail):
                </span>
                <span className="text-[10px] text-zinc-500">{customNote.length} caracteres</span>
              </div>
              <textarea
                rows={3}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Escreva uma mensagem calorosa, personalizada ou um versículo para abençoar os membros..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Recipients Section */}
          <div className="space-y-2">
            <label className="font-semibold text-white block">Destinatários da Convocação:</label>
            
            {/* Custom test email option */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCustomEmail}
                  onChange={(e) => setIncludeCustomEmail(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 bg-zinc-800 border-zinc-700"
                />
                <span className="font-medium text-white">Enviar e-mail para endereço de teste:</span>
              </label>
              {includeCustomEmail && (
                <input
                  type="email"
                  value={customTestEmail}
                  onChange={(e) => setCustomTestEmail(e.target.value)}
                  placeholder="Ex: seu-email@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              )}
            </div>

            {/* Members List */}
            {membersWithEmail.length > 0 ? (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5 max-h-36 overflow-y-auto">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">
                  Membros do {gc.name} com e-mail:
                </span>
                {membersWithEmail.map((mem) => {
                  const isChecked = selectedMemberIds.includes(mem.id);
                  return (
                    <label key={mem.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedMemberIds(selectedMemberIds.filter((id) => id !== mem.id));
                            } else {
                              setSelectedMemberIds([...selectedMemberIds, mem.id]);
                            }
                          }}
                          className="rounded text-emerald-500 focus:ring-0 bg-zinc-800 border-zinc-700"
                        />
                        <span className="text-zinc-200 font-medium">{mem.name}</span>
                      </div>
                      <span className="text-zinc-500 font-mono text-[10px]">{mem.email}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 italic">
                Nenhum membro da célula com e-mail cadastrado no momento. Use o campo de teste acima para validar o envio.
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleTriggerSendFlow}
            disabled={isSending}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar Convocação por E-mail</span>
              </>
            )}
          </button>
        </div>

        {/* Mandatory Confirmation Modal before Sending (Per Workspace integration rules) */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-[#18181B] border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Confirmar Envio de E-mails?</h3>
                  <p className="text-xs text-zinc-400">Esta ação enviará mensagens aos membros via Gmail.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1.5 text-zinc-300">
                <p>• <strong>Célula:</strong> {gc.name}</p>
                <p>• <strong>Código de Presença:</strong> <span className="font-mono text-emerald-400 font-bold">{confirmationCode}</span></p>
                <p>• <strong>Destinatários:</strong> {selectedMemberIds.length + (includeCustomEmail ? 1 : 0)} pessoa(s)</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndSend}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-md"
                >
                  Confirmar e Enviar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
