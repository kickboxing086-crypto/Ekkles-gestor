import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { getMasterAccount, saveMasterPassword } from '../data/mockData';
import { getLocalAccounts, subscribeToAccounts, updateAccountPassword } from '../services/firestoreService';
import { sendPasswordRecoveryEmail, getGoogleAccessToken, signInWithGoogle } from '../services/gmailService';
import {
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  XCircle,
  KeyRound,
  Mail,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (account: UserAccount) => void;
}

type AuthMode = 'login' | 'forgot_request' | 'forgot_verify' | 'forgot_new';

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Recovery flow states
  const [recoveryInput, setRecoveryInput] = useState('');
  const [matchedAccount, setMatchedAccount] = useState<UserAccount | null>(null);
  const [sentCode, setSentCode] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const [accounts, setAccounts] = useState<UserAccount[]>(() => getLocalAccounts());

  useEffect(() => {
    const unsub = subscribeToAccounts((loaded) => {
      if (loaded) setAccounts(loaded);
    });
    return () => unsub();
  }, []);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Validation requirements helper
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
  const newPassChecks = checkRules(newPassword);

  // Mask email for display: s***2@gmail.com
  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [userPart, domain] = email.split('@');
    if (userPart.length <= 2) return `${userPart}***@${domain}`;
    return `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`;
  };

  // 1. Submit Login Form (USUÁRIO E SENHA EXCLUSIVAMENTE)
  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!userChecks.isValid || !passChecks.isValid) {
      setError('Por favor, atenda a todas as exigências de segurança (mín. 8 caracteres, maiúsculas, minúsculas, caractere especial e sem acentos).');
      return;
    }

    const master = getMasterAccount();

    // Check Master Account
    if (username.trim() === 'Samuel_01' && password === master.password) {
      onLogin(master);
      return;
    }

    // Check Leader Accounts
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

  // 2. Request Recovery Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const query = recoveryInput.trim().toLowerCase();

    if (!query) {
      setError('Informe seu nome de usuário ou e-mail cadastrado.');
      return;
    }

    const master = getMasterAccount();
    let target: UserAccount | undefined;

    if (query === 'samuel_01' || query === master.email.toLowerCase()) {
      target = master;
    } else {
      target = accounts.find(
        (a) => a.username.toLowerCase() === query || a.email.toLowerCase() === query
      );
    }

    if (!target) {
      setError('Nenhuma conta foi localizada com esse usuário ou e-mail. Verifique os dados digitados.');
      return;
    }

    setIsSendingCode(true);

    // Generate accurate 6-digit confirmation code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(generated);
    setMatchedAccount(target);
    setEnteredCode('');

    try {
      let token = getGoogleAccessToken();
      if (!token) {
        try {
          const authRes = await signInWithGoogle();
          token = authRes?.accessToken || null;
        } catch (authErr) {
          console.warn('Google sign-in popup closed or failed:', authErr);
        }
      }

      const res = await sendPasswordRecoveryEmail(
        {
          toEmail: target.email,
          recipientName: target.name,
          recoveryCode: generated,
        },
        token
      );

      if (!res.success) {
        setError(res.error || 'Não foi possível enviar o e-mail. Permita o acesso ao Gmail na janela pop-up do Google.');
        setIsSendingCode(false);
        return;
      }

      setResendCooldown(60);
      setAuthMode('forgot_verify');
    } catch (err) {
      console.error('Erro ao disparar e-mail:', err);
      setError('Erro ao enviar e-mail de recuperação. Tente novamente.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 3. Resend Code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !matchedAccount) return;
    setIsSendingCode(true);
    setError(null);

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(newCode);

    try {
      let token = getGoogleAccessToken();
      if (!token) {
        try {
          const authRes = await signInWithGoogle();
          token = authRes?.accessToken || null;
        } catch (authErr) {
          console.warn('Google sign-in popup closed or failed:', authErr);
        }
      }

      const res = await sendPasswordRecoveryEmail(
        {
          toEmail: matchedAccount.email,
          recipientName: matchedAccount.name,
          recoveryCode: newCode,
        },
        token
      );

      if (!res.success) {
        setError(res.error || 'Falha no reenvio do e-mail. Permita o acesso ao Gmail.');
        return;
      }

      setResendCooldown(60);
    } catch (err) {
      console.error('Falha no reenvio:', err);
      setError('Erro ao reenviar o código.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 4. Verify Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (enteredCode.trim() !== sentCode) {
      setError('Código de confirmação incorreto. Verifique os 6 dígitos recebidos no seu e-mail.');
      return;
    }

    setAuthMode('forgot_new');
  };

  // 5. Save New Password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassChecks.isValid) {
      setError('A nova senha deve atender a todas as exigências (mín. 8 caracteres, maiúsculas, minúsculas, caractere especial e sem acentos).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem. Digite a mesma senha em ambos os campos.');
      return;
    }

    if (!matchedAccount) {
      setError('Sessão expirada. Reinicie o processo de recuperação.');
      setAuthMode('login');
      return;
    }

    setIsSavingPassword(true);

    try {
      if (matchedAccount.username === 'Samuel_01') {
        saveMasterPassword(newPassword);
      } else {
        await updateAccountPassword(matchedAccount.id, newPassword);
      }

      setUsername(matchedAccount.username);
      setPassword('');
      setSuccessNotice(`Senha de ${matchedAccount.name} redefinida com sucesso! Você já pode entrar com sua nova senha.`);
      setAuthMode('login');
    } catch (err: any) {
      setError('Erro ao salvar a nova senha: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSavingPassword(false);
    }
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

        {/* Global Notifications */}
        {error && (
          <div className="p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
            <XCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="leading-relaxed">{successNotice}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 1: LOGIN (APENAS USUÁRIO E SENHA) */}
        {/* ========================================================================= */}
        {authMode === 'login' && (
          <form onSubmit={handleSubmitLogin} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300 block">Senha de Acesso</label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessNotice(null);
                    setRecoveryInput(username);
                    setAuthMode('forgot_request');
                  }}
                  className="text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
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
        )}

        {/* ========================================================================= */}
        {/* MODE 2: FORGOT PASSWORD - STEP 1 (SOLICITAR CÓDIGO) */}
        {/* ========================================================================= */}
        {authMode === 'forgot_request' && (
          <form onSubmit={handleRequestCode} className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAuthMode('login');
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Voltar ao login"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-white">Recuperar Senha</h2>
                <p className="text-[11px] text-zinc-400">Enviaremos um código de verificação para o seu e-mail</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">
                Nome de Usuário ou E-mail Cadastrado
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value)}
                  placeholder="Ex: Samuel_01 ou seu.email@exemplo.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-500 pt-1">
                O código de confirmação chegará diretamente na caixa postal vinculada à sua conta.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSendingCode || !recoveryInput.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-white hover:bg-zinc-200 text-black cursor-pointer active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingCode ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando Código...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Enviar Código para o E-mail</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: FORGOT PASSWORD - STEP 2 (DIGITAR CÓDIGO RECEBIDO) */}
        {/* ========================================================================= */}
        {authMode === 'forgot_verify' && matchedAccount && (
          <form onSubmit={handleVerifyCode} className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAuthMode('forgot_request');
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-white">Confirmação de Código</h2>
                <p className="text-[11px] text-zinc-400">Verifique o código de 6 dígitos que chegou</p>
              </div>
            </div>

            {/* Email destination card */}
            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">E-mail de envio:</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {maskEmail(matchedAccount.email)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                O código foi enviado para <strong>{matchedAccount.email}</strong>. Verifique também a pasta de spam.
              </p>
            </div>



            {/* 6-Digit Code Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">
                Digite os 6 dígitos recebidos
              </label>
              <input
                type="text"
                maxLength={6}
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 482910"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-center font-mono text-xl tracking-[0.5em] text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isSendingCode}
                className="text-[11px] text-zinc-400 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                {resendCooldown > 0 ? `Reenviar código em (${resendCooldown}s)` : 'Reenviar código'}
              </button>
              <span className="text-[11px] text-zinc-500 font-mono">6 dígitos</span>
            </div>

            <button
              type="submit"
              disabled={enteredCode.length !== 6}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-white hover:bg-zinc-200 text-black cursor-pointer active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Validar Código</span>
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE 4: FORGOT PASSWORD - STEP 3 (DEFINIR NOVA SENHA) */}
        {/* ========================================================================= */}
        {authMode === 'forgot_new' && matchedAccount && (
          <form onSubmit={handleSaveNewPassword} className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
              <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Criar Nova Senha</h2>
                <p className="text-[11px] text-zinc-400">Usuário confirmado: <strong className="text-white">{matchedAccount.username}</strong></p>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">Nova Senha</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
                />
              </div>

              {/* Live Checklist */}
              <div className="grid grid-cols-2 gap-1 pt-1.5 pl-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${newPassChecks.minLength ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                  {newPassChecks.minLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                  <span>Mín. 8 caracteres</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassChecks.hasUpper && newPassChecks.hasLower ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                  {newPassChecks.hasUpper && newPassChecks.hasLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                  <span>Maiúsc./Minúsc.</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassChecks.hasSpecial ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                  {newPassChecks.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                  <span>Caractere especial</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassChecks.noAccents ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
                  {newPassChecks.noAccents ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block text-center text-[9px] leading-3">○</span>}
                  <span>Sem acentos</span>
                </div>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-zinc-300 block">Confirmar Nova Senha</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
                />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-red-400 pt-1">As senhas não coincidem.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSavingPassword || !newPassChecks.isValid || newPassword !== confirmPassword}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-white hover:bg-zinc-200 text-black cursor-pointer active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingPassword ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Salvando Nova Senha...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Nova Senha & Entrar</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-zinc-800/60 text-center">
          <p className="text-[11px] text-zinc-500 font-medium tracking-wide">
            EKKLES • Sistema Oficial de Gestão de Células
          </p>
        </div>

      </div>
    </div>
  );
};
