import React, { useState } from 'react';
import { UserAccount } from '../types';
import { AVAILABLE_ACCOUNTS } from '../data/mockData';
import { Lock, User, ArrowRight, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLogin: (account: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('Samuel_01');
  const [password, setPassword] = useState('072131Sa@');
  const [error, setError] = useState<string | null>(null);

  // Requirements checks:
  // 1. Min 8 chars
  // 2. Uppercase & Lowercase
  // 3. Special character
  // 4. No accents
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

    if (!userChecks.isValid || !passChecks.isValid) {
      setError('Por favor, atenda a todas as exigências de segurança (mín. 8 caracteres, maiúsculas, minúsculas, caractere especial e sem acentos).');
      return;
    }

    // Master Account for generating client accounts
    if (username === 'Samuel_01' && password === '072131Sa@') {
      const masterAccount: UserAccount = {
        id: 'acc-master-samuel',
        name: 'Samuel (Administrador Master)',
        role: 'Gerador de Contas / Admin',
        accountType: 'pastor',
        email: 'samuellsilvva02@gmail.com',
        username: 'Samuel_01',
        password: '072131Sa@',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        phone: '(11) 99999-9999',
        gcId: 'all',
        gcName: 'Painel de Gestão de Contas',
      };
      onLogin(masterAccount);
      return;
    }

    const found = AVAILABLE_ACCOUNTS.find(
      (acc) =>
        acc.username.toLowerCase() === username.trim().toLowerCase() &&
        acc.password === password
    );

    if (!found) {
      setError('Credenciais inválidas. Use Samuel_01 / 072131Sa@ ou uma conta válida.');
      return;
    }

    onLogin(found);
  };

  const handleQuickLogin = (account: UserAccount) => {
    setUsername(account.username);
    setPassword(account.password);
    onLogin(account);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-[#121212] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Logo: Black and White Church */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-white text-black rounded-2xl mx-auto flex items-center justify-center shadow-xl border border-zinc-300">
            <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L3 9v12h18V9l-9-7zm0 2.84L18.16 9H5.84L12 4.84zM5 19v-8h3v8H5zm5 0v-5h4v5h-4zm6 0v-8h3v8h-3z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">EKKLES</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Portal de Acesso & Gestão de Contas
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 block">Nome de Usuário</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Samuel_01"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
              />
            </div>
            {/* Live Username Checklist */}
            <div className="grid grid-cols-2 gap-1 pt-1.5 pl-1 text-[11px]">
              <div className={`flex items-center gap-1.5 ${userChecks.minLength ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {userChecks.minLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Mín. 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-1.5 ${userChecks.hasUpper && userChecks.hasLower ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {userChecks.hasUpper && userChecks.hasLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Maiúsculas & minúsculas</span>
              </div>
              <div className={`flex items-center gap-1.5 ${userChecks.hasSpecial ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {userChecks.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Caractere especial</span>
              </div>
              <div className={`flex items-center gap-1.5 ${userChecks.noAccents ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {userChecks.noAccents ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Sem acentos</span>
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-zinc-300 block">Senha de Acesso</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
              />
            </div>
            {/* Live Password Checklist */}
            <div className="grid grid-cols-2 gap-1 pt-1.5 pl-1 text-[11px]">
              <div className={`flex items-center gap-1.5 ${passChecks.minLength ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {passChecks.minLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Mín. 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passChecks.hasUpper && passChecks.hasLower ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {passChecks.hasUpper && passChecks.hasLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Maiúsculas & minúsculas</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passChecks.hasSpecial ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {passChecks.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Caractere especial</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passChecks.noAccents ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {passChecks.noAccents ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Sem acentos</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!userChecks.isValid || !passChecks.isValid}
            className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-2 ${
              userChecks.isValid && passChecks.isValid
                ? 'bg-white hover:bg-zinc-200 text-black cursor-pointer'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-70'
            }`}
          >
            <span>Entrar no Sistema</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Master Account Info & Demo Accounts */}
        <div className="pt-4 border-t border-zinc-800/80 space-y-3">
          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-center">
            <p className="text-[11px] text-zinc-300">Sua Conta Master (Gerador de Logins):</p>
            <p className="text-xs font-mono font-bold text-white mt-0.5">Samuel_01 | 072131Sa@</p>
          </div>

          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block text-center">
            Ou acesse contas de demonstração:
          </span>
          <div className="space-y-2">
            {AVAILABLE_ACCOUNTS.map((acc) => (
              <button
                key={acc.id}
                onClick={() => handleQuickLogin(acc)}
                className="w-full p-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={acc.avatarUrl}
                    alt={acc.name}
                    className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                  />
                  <div>
                    <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                      {acc.name}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {acc.accountType === 'pastor' ? 'Pastor / Supervisor' : acc.gcName}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {acc.username}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
