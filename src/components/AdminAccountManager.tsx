import React, { useState, useEffect } from 'react';
import { UserAccount, GC } from '../types';
import {
  getLocalAccounts,
  subscribeToAccounts,
  saveAccountToFirestore,
  deleteAccountFromFirestore,
  createLeaderGcInFirestore,
} from '../services/firestoreService';
import {
  Users,
  UserPlus,
  Key,
  Copy,
  Check,
  Trash2,
  LogOut,
  Edit3,
  X,
  Save,
  ShieldCheck,
  AlertCircle,
  Inbox,
} from 'lucide-react';

interface AdminAccountManagerProps {
  currentAccount: UserAccount;
  onLogout: () => void;
}

export const AdminAccountManager: React.FC<AdminAccountManagerProps> = ({ currentAccount, onLogout }) => {
  const [accounts, setAccounts] = useState<UserAccount[]>(() => getLocalAccounts());

  useEffect(() => {
    const unsub = subscribeToAccounts((loaded) => {
      if (loaded) setAccounts(loaded);
    });
    return () => unsub();
  }, []);

  // New account form
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newGcName, setNewGcName] = useState('GC Nova Vida');

  // Editing state
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editGcName, setEditGcName] = useState('');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validation rules helper
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

  const newUserChecks = checkRules(newUsername);
  const newPassChecks = checkRules(newPassword);

  const editUserChecks = checkRules(editUsername);
  const editPassChecks = checkRules(editPassword);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newName.trim()) {
      setErrorMsg('Informe o nome do líder.');
      return;
    }

    if (!newUserChecks.isValid || !newPassChecks.isValid) {
      setErrorMsg('O usuário e a senha devem ter no mínimo 8 caracteres, letras maiúsculas/minúsculas, caractere especial e sem acentos.');
      return;
    }

    const newGcId = `gc-${Date.now()}`;
    const newAcc: UserAccount = {
      id: `acc-${Date.now()}`,
      name: newName.trim(),
      role: 'Líder de GC',
      accountType: 'lider_gc',
      email: `${newUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@ekkles.com`,
      username: newUsername.trim(),
      password: newPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      phone: '(11) 98888-7777',
      gcId: newGcId,
      gcName: newGcName.trim() || 'GC Célula',
    };

    // Create matching clean GC for this leader
    const newGc: GC = {
      id: newGcId,
      name: newGcName.trim() || 'Meu Grupo Caseiro',
      location: 'Local a definir',
      address: 'Rua Principal, 100',
      weekday: 'Quarta-feira',
      time: '20:00',
      leaderId: newAcc.id,
      leaderName: newAcc.name,
      coLeaderName: 'A definir',
      hostName: 'A definir',
      memberCount: 0,
      active: true,
      theme: 'Comunhão e Discipulado',
      verse: '“Pois onde estiverem dois ou três reunidos em meu nome, ali estou eu no meio deles.” — Mateus 18:20',
      rsvpCount: 0,
    };

    setAccounts((prev) => [newAcc, ...prev]);
    await saveAccountToFirestore(newAcc);
    await createLeaderGcInFirestore(newGc);

    setSuccessMsg(`Conta de Líder de GC gerada com sucesso para ${newAcc.name} (${newAcc.username})!`);
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setNewGcName('GC Nova Vida');
  };

  const handleStartEdit = (acc: UserAccount) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditUsername(acc.username);
    setEditPassword(acc.password);
    setEditGcName(acc.gcName || 'Meu GC');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    if (!editUserChecks.isValid || !editPassChecks.isValid) {
      alert('As credenciais editadas devem atender aos requisitos de 8 caracteres, maiúsculas/minúsculas, caractere especial e sem acentos.');
      return;
    }

    const updated: UserAccount = {
      ...editingAccount,
      name: editName.trim(),
      username: editUsername.trim(),
      password: editPassword.trim(),
      gcName: editGcName.trim(),
    };

    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    await saveAccountToFirestore(updated);

    setSuccessMsg(`Credenciais de ${editName} atualizadas com sucesso!`);
    setEditingAccount(null);
  };

  const handleCopy = (acc: UserAccount) => {
    const text = `EKKLES - Seus Dados de Acesso:\nUsuário: ${acc.username}\nSenha: ${acc.password}\nFunção: Líder de GC (${acc.gcName})`;
    navigator.clipboard.writeText(text);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta conta de líder de GC?')) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      await deleteAccountFromFirestore(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans flex flex-col">
      {/* Top Header */}
      <header className="h-20 bg-[#121214] border-b border-[#27272A] px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center font-bold shadow-lg">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L3 9v12h18V9l-9-7zm0 2.84L18.16 9H5.84L12 4.84zM5 19v-8h3v8H5zm5 0v-5h4v5h-4zm6 0v-8h3v8h-3z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>EKKLES • GERADOR DE LOGINS</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-black font-extrabold">
                ADMIN MASTER
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Gerencie e edite os acessos dos Líderes de GC • Logado como: <strong className="text-white">{currentAccount.name}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair (Logout)</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {successMsg && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 rounded-2xl text-xs flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">✕</button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-950/60 border border-red-800/80 text-red-300 rounded-2xl text-xs flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white cursor-pointer">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form to create new GC leader account */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-6 shadow-xl space-y-5 lg:col-span-1">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#27272A]">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Criar Login de Líder de GC</h2>
                <p className="text-[11px] text-zinc-400">Gere um acesso exclusivo para uma célula</p>
              </div>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Nome do Líder de GC</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Nome da Célula (GC)</label>
                <input
                  type="text"
                  value={newGcName}
                  onChange={(e) => setNewGcName(e.target.value)}
                  placeholder="Ex: GC Alpha - Casa de Ana"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              {/* Username Input with Live Checklist */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Nome de Usuário</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: Carlos@2026"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono transition-colors"
                />
                <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-zinc-400">
                  <span className={newUserChecks.minLength ? 'text-emerald-400 font-medium' : ''}>
                    {newUserChecks.minLength ? '✓' : '○'} Mín. 8 caracteres
                  </span>
                  <span className={newUserChecks.hasUpper && newUserChecks.hasLower ? 'text-emerald-400 font-medium' : ''}>
                    {newUserChecks.hasUpper && newUserChecks.hasLower ? '✓' : '○'} Maiúsc./Minúsc.
                  </span>
                  <span className={newUserChecks.hasSpecial ? 'text-emerald-400 font-medium' : ''}>
                    {newUserChecks.hasSpecial ? '✓' : '○'} Caractere especial
                  </span>
                  <span className={newUserChecks.noAccents ? 'text-emerald-400 font-medium' : ''}>
                    {newUserChecks.noAccents ? '✓' : '○'} Sem acentos
                  </span>
                </div>
              </div>

              {/* Password Input with Live Checklist */}
              <div className="space-y-1">
                <label className="text-zinc-300 font-medium block">Senha de Acesso</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ex: Senha#2026!"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono transition-colors"
                />
                <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-zinc-400">
                  <span className={newPassChecks.minLength ? 'text-emerald-400 font-medium' : ''}>
                    {newPassChecks.minLength ? '✓' : '○'} Mín. 8 caracteres
                  </span>
                  <span className={newPassChecks.hasUpper && newPassChecks.hasLower ? 'text-emerald-400 font-medium' : ''}>
                    {newPassChecks.hasUpper && newPassChecks.hasLower ? '✓' : '○'} Maiúsc./Minúsc.
                  </span>
                  <span className={newPassChecks.hasSpecial ? 'text-emerald-400 font-medium' : ''}>
                    {newPassChecks.hasSpecial ? '✓' : '○'} Caractere especial
                  </span>
                  <span className={newPassChecks.noAccents ? 'text-emerald-400 font-medium' : ''}>
                    {newPassChecks.noAccents ? '✓' : '○'} Sem acentos
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!newUserChecks.isValid || !newPassChecks.isValid}
                className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                  newUserChecks.isValid && newPassChecks.isValid
                    ? 'bg-white text-black hover:bg-zinc-200 cursor-pointer active:scale-98'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-70'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Gerar Login para Líder</span>
              </button>
            </form>
          </div>

          {/* Accounts List & Editor */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-3xl p-6 shadow-xl space-y-4 lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Contas de Líderes Ativas ({accounts.length})</h2>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">Modo Exclusivo Líder de GC</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[560px] pr-1 flex-1">
              {accounts.length === 0 ? (
                <div className="py-14 px-4 text-center rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Nenhuma conta de líder cadastrada ainda</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      Preencha o formulário ao lado com nome, célula, usuário e senha para gerar o primeiro acesso pronto para uso.
                    </p>
                  </div>
                </div>
              ) : (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all hover:border-zinc-700"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={acc.avatarUrl}
                        alt={acc.name}
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm">{acc.name}</p>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                            {acc.gcName}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Usuário: <code className="text-emerald-400 font-mono font-semibold">{acc.username}</code> • Senha: <code className="text-zinc-200 font-mono font-semibold">{acc.password}</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleStartEdit(acc)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Editar usuário e senha"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleCopy(acc)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copiar dados de acesso"
                      >
                        {copiedId === acc.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === acc.id ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors cursor-pointer"
                        title="Remover conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Modal: Editar Conta de Líder */}
        {editingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-[#18181B] border border-zinc-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Editar Acesso do Líder</h3>
                    <p className="text-xs text-zinc-400">Altere o nome, célula, usuário e senha</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium block">Nome do Líder</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium block">Nome do GC (Célula)</label>
                  <input
                    type="text"
                    value={editGcName}
                    onChange={(e) => setEditGcName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium block">Nome de Usuário</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-zinc-400">
                    <span className={editUserChecks.minLength ? 'text-emerald-400 font-medium' : ''}>
                      {editUserChecks.minLength ? '✓' : '○'} Mín. 8 caracteres
                    </span>
                    <span className={editUserChecks.hasUpper && editUserChecks.hasLower ? 'text-emerald-400 font-medium' : ''}>
                      {editUserChecks.hasUpper && editUserChecks.hasLower ? '✓' : '○'} Maiúsc./Minúsc.
                    </span>
                    <span className={editUserChecks.hasSpecial ? 'text-emerald-400 font-medium' : ''}>
                      {editUserChecks.hasSpecial ? '✓' : '○'} Caractere especial
                    </span>
                    <span className={editUserChecks.noAccents ? 'text-emerald-400 font-medium' : ''}>
                      {editUserChecks.noAccents ? '✓' : '○'} Sem acentos
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-medium block">Senha de Acesso</label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-zinc-400">
                    <span className={editPassChecks.minLength ? 'text-emerald-400 font-medium' : ''}>
                      {editPassChecks.minLength ? '✓' : '○'} Mín. 8 caracteres
                    </span>
                    <span className={editPassChecks.hasUpper && editPassChecks.hasLower ? 'text-emerald-400 font-medium' : ''}>
                      {editPassChecks.hasUpper && editPassChecks.hasLower ? '✓' : '○'} Maiúsc./Minúsc.
                    </span>
                    <span className={editPassChecks.hasSpecial ? 'text-emerald-400 font-medium' : ''}>
                      {editPassChecks.hasSpecial ? '✓' : '○'} Caractere especial
                    </span>
                    <span className={editPassChecks.noAccents ? 'text-emerald-400 font-medium' : ''}>
                      {editPassChecks.noAccents ? '✓' : '○'} Sem acentos
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!editUserChecks.isValid || !editPassChecks.isValid}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
