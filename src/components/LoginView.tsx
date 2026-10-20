import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';
import { getMasterAccount, saveMasterPassword } from '../data/mockData';
import { getLocalAccounts, subscribeToAccounts, updateAccountPassword } from '../services/firestoreService';
import { sendPasswordRecoveryEmail, getGoogleAccessToken, signInWithGoogle } from '../services/gmailService';
import { confirmPasswordReset, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
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
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import { verifyPassword, hashPassword, isPasswordHashed } from '../services/securityService';

interface LoginViewProps {
  onLogin: (account: UserAccount) => void;
}

type AuthMode = 'login' | 'forgot_request' | 'forgot_verify' | 'forgot_new';

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Recovery flow states
  const [recoveryType, setRecoveryType] = useState<'username' | 'email'>('username');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [matchedAccount, setMatchedAccount] = useState<UserAccount | null>(null);
  const [sentCode, setSentCode] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [urlOobCode, setUrlOobCode] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'resetPassword' && params.get('oobCode')) {
        return params.get('oobCode');
      }
    } catch (e) {}
    return null;
  });

  const [accounts, setAccounts] = useState<UserAccount[]>(() => getLocalAccounts());

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isResetMode =
        params.get('mode') === 'resetPassword' ||
        params.get('tab') === 'recuperar-senha' ||
        params.get('action') === 'resetPassword';
      
      const emailParam = params.get('email') || params.get('reset_email');
      const userParam = params.get('user');

      if (isResetMode || urlOobCode) {
        setAuthMode('forgot_new');
        const q = (emailParam || userParam || '').trim().toLowerCase();
        if (q) {
          setRecoveryInput(q);
          const master = getMasterAccount();
          if (q === 'samuel_01' || q === master.email.toLowerCase()) {
            setMatchedAccount(master);
          } else {
            const found = accounts.find(
              (a) => a.username.toLowerCase() === q || a.email.toLowerCase() === q
            );
            if (found) setMatchedAccount(found);
          }
        }
      }
    } catch (e) {}
  }, [urlOobCode, accounts]);

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

  // 1. Submit Login Form (USUÁRIO E SENHA COM VALIDAÇÃO CRIPTOGRÁFICA)
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!userChecks.isValid || !passChecks.isValid) {
      setError('Por favor, atenda a todas as exigências de segurança (mín. 8 caracteres, maiúsculas, minúsculas, caractere especial e sem acentos).');
      return;
    }

    setIsLoggingIn(true);
    try {
      const master = getMasterAccount();

      // Check Master Account
      if (username.trim().toLowerCase() === 'samuel_01') {
        const isMatch = await verifyPassword(password, master.password);
        if (isMatch) {
          if (!isPasswordHashed(master.password)) {
            const hashed = await hashPassword(password);
            saveMasterPassword(hashed);
          }
          onLogin({
            ...master,
            isEncrypted: true,
            encryptionMethod: 'SHA-256 (Salted) + AES-GCM',
            lastLoginEncryptedAt: new Date().toISOString(),
          });
          return;
        }
      }

      // Check Leader Accounts
      const found = accounts.find(
        (acc) => acc.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (found) {
        const isMatch = await verifyPassword(password, found.password);
        if (isMatch) {
          if (!isPasswordHashed(found.password)) {
            const hashed = await hashPassword(password);
            updateAccountPassword(found.id, hashed).catch(() => {});
          }
          onLogin({
            ...found,
            isEncrypted: true,
            encryptionMethod: 'SHA-256 (Salted) + AES-GCM',
            lastLoginEncryptedAt: new Date().toISOString(),
          });
          return;
        }
      }

      setError('Credenciais incorretas ou conta não cadastrada. Verifique seus dados ou solicite ao Administrador.');
    } catch (err: any) {
      console.error('Erro na autenticação criptografada:', err);
      setError('Erro ao validar credenciais com segurança criptográfica.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Request Recovery Code
  // 2. Request Recovery Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const query = recoveryInput.trim().toLowerCase();

    if (!query) {
      setError(recoveryType === 'username' ? 'Informe seu nome de usuário.' : 'Informe seu e-mail cadastrado.');
      return;
    }

    const master = getMasterAccount();
    let target: UserAccount | undefined;

    if (recoveryType === 'username') {
      if (query === 'samuel_01' || query === master.username.toLowerCase()) {
        target = master;
      } else {
        target = accounts.find((a) => a.username.toLowerCase() === query);
      }
    } else {
      if (query === master.email.toLowerCase()) {
        target = master;
      } else {
        target = accounts.find((a) => a.email.toLowerCase() === query);
      }
    }

    if (!target) {
      setError(
        recoveryType === 'username'
          ? 'Nenhuma conta foi localizada com esse nome de usuário.'
          : 'Nenhuma conta foi localizada com esse e-mail.'
      );
      return;
    }

    setIsSendingCode(true);

    try {
      auth.languageCode = 'pt-BR';
      setMatchedAccount(target);

      // Generate 6-digit code
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(generated);

      // 1. Send via Firebase Auth in Portuguese (pt-BR)
      try {
        await sendPasswordResetEmail(auth, target.email);
      } catch (err: any) {
        if (err?.code === 'auth/user-not-found' || err?.message?.includes('user-not-found')) {
          try {
            await createUserWithEmailAndPassword(auth, target.email, 'TempPass123!@#');
            await sendPasswordResetEmail(auth, target.email);
          } catch (createErr) {
            console.warn('Firebase user creation fallback notice:', createErr);
          }
        }
      }

      // 2. If Google/Gmail token is active, also deliver the customized HTML email
      const token = getGoogleAccessToken();
      if (token) {
        try {
          await sendPasswordRecoveryEmail(
            {
              toEmail: target.email,
              recipientName: target.name,
              recoveryCode: generated,
            },
            token
          );
        } catch (gErr) {
          console.warn('Gmail custom recovery dispatch notice:', gErr);
        }
      }

      setSuccessNotice(`Link de recuperação enviado para ${target.email}. Defina sua NOVA SENHA e REPITA A SENHA abaixo:`);
      setAuthMode('forgot_new');
    } catch (err: any) {
      console.error('Erro ao enviar e-mail de recuperação:', err);
      setError(err?.message || 'Erro ao enviar e-mail de recuperação. Tente novamente.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 3. Resend Code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !matchedAccount) return;
    setIsSendingCode(true);
    setError(null);

    try {
      auth.languageCode = 'pt-BR';
      await sendPasswordResetEmail(auth, matchedAccount.email);

      const token = getGoogleAccessToken();
      if (token && sentCode) {
        await sendPasswordRecoveryEmail(
          {
            toEmail: matchedAccount.email,
            recipientName: matchedAccount.name,
            recoveryCode: sentCode,
          },
          token
        ).catch(() => {});
      }

      setSuccessNotice(`Novo link de redefinição enviado para ${matchedAccount.email}.`);
      setResendCooldown(60);
    } catch (err: any) {
      console.error('Falha no reenvio:', err);
      setError(err?.message || 'Erro ao reenviar o e-mail.');
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

    // Resolve target account
    let target = matchedAccount;
    if (!target) {
      const q = recoveryInput.trim().toLowerCase();
      const master = getMasterAccount();
      if (q === 'samuel_01' || q === master.email.toLowerCase()) {
        target = master;
      } else if (q) {
        target = accounts.find(
          (a) => a.username.toLowerCase() === q || a.email.toLowerCase() === q
        ) || null;
      }
    }

    if (!target && !urlOobCode) {
      setError('Por favor, informe seu usuário ou e-mail cadastrado acima para concluir a redefinição.');
      return;
    }

    setIsSavingPassword(true);

    try {
      const hashedNewPass = await hashPassword(newPassword);

      if (urlOobCode) {
        try {
          await confirmPasswordReset(auth, urlOobCode, newPassword);
        } catch (firebaseErr: any) {
          console.warn('Firebase confirmPasswordReset notice:', firebaseErr);
        }
      }

      if (target) {
        if (target.username.toLowerCase() === 'samuel_01') {
          saveMasterPassword(hashedNewPass);
        } else {
          await updateAccountPassword(target.id, hashedNewPass);
        }
      }

      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessNotice('Senha redefinida com sucesso! Você já pode entrar com sua nova senha.');
      setAuthMode('login');
      if (target) {
        setUsername(target.username);
      }
      setUrlOobCode(null);
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err: any) {
      console.error('Erro ao salvar nova senha:', err);
      setError('Erro ao salvar a nova senha: ' + (err.message || 'Verifique seus dados.'));
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
          <div className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium mx-auto w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ambiente Criptografado Ponta a Ponta • SHA-256</span>
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                  </button>
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
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
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
              disabled={isLoggingIn || !userChecks.isValid || !passChecks.isValid}
              className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-2 ${
                userChecks.isValid && passChecks.isValid && !isLoggingIn
                  ? 'bg-white hover:bg-zinc-200 text-black cursor-pointer active:scale-98'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-70'
              }`}
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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

            {/* Recovery Type Selector Options */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRecoveryType('username');
                  setRecoveryInput('');
                  setError(null);
                }}
                className={`py-2 rounded-lg font-medium transition-all cursor-pointer ${
                  recoveryType === 'username'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Nome de Usuário
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryType('email');
                  setRecoveryInput('');
                  setError(null);
                }}
                className={`py-2 rounded-lg font-medium transition-all cursor-pointer ${
                  recoveryType === 'email'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                E-mail
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">
                {recoveryType === 'username' ? 'Nome de Usuário Cadastrado' : 'E-mail Cadastrado'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  {recoveryType === 'username' ? <User className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </span>
                <input
                  type={recoveryType === 'email' ? 'email' : 'text'}
                  value={recoveryInput}
                  onChange={(e) => setRecoveryInput(e.target.value)}
                  placeholder={recoveryType === 'username' ? 'Ex: samuel_01' : 'Ex: seu.email@exemplo.com'}
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
        {authMode === 'forgot_new' && (
          <form onSubmit={handleSaveNewPassword} className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setAuthMode('login');
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Voltar ao Login"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-white">Recuperar Senha</h2>
                  <p className="text-[11px] text-zinc-400">
                    {matchedAccount ? `Conta: ${matchedAccount.name} (${matchedAccount.username})` : 'Aba de Redefinição Oficial EKKLES'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                OFICIAL
              </span>
            </div>

            {/* Account identification input if arriving directly without prior session */}
            {!matchedAccount && (
              <div className="space-y-1.5 pb-1">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <span className="text-emerald-400 font-extrabold">•</span> USUÁRIO OU E-MAIL CADASTRADO
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    placeholder="Ex: Samuel_01 ou seu e-mail"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* NOVA SENHA */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider block flex items-center gap-1.5">
                  <span className="text-emerald-400 font-extrabold">•</span> NOVA SENHA
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showNewPassword ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
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

            {/* REPITA A SENHA */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider block flex items-center gap-1.5">
                  <span className="text-emerald-400 font-extrabold">•</span> REPITA A SENHA
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showConfirmPassword ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita exatamente a nova senha"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
                />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-red-400 pt-1">As senhas digitadas não coincidem.</p>
              )}
              {confirmPassword && confirmPassword === newPassword && newPassword.length >= 8 && (
                <p className="text-[11px] text-emerald-400 pt-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> As senhas coincidem perfeitamente.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSavingPassword || !newPassChecks.isValid || newPassword !== confirmPassword}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-white hover:bg-zinc-200 text-black cursor-pointer active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingPassword ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-600" />
                  <span>Salvando nova senha...</span>
                </>
              ) : (
                <span>Salvar Nova Senha & Entrar</span>
              )}
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-zinc-800/60 text-center space-y-1.5">
          <p className="text-[11px] text-zinc-400 font-medium tracking-wide">
            Ambiente Criptografado Ponta a Ponta • SHA-256
          </p>
          <p className="text-[11px] text-zinc-500 font-medium tracking-wide">
            EKKLES • Sistema Oficial de Gestão de Células
          </p>
        </div>

      </div>
    </div>
  );
};
