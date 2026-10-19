export type Role = 'pastor' | 'lider' | 'vice_lider' | 'anfitriao' | 'membro' | 'visitante';

export type PipelineStage = 'primeiro_contato' | 'em_acompanhamento' | 'integrado' | 'batizado';

export type AccountType = 'pastor' | 'lider_gc';

export interface UserAccount {
  id: string;
  name: string;
  role: string;
  accountType: AccountType;
  email: string;
  username: string;
  password: string;
  avatarUrl: string;
  phone?: string;
  gcId?: string; // If lider_gc, the specific GC ID managed
  gcName?: string; // Display name of the specific GC
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  phone?: string;
}

export interface GC {
  id: string;
  name: string;
  location: string;
  address: string;
  weekday: string;
  time: string;
  leaderId: string;
  leaderName: string;
  coLeaderName?: string;
  hostName: string;
  memberCount: number;
  active: boolean;
  theme?: string;
  verse?: string;
  pixKey?: string;
  whatsappGroup?: string;
  rsvpCount?: number;
}

export interface Member {
  id: string;
  gcId: string;
  gcName: string;
  name: string;
  phone: string;
  email?: string;
  birthDate: string;
  role: Role;
  consecutiveAbsences: number;
  lastAttendance?: string;
  needsFollowUp: boolean;
  avatarUrl?: string;
  pipelineStage?: PipelineStage;
  notes?: string;
}

export interface Scale {
  id: string;
  gcId: string;
  gcName: string;
  date: string;
  anfitriao: string;
  louvor: string;
  palavra: string;
  lanche: string;
  intercessao?: string;
}

export interface PrayerRequest {
  id: string;
  authorName: string;
  authorPhone?: string;
  gcName: string;
  request: string;
  date: string;
  prayingCount: number;
  isAnswered: boolean;
  userPrayed?: boolean;
}

export interface MeetingReport {
  id: string;
  gcId: string;
  gcName: string;
  date: string;
  topic: string;
  presentMemberIds: string[];
  visitorCount: number;
  visitorsNames: string[];
  offeringAmount: number;
  observations: string;
}

export interface WeeklyFrequency {
  week: string;
  members: number;
  visitors: number;
  total: number;
  percentage: number;
}
