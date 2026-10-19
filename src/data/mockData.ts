import { GC, Member, PrayerRequest, Scale, WeeklyFrequency, UserAccount } from '../types';

export const getMasterAccount = (): UserAccount => {
  const customPass = typeof window !== 'undefined' ? localStorage.getItem('ekkles_master_password') : null;
  return {
    id: 'acc-master-samuel',
    name: 'Samuel (Administrador Master)',
    role: 'Gerador de Contas / Admin',
    accountType: 'pastor',
    email: 'samuellsilvva02@gmail.com',
    username: 'Samuel_01',
    password: customPass || '072131Sa@',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    phone: '(11) 99999-9999',
    gcId: 'all',
    gcName: 'Painel de Gestão de Contas',
  };
};

export const saveMasterPassword = (newPassword: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ekkles_master_password', newPassword);
  }
};

export const MASTER_ACCOUNT: UserAccount = getMasterAccount();

export const AVAILABLE_ACCOUNTS: UserAccount[] = [];

export const INITIAL_USER: UserAccount = MASTER_ACCOUNT;

export const INITIAL_GCS: GC[] = [
  {
    id: 'gc-1',
    name: 'GC Exemplo Principal',
    location: 'Sala de Reuniões / Residência',
    address: 'Rua Principal, 100 - Centro',
    weekday: 'Quarta-feira',
    time: '20:00',
    leaderId: 'u-1',
    leaderName: 'Líder de GC',
    coLeaderName: 'Co-líder',
    hostName: 'Anfitrião',
    memberCount: 15,
    active: true,
    theme: 'Comunhão, Palavra e Crescimento',
    verse: '“Pois onde estiverem dois ou três reunidos em meu nome, ali estou eu no meio deles.” — Mateus 18:20',
    pixKey: 'pix.gc@igreja.com.br',
    whatsappGroup: 'https://chat.whatsapp.com/exemplo',
    rsvpCount: 10,
  },
  {
    id: 'gc-2',
    name: 'GC Exemplo Secundário',
    location: 'Anexo da Igreja',
    address: 'Av. Central, 500',
    weekday: 'Quinta-feira',
    time: '19:30',
    leaderId: 'u-2',
    leaderName: 'Líder de GC',
    coLeaderName: 'Co-líder',
    hostName: 'Anfitrião',
    memberCount: 12,
    active: true,
    theme: 'Discipulado e Frutos',
    verse: '“Eu sou a videira, vós, as varas...” — João 15:5',
    pixKey: 'pix.gc2@igreja.com.br',
    whatsappGroup: 'https://chat.whatsapp.com/exemplo2',
    rsvpCount: 8,
  },
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm-1',
    gcId: 'gc-1',
    gcName: 'GC Exemplo Principal',
    name: 'Membro Exemplo 1',
    phone: '+55 11 98888-1111',
    email: 'membro1@ekkles.com',
    birthDate: '1995-04-12',
    role: 'membro',
    consecutiveAbsences: 0,
    lastAttendance: '14/10/2026',
    needsFollowUp: false,
    pipelineStage: 'integrado',
    notes: 'Membro ativo e participante.',
  },
  {
    id: 'm-2',
    gcId: 'gc-1',
    gcName: 'GC Exemplo Principal',
    name: 'Membro Exemplo 2',
    phone: '+55 11 98888-2222',
    email: 'membro2@ekkles.com',
    birthDate: '1998-09-20',
    role: 'membro',
    consecutiveAbsences: 1,
    lastAttendance: '07/10/2026',
    needsFollowUp: true,
    pipelineStage: 'em_acompanhamento',
    notes: 'Necessita de contato pastoral.',
  },
  {
    id: 'm-3',
    gcId: 'gc-2',
    gcName: 'GC Exemplo Secundário',
    name: 'Visitante Exemplo',
    phone: '+55 11 98888-3333',
    email: 'visitante@ekkles.com',
    birthDate: '2000-01-15',
    role: 'visitante',
    consecutiveAbsences: 0,
    lastAttendance: '14/10/2026',
    needsFollowUp: false,
    pipelineStage: 'primeiro_contato',
    notes: 'Primeira visita ao grupo.',
  },
];

export const INITIAL_SCALES: Record<string, Scale> = {
  'gc-1': {
    id: 'sc-1',
    gcId: 'gc-1',
    gcName: 'GC Exemplo Principal',
    date: '21/10/2026 - 20h00',
    anfitriao: 'Anfitrião Designado',
    louvor: 'Equipe de Louvor',
    palavra: 'Líder do GC',
    lanche: 'Comunhão Compartilhada',
    intercessao: 'Equipe de Intercessão',
  },
  'gc-2': {
    id: 'sc-2',
    gcId: 'gc-2',
    gcName: 'GC Exemplo Secundário',
    date: '22/10/2026 - 19h30',
    anfitriao: 'Anfitrião Designado',
    louvor: 'Equipe de Louvor',
    palavra: 'Líder do GC',
    lanche: 'Comunhão Compartilhada',
    intercessao: 'Equipe de Intercessão',
  },
};

export const INITIAL_PRAYERS: PrayerRequest[] = [
  {
    id: 'p-1',
    authorName: 'Membro Exemplo 1',
    authorPhone: '+55 11 98888-1111',
    gcName: 'GC Exemplo Principal',
    request: 'Pedido de oração por família, saúde e provisão profissional.',
    date: '15/10',
    prayingCount: 5,
    isAnswered: false,
    userPrayed: false,
  },
  {
    id: 'p-2',
    authorName: 'Líder de GC',
    authorPhone: '+55 11 99999-9999',
    gcName: 'Geral',
    request: 'Pela expansão dos grupos caseiros e edificação espiritual da igreja.',
    date: '15/10',
    prayingCount: 12,
    isAnswered: false,
    userPrayed: true,
  },
];

export const WEEKLY_FREQUENCY: WeeklyFrequency[] = [
  { week: 'Sem 1', members: 10, visitors: 3, total: 13, percentage: 70 },
  { week: 'Sem 2', members: 12, visitors: 4, total: 16, percentage: 75 },
  { week: 'Sem 3', members: 11, visitors: 5, total: 16, percentage: 72 },
  { week: 'Sem 4', members: 14, visitors: 6, total: 20, percentage: 85 },
];

export const FINANCIAL_DATA = {
  totalMonth: 1200,
  averagePerGC: 600,
  lastMonth: 1050,
  growthPercentage: 14.2,
  weeklyPoints: [
    { label: 'Sem 1', amount: 250 },
    { label: 'Sem 2', amount: 300 },
    { label: 'Sem 3', amount: 320 },
    { label: 'Sem 4', amount: 330 },
  ],
};
