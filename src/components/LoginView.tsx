import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { MASTER_ACCOUNT } from '../data/mockData';
import { getLocalAccounts, subscribeToAccounts } from '../services/firestoreService';
import { Lock, User, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (account: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>(() => getLocalAccounts());

  useEffect(() => {
    const unsub = subscribeToAccounts((loaded) => {
      if (loaded) setAccounts(loaded);
    });
    return () => unsub();
  }, []);

  // Validation requirements:
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

    // 1. Master Account for generating & managing client accounts
    if (username.trim() === 'Samuel_01' && password === '072131Sa@') {
      onLogin(MASTER_ACCOUNT);
      return;
    }

    // 2. Leader Accounts created in the system
    const found = accounts.find(
      (acc) =>
        acc.username.toLowerCase() === username.trim().toLowerCase() &&
        acc.password === password
    );

    if (!found) {
      setError('Credenciais incorretas ou conta não cadastrada. Verifique seus dados ou solicite ao Administrador.');
      return;
    }

    onLogin(found);
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
              Sistema de Gestão de Células & Grupos Caseiros
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
                placeholder="Digite seu usuário"
                autoComplete="username"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
              />
            </div>
            {/* Live Username Checklist */}
            <div className="grid grid-cols-2 gap-1 pt-1.5 pl-1 text-[11px]">
              <div className={`flex items-center gap-1.5 ${userChecks.minLength ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                {userChecks.minLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Mín. 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-1.5 ${userChecks.hasUpper && userChecks.hasLower ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                {userChecks.hasUpper && userChecks.hasLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Maiúsculas & minúsculas</span>
              </div>
              <div className={`flex items-center gap-1.5 ${userChecks.hasSpecial ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                {userChecks.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Caractere especial</span>
              </div>
              <div className={`flex items-center gap-1.5 ${userChecks.noAccents ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
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
                placeholder="Digite sua senha"
                autoComplete="current-password"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
              />
            </div>
            {/* Live Password Checklist */}
            <div className="grid grid-cols-2 gap-1 pt-1.5 pl-1 text-[11px]">
              <div className={`flex items-center gap-1.5 ${passChecks.minLength ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                {passChecks.minLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Mín. 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passChecks.hasUpper && passChecks.hasLower ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                {passChecks.hasUpper && passChecks.hasLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Maiúsculas & minúsculas</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passChecks.hasSpecial ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                {passChecks.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                <span>Caractere especial</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passChecks.noAccents ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
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
                ? 'bg-white hover:bg-zinc-200 text-black cursor-pointer active:scale-98'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-70'
            }`}
          >
            <span>Entrar no Sistema</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-zinc-800/60 text-center">
          <p className="text-[11px] text-zinc-500 font-medium tracking-wide">
            EKKLES • Sistema Oficial de Gestão de Células
          </p>
        </div>

      </div>
    </div>
  );
};
