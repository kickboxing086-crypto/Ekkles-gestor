import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FrequencyChart } from './components/FrequencyChart';
import { NextGCs } from './components/NextGCs';
import { PastoralCare } from './components/PastoralCare';
import { ActivePrayers } from './components/ActivePrayers';
import { FinancialSummary } from './components/FinancialSummary';
import { MembersModule } from './components/MembersModule';
import { MeetingReportModal } from './components/MeetingReportModal';
import { ShareGcLinkModal } from './components/ShareGcLinkModal';
import { MemberPortalView } from './components/MemberPortalView';
import { LoginView } from './components/LoginView';
import { AdminAccountManager } from './components/AdminAccountManager';
import { EmailNoticeModal } from './components/EmailNoticeModal';
import { EditProfileModal } from './components/EditProfileModal';
import { BottomNav } from './components/BottomNav';
import { testConnection } from './firebase';
import {
  subscribeToGCs,
  subscribeToMembers,
  subscribeToPrayers,
  addMemberToFirestore,
  updateMemberStageInFirestore,
  markContactedInFirestore,
  addPrayerToFirestore,
  togglePrayInFirestore,
  saveMeetingReportToFirestore,
  seedInitialFirestoreData,
} from './services/firestoreService';
import {
  INITIAL_GCS,
  INITIAL_MEMBERS,
  INITIAL_PRAYERS,
  WEEKLY_FREQUENCY,
  AVAILABLE_ACCOUNTS,
} from './data/mockData';
import { Member, PrayerRequest, PipelineStage, UserAccount } from './types';
import {
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Users,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Share2,
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('painel');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Detect URL parameter for direct Member Portal access
  const [memberPortalGcId, setMemberPortalGcId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('portal_gc');
    } catch {
      return null;
    }
  });

  // Data states (synced with Firestore)
  const [gcs, setGcs] = useState(INITIAL_GCS);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [prayers, setPrayers] = useState<PrayerRequest[]>(INITIAL_PRAYERS);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEmailNoticeOpen, setIsEmailNoticeOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [shareGcId, setShareGcId] = useState<string>(INITIAL_GCS[0]?.id || 'gc-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentAccount, setCurrentAccount] = useState<UserAccount>(AVAILABLE_ACCOUNTS[0]);
  const isLeader = currentAccount.accountType === 'lider_gc';
  const activeGcs = isLeader 
    ? gcs.filter(g => g.id === currentAccount.gcId)
    : gcs;
  const activeMembers = isLeader
    ? members.filter(m => m.gcId === currentAccount.gcId)
    : members;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time Firestore sync & initial connection test
  useEffect(() => {
    testConnection();
    const unsubGCs = subscribeToGCs((loadedGCs) => {
      if (loadedGCs && loadedGCs.length > 0) setGcs(loadedGCs);
    });
    const unsubMembers = subscribeToMembers((loadedMembers) => {
      if (loadedMembers && loadedMembers.length > 0) setMembers(loadedMembers);
    });
    const unsubPrayers = subscribeToPrayers((loadedPrayers) => {
      if (loadedPrayers && loadedPrayers.length > 0) setPrayers(loadedPrayers);
    });

    return () => {
      unsubGCs();
      unsubMembers();
      unsubPrayers();
    };
  }, []);

  // Urgent alerts: members with >= 2 consecutive absences
  const urgentCount = members.filter((m) => m.consecutiveAbsences >= 2).length;

  // Toggle pray counter with Firestore persistence
  const handleTogglePray = (prayerId: string) => {
    const target = prayers.find((p) => p.id === prayerId);
    if (!target) return;
    const willPray = !target.userPrayed;

    setPrayers((prev) =>
      prev.map((p) => {
        if (p.id === prayerId) {
          return {
            ...p,
            userPrayed: willPray,
            prayingCount: willPray ? p.prayingCount + 1 : Math.max(0, p.prayingCount - 1),
          };
        }
        return p;
      })
    );
    togglePrayInFirestore(prayerId, target.prayingCount, willPray);
    showToast('Intercessão confirmada! Que Deus abençoe esse motivo.');
  };

  // Add new prayer to Firestore
  const handleAddPrayer = async (newPrayer: Omit<PrayerRequest, 'id' | 'prayingCount' | 'isAnswered' | 'userPrayed'>) => {
    const created: PrayerRequest = {
      ...newPrayer,
      id: `p-${Date.now()}`,
      prayingCount: 1,
      isAnswered: false,
      userPrayed: true,
    };
    setPrayers((prev) => [created, ...prev]);
    await addPrayerToFirestore(newPrayer);
    showToast('Novo pedido de oração incluído na lista da igreja!');
  };

  // Add member to Firestore
  const handleAddMember = async (newMemberData: Omit<Member, 'id'>) => {
    const tempId = `m-${Date.now()}`;
    const newMember: Member = {
      ...newMemberData,
      id: tempId,
    };
    setMembers((prev) => [newMember, ...prev]);
    await addMemberToFirestore(newMemberData);
    showToast(`Membro "${newMember.name}" cadastrado com sucesso!`);
  };

  // Update pipeline stage in Firestore
  const handleUpdateStage = async (memberId: string, newStage: PipelineStage) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, pipelineStage: newStage } : m))
    );
    await updateMemberStageInFirestore(memberId, newStage);
    showToast('Fase de consolidação atualizada com sucesso!');
  };

  // Mark follow-up done in Firestore
  const handleMarkContacted = async (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, consecutiveAbsences: 0, needsFollowUp: false, notes: 'Follow-up pastoral realizado nesta semana.' }
          : m
      )
    );
    await markContactedInFirestore(memberId);
    showToast('Contato pastoral registrado e situação regularizada!');
  };

  // Save new meeting report to Firestore
  const handleSaveMeeting = async (report: {
    gcId: string;
    topic: string;
    date: string;
    presentMemberIds: string[];
    visitorCount: number;
    visitorsNames: string[];
    offeringAmount: number;
    observations: string;
  }) => {
    const targetGc = gcs.find((g) => g.id === report.gcId);

    // Update local state immediately for snappy response
    setMembers((prev) =>
      prev.map((m) => {
        if (m.gcId === report.gcId) {
          const wasPresent = report.presentMemberIds.includes(m.id);
          const newAbsences = wasPresent ? 0 : m.consecutiveAbsences + 1;
          return {
            ...m,
            consecutiveAbsences: newAbsences,
            needsFollowUp: newAbsences >= 2,
            lastAttendance: wasPresent ? report.date : m.lastAttendance,
          };
        }
        return m;
      })
    );

    if (report.visitorsNames && report.visitorsNames.length > 0) {
      const newVisitors: Member[] = report.visitorsNames.map((name, i) => ({
        id: `v-${Date.now()}-${i}`,
        gcId: report.gcId,
        gcName: targetGc ? targetGc.name : 'GC Alpha',
        name,
        phone: '(A coletar)',
        birthDate: '2000-01-01',
        role: 'visitante',
        consecutiveAbsences: 0,
        needsFollowUp: false,
        pipelineStage: 'primeiro_contato',
        notes: `Visitante na reunião sobre "${report.topic}"`,
      }));
      setMembers((prev) => [...newVisitors, ...prev]);
    }

    // Persist to Firestore
    await saveMeetingReportToFirestore(report, members, targetGc);
    showToast('Reunião e frequências registradas com sucesso!');
  };

  // If member portal mode is active (either via link ?portal_gc=... or leader test preview)
  if (memberPortalGcId) {
    const targetGc = gcs.find((g) => g.id === memberPortalGcId) || gcs[0];
    return (
      <MemberPortalView
        gc={targetGc}
        onBackToAdmin={() => setMemberPortalGcId(null)}
        prayers={prayers}
        onAddPrayer={handleAddPrayer}
        onTogglePray={handleTogglePray}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginView
        onLogin={(acc) => {
          setCurrentAccount(acc);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  if (isAuthenticated && currentAccount.username === 'Samuel_01') {
    return (
      <AdminAccountManager
        currentAccount={currentAccount}
        onLogout={() => setIsAuthenticated(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
       {/* Retractable Sidebar with Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setMobileMenuOpen(false);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        urgentAlertsCount={urgentCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenNewMeeting={() => setIsMeetingModalOpen(true)}
        onOpenShareLink={() => {
          setShareGcId(activeGcs[0]?.id || 'gc-1');
          setIsShareModalOpen(true);
        }}
        onOpenEmailNotice={() => setIsEmailNoticeOpen(true)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        currentAccount={currentAccount}
      />

      {/* Main Content Area (shifted based on sidebar width) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Top Header matching mockup */}
        <Header
          onOpenNewMeeting={() => setIsMeetingModalOpen(true)}
          onOpenShareLink={() => {
            setShareGcId(activeGcs[0]?.id || 'gc-1');
            setIsShareModalOpen(true);
          }}
          onOpenEmailNotice={() => setIsEmailNoticeOpen(true)}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          urgentAlertsCount={urgentCount}
          onSelectTab={setCurrentTab}
          currentAccount={currentAccount}
          onLogout={() => setIsAuthenticated(false)}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 bg-[#18181B] border border-emerald-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Dynamic Main Body Content */}
        <main className="p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-4 sm:space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* TAB 1: PAINEL / DASHBOARD PRINCIPAL */}
          {currentTab === 'painel' && (
            <div className="space-y-6">
              {/* Quick contextual banner with link sharing */}
              <div className="bg-[#18181B]/80 border border-[#27272A] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[#FAFAFA] font-medium">
                    {isLeader ? `Seu GC: ${currentAccount.gcName}` : 'Dashboard Executivo:'}
                  </span>
                  <span className="text-[#A1A1AA]">
                    {isLeader ? 'Acompanhamento do Grupo Caseiro' : 'Semana de Encontros • Supervisor: Pr. Marcos Silva'}
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Online</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShareGcId(activeGcs[0]?.id || 'gc-1');
                      setIsShareModalOpen(true);
                    }}
                    className="text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 font-medium text-[11px] bg-emerald-600/20 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Enviar Link aos Membros</span>
                  </button>
                  <button
                    onClick={() => setIsMeetingModalOpen(true)}
                    className="bg-white hover:bg-zinc-200 text-black px-3 py-1.5 rounded-lg font-semibold text-[11px] transition-colors"
                  >
                    + Registrar Chamada
                  </button>
                </div>
              </div>

              {/* 1. Metric Cards Row (KPI Cards) */}
              <KPICards
                totalMembers={isLeader ? activeMembers.length : 236}
                averageAttendance={isLeader ? 85.0 : 61.2}
                activeGCs={isLeader ? 1 : gcs.length}
                monthVisitors={isLeader ? 3 : 73}
                onFilterClick={setCurrentTab}
                accountType={currentAccount.accountType}
                gcName={currentAccount.gcName}
              />

              {/* 2. Middle Row Grid matching reference mockup:
                  - Col 1: Resumo de Frequência Recente (Bar chart)
                  - Col 2: Próximos GCs
                  - Col 3: Cuidado Pastoral
              */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-[360px]">
                  <FrequencyChart />
                </div>
                <div className="h-[360px]">
                  <NextGCs
                    gcs={activeGcs}
                    accountType={currentAccount.accountType}
                    onOpenMeetingForGC={(gcId) => {
                      setShareGcId(gcId);
                      setIsMeetingModalOpen(true);
                    }}
                    onShareLink={(gcId) => {
                      setShareGcId(gcId);
                      setIsShareModalOpen(true);
                    }}
                  />
                </div>
                <div className="h-[360px]">
                  <PastoralCare
                    members={activeMembers}
                    accountType={currentAccount.accountType}
                    onMarkContacted={handleMarkContacted}
                  />
                </div>
              </div>

              {/* 3. Bottom Row Grid matching reference mockup:
                  - Col 1: Cuidado Pastoral / Consolidação Lista
                  - Col 2: Pedidos de Oração Ativos
                  - Col 3: Resumo Financeiro (Ofertas) com Curved Area Chart
              */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Additional pastoral follow-up block matching bottom-left of image */}
                <div className="h-[340px]">
                  <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 shadow-sm flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]">
                          CUIDADO PASTORAL & DISCIPULADO
                        </h2>
                        <p className="text-[11px] text-[#A1A1AA]">
                          Status de acompanhamento contínuo
                        </p>
                      </div>
                      <Users className="w-4 h-4 text-zinc-400" />
                    </div>

                    <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                      <div className="p-3 rounded-xl bg-[#27272A]/40 border border-[#27272A] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">João Pedro - 3 Faltas</p>
                          <p className="text-[10px] text-zinc-400">GC Alpha • 13 Membros ativos</p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                          13 Membros
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#27272A]/40 border border-[#27272A] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">GC Betel - Sala 3</p>
                          <p className="text-[10px] text-zinc-400">Anexo Betel • 19 Membros ativos</p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                          19 Membros
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#27272A]/40 border border-[#27272A] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">João Pedro - Silva</p>
                          <p className="text-[10px] text-zinc-400">GC Conexão • 10 Membros ativos</p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                          10 Membros
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#27272A]/80 flex items-center justify-between text-[11px] text-[#A1A1AA]">
                      <button
                        onClick={() => setCurrentTab('discipulado')}
                        className="text-zinc-300 hover:text-white font-medium flex items-center gap-1"
                      >
                        <span>Abrir Painel de Discipulado</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pedidos de Oração Ativos matching bottom-center of image */}
                <div className="h-[340px]">
                  <ActivePrayers
                    prayers={prayers}
                    onTogglePray={handleTogglePray}
                    onAddPrayer={handleAddPrayer}
                  />
                </div>

                {/* Resumo Financeiro (Ofertas) matching bottom-right of image */}
                <div className="h-[340px]">
                  <FinancialSummary />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBROS & PIPELINE DE CONSOLIDAÇÃO */}
          {currentTab === 'membros' && (
            <MembersModule
              members={members}
              gcs={gcs}
              onAddMember={handleAddMember}
              onUpdateStage={handleUpdateStage}
            />
          )}

          {/* TAB 3: GCs & ESCALAS */}
          {currentTab === 'gcs' && (
            <div className="space-y-6">
              <div className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-zinc-300" />
                    Células e Grupos Caseiros Cadastrados ({gcs.length})
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Controle de localização, liderança, anfitriões e datas de reunião semanal.
                  </p>
                </div>
                <button
                  onClick={() => setIsMeetingModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all shrink-0"
                >
                  + Lançar Frequência de Reunião
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gcs.map((gc) => (
                  <div
                    key={gc.id}
                    className="bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] rounded-2xl p-5 space-y-4 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold">
                          {gc.weekday} às {gc.time}
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5">{gc.name}</h3>
                        <p className="text-xs text-[#A1A1AA]">{gc.location}</p>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>

                    <div className="space-y-2 text-xs border-t border-[#27272A] pt-3">
                      <div className="flex justify-between">
                        <span className="text-[#A1A1AA]">Líder Principal:</span>
                        <span className="text-white font-medium">{gc.leaderName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A1A1AA]">Anfitrião:</span>
                        <span className="text-white font-medium">{gc.hostName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A1A1AA]">Endereço:</span>
                        <span className="text-zinc-300 text-right truncate max-w-[180px]">{gc.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A1A1AA]">Membros Ativos:</span>
                        <span className="font-mono text-emerald-400 font-semibold">{gc.memberCount} membros</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#27272A] flex items-center justify-between">
                      <button
                        onClick={() => {
                          setShareGcId(gc.id);
                          setIsShareModalOpen(true);
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Enviar Link</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMeetingModalOpen(true);
                        }}
                        className="text-xs text-zinc-300 hover:text-white font-medium"
                      >
                        Fazer Chamada
                      </button>
                      <button
                        onClick={() => setCurrentTab('membros')}
                        className="text-xs text-zinc-400 hover:text-white"
                      >
                        Membros →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FREQUÊNCIA & CHAMADA */}
          {currentTab === 'frequencia' && (
            <div className="space-y-6">
              <div className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Histórico & Registro de Frequência das Células
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Média geral do mês: 61,2% de presença presencial nos GCs.
                  </p>
                </div>
                <button
                  onClick={() => setIsMeetingModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all shadow"
                >
                  + Abrir Chamada Rápida
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[380px]">
                  <FrequencyChart />
                </div>
                <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Últimas Reuniões Registradas
                  </h3>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">GC Alpha - Casa de Ana</p>
                        <p className="text-zinc-400 text-[11px]">Tema: "Fundamentos da Oração Eficaz"</p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-mono font-bold block">18 presentes</span>
                        <span className="text-zinc-500 text-[10px]">4 visitantes</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">GC Betel - Sala 3</p>
                        <p className="text-zinc-400 text-[11px]">Tema: "Vivendo em Comunhão Verdadeira"</p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-mono font-bold block">15 presentes</span>
                        <span className="text-zinc-500 text-[10px]">2 visitantes</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">GC Conexão Jovem</p>
                        <p className="text-zinc-400 text-[11px]">Tema: "Identidade Inabalável em Cristo"</p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-mono font-bold block">24 presentes</span>
                        <span className="text-zinc-500 text-[10px]">8 visitantes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DISCIPULADO & CUIDADO PASTORAL */}
          {currentTab === 'discipulado' && (
            <div className="space-y-6">
              <div className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <h2 className="text-xl font-bold text-white">
                    Discipulado & Monitoramento de Alertas Pastorais
                  </h2>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-1 max-w-2xl">
                  Garante que nenhuma ovelha fique desassistida. Membros com 2 ou mais faltas consecutivas recebem aviso prioritário e canal direto para contato no WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PastoralCare members={members} onMarkContacted={handleMarkContacted} />
                <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Diretrizes para o Follow-Up Pastoral
                  </h3>
                  <div className="space-y-3 text-xs text-zinc-300">
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <p className="font-semibold text-white mb-1">1ª Falta: Acolhimento Leve</p>
                      <p className="text-zinc-400">Mensagem carinhosa no dia seguinte dizendo que a presença da pessoa fez falta.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <p className="font-semibold text-amber-300 mb-1">2ª Falta: Contato do Líder</p>
                      <p className="text-zinc-400">Ligação ou visita do líder do GC para entender se há motivo de enfermidade, crise familiar ou escala de trabalho.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <p className="font-semibold text-rose-300 mb-1">3ª Falta: Intervenção Pastoral</p>
                      <p className="text-zinc-400">Notificação enviada ao Pastor de Rede para visita presencial e oração de restauração.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: RELATÓRIOS */}
          {currentTab === 'relatorios' && (
            <div className="space-y-6">
              <div className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Relatórios Consolidados de Crescimento
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Métricas de frequência, ofertas, consolidação e índice de multiplicação.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#27272A] hover:bg-[#3F3F46] text-white border border-[#3F3F46]"
                >
                  Imprimir Relatório
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FrequencyChart />
                <FinancialSummary />
              </div>
            </div>
          )}

          {/* TAB 7: PEDIDOS DE ORAÇÃO */}
          {currentTab === 'pedidos' && (
            <div className="space-y-6">
              <div className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl">
                <h2 className="text-xl font-bold text-white">
                  Mural de Pedidos de Oração & Intercessão
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Intercessão ativa para enfermos, famílias, ministérios e vidas em processo de consolidação.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivePrayers
                  prayers={prayers}
                  onTogglePray={handleTogglePray}
                  onAddPrayer={handleAddPrayer}
                />

                <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Testemunhos & Graças Alcançadas
                  </h3>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">Família Souza - Cura Concedida</span>
                    </div>
                    <p className="text-xs text-zinc-300">
                      "O pequeno Miguel recebeu alta médica do hospital sem nenhuma sequela após a oração conjunta de toda a rede de células!"
                    </p>
                    <span className="text-[10px] text-zinc-500 font-mono block">Confirmado em 10/06</span>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* TAB 9: CONFIGURAÇÕES */}
          {currentTab === 'configuracoes' && (
            <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 space-y-5 max-w-2xl">
              <h2 className="text-lg font-bold text-white">Configurações Gerais do Sistema de Células</h2>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Nome da Igreja / Ministério</label>
                  <input
                    type="text"
                    defaultValue="Igreja Batista Central - Rede de Células"
                    className="w-full bg-zinc-900 border border-[#27272A] rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Limite de Faltas para Alerta Pastoral</label>
                  <input
                    type="number"
                    defaultValue={2}
                    className="w-full bg-zinc-900 border border-[#27272A] rounded-xl p-2.5 text-white font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 block mt-1">
                    Membros que atingirem este limite aparecerão automaticamente na lista crítica de follow-up.
                  </span>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Pastor Responsável Geral</label>
                  <input
                    type="text"
                    defaultValue="Pr. Marcos Silva"
                    className="w-full bg-zinc-900 border border-[#27272A] rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => showToast('Configurações salvas com sucesso!')}
                    className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Reunião / Chamada Rápida Modal */}
      <MeetingReportModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        gcs={gcs}
        members={members}
        onSaveMeeting={handleSaveMeeting}
      />

      {/* Compartilhar Link com Membros Modal */}
      <ShareGcLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        gcs={gcs}
        initialGcId={shareGcId}
        onPreviewMemberPortal={(gcId) => {
          setMemberPortalGcId(gcId);
        }}
      />

      {/* Notificação por E-mail & Envio de Código (Gmail OAuth) */}
      <EmailNoticeModal
        isOpen={isEmailNoticeOpen}
        onClose={() => setIsEmailNoticeOpen(false)}
        gc={activeGcs[0] || gcs[0]}
        members={activeMembers}
        leaderName={currentAccount.name}
      />

      {/* Editar Senha e Perfil de Líder */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentAccount={currentAccount}
        gc={activeGcs[0] || gcs[0]}
        onSave={(updatedAccount, updatedGc) => {
          setCurrentAccount(prev => ({ ...prev, ...updatedAccount }));
          if (updatedGc) {
            setGcs(prev => prev.map(g => g.id === (activeGcs[0]?.id || 'gc-1') ? { ...g, ...updatedGc } : g));
          }
          showToast('Perfil e credenciais atualizados com sucesso!');
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewMeeting={() => setIsMeetingModalOpen(true)}
        onOpenShareLink={() => {
          setShareGcId(gcs[0]?.id || 'gc-1');
          setIsShareModalOpen(true);
        }}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        urgentAlertsCount={urgentCount}
      />
    </div>
  );
}
