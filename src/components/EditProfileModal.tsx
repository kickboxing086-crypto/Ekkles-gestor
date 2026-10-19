import React, { useState } from 'react';
import { UserAccount, GC } from '../types';
import {
  User,
  Lock,
  Phone,
  Church,
  X,
  CheckCircle2,
  XCircle,
  Save,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: UserAccount;
  gc?: GC;
  onSave: (updatedAccount: Partial<UserAccount>, updatedGc?: Partial<GC>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentAccount,
  gc,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(currentAccount.name || '');
  const [username, setUsername] = useState(currentAccount.username || '');
  const [password, setPassword] = useState(currentAccount.password || '');
  const [phone, setPhone] = useState(currentAccount.phone || '');
  const [gcName, setGcName] = useState(gc?.name || currentAccount.gcName || '');
  const [gcAddress, setGcAddress] = useState(gc?.address || '');
  const [gcWeekday, setGcWeekday] = useState(gc?.weekday || 'Quinta-feira');
  const [gcTime, setGcTime] = useState(gc?.time || '20:00');
  const [error, setError] = useState<string | null>(null);

  // Validation rules for username & password
  const checkRules = (val: string) => {
    const minLength = val.length >= 8;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasSpecial = /[^A-Za-z0-9]/.test(val);
    const noAccents = !/[À-ÿ\u00C0-\u017F]/.test(val);
    return {
      minLength,
      hasUpper,
      hasLower,
      hasSpecial,
      noAccents,
      isValid: minLength && hasUpper && hasLower && hasSpecial && noAccents,
    };
  };

  const userChecks = checkRules(username);
  const passChecks = checkRules(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    if (!userChecks.isValid) {
      setError('O nome de usuário não atende a todos os requisitos de segurança.');
      return;
    }

    if (!passChecks.isValid) {
      setError('A senha não atende a todos os requisitos de segurança.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        phone: phone.trim(),
        gcName: gcName.trim(),
      },
      gc
        ? {
            name: gcName.trim(),
            address: gcAddress.trim(),
            weekday: gcWeekday,
            time: gcTime,
          }
        : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-zinc-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Editar Perfil & Credenciais</h2>
              <p className="text-xs text-zinc-400">
                Altere seus dados de acesso, senha e informações do seu GC
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Dados Pessoais */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
              Informações do Líder
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do Líder"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* Section: Credenciais de Acesso */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/70">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
              Credenciais de Acesso (Login & Senha)
            </span>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-zinc-300 font-medium block">Nome de Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Carlos@2026"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-white"
              />
              {/* Checklist Usuário */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-1 text-[10px] text-zinc-400">
                <span className={userChecks.minLength ? 'text-emerald-400 font-medium' : ''}>
                  {userChecks.minLength ? '✓' : '○'} Mín. 8 caracteres
                </span>
                <span className={userChecks.hasUpper && userChecks.hasLower ? 'text-emerald-400 font-medium' : ''}>
                  {userChecks.hasUpper && userChecks.hasLower ? '✓' : '○'} Maiúsc./Minúsc.
                </span>
                <span className={userChecks.hasSpecial ? 'text-emerald-400 font-medium' : ''}>
                  {userChecks.hasSpecial ? '✓' : '○'} Caractere especial
                </span>
                <span className={userChecks.noAccents ? 'text-emerald-400 font-medium' : ''}>
                  {userChecks.noAccents ? '✓' : '○'} Sem acentos
                </span>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 pt-1">
              <label className="text-zinc-300 font-medium block">Senha de Acesso</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-white"
              />
              {/* Checklist Senha */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-1 text-[10px] text-zinc-400">
                <span className={passChecks.minLength ? 'text-emerald-400 font-medium' : ''}>
                  {passChecks.minLength ? '✓' : '○'} Mín. 8 caracteres
                </span>
                <span className={passChecks.hasUpper && passChecks.hasLower ? 'text-emerald-400 font-medium' : ''}>
                  {passChecks.hasUpper && passChecks.hasLower ? '✓' : '○'} Maiúsc./Minúsc.
                </span>
                <span className={passChecks.hasSpecial ? 'text-emerald-400 font-medium' : ''}>
                  {passChecks.hasSpecial ? '✓' : '○'} Caractere especial
                </span>
                <span className={passChecks.noAccents ? 'text-emerald-400 font-medium' : ''}>
                  {passChecks.noAccents ? '✓' : '○'} Sem acentos
                </span>
              </div>
            </div>
          </div>

          {/* Section: Informações do GC */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/70">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
              Informações da sua Célula (GC)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Nome do GC</label>
                <input
                  type="text"
                  value={gcName}
                  onChange={(e) => setGcName(e.target.value)}
                  placeholder="Ex: GC Alpha - Casa de Ana"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Endereço do Encontro</label>
                <input
                  type="text"
                  value={gcAddress}
                  onChange={(e) => setGcAddress(e.target.value)}
                  placeholder="Rua das Flores, 123"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Dia da Semana</label>
                <select
                  value={gcWeekday}
                  onChange={(e) => setGcWeekday(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white"
                >
                  <option value="Segunda-feira">Segunda-feira</option>
                  <option value="Terça-feira">Terça-feira</option>
                  <option value="Quarta-feira">Quarta-feira</option>
                  <option value="Quinta-feira">Quinta-feira</option>
                  <option value="Sexta-feira">Sexta-feira</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Horário</label>
                <input
                  type="text"
                  value={gcTime}
                  onChange={(e) => setGcTime(e.target.value)}
                  placeholder="20:00"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!userChecks.isValid || !passChecks.isValid}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                userChecks.isValid && passChecks.isValid
                  ? 'bg-white hover:bg-zinc-200 text-black cursor-pointer active:scale-98'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-70'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações de Perfil e Senha</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
