import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { GC, Member, PrayerRequest, MeetingReport, PipelineStage } from '../types';
import { INITIAL_GCS, INITIAL_MEMBERS, INITIAL_PRAYERS } from '../data/mockData';

const GCS_COLLECTION = 'gcs';
const MEMBERS_COLLECTION = 'members';
const PRAYERS_COLLECTION = 'prayers';
const MEETINGS_COLLECTION = 'meetings';

// ============================================================================
// SEED INITIAL DATA IF FIRESTORE IS EMPTY
// ============================================================================
export async function seedInitialFirestoreData() {
  try {
    const gcSnap = await getDocs(collection(db, GCS_COLLECTION));
    if (gcSnap.empty) {
      console.log('Seeding initial GCs to Firestore...');
      for (const gc of INITIAL_GCS) {
        await setDoc(doc(db, GCS_COLLECTION, gc.id), {
          ...gc,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const memberSnap = await getDocs(collection(db, MEMBERS_COLLECTION));
    if (memberSnap.empty) {
      console.log('Seeding initial Members to Firestore...');
      for (const member of INITIAL_MEMBERS) {
        await setDoc(doc(db, MEMBERS_COLLECTION, member.id), {
          ...member,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const prayerSnap = await getDocs(collection(db, PRAYERS_COLLECTION));
    if (prayerSnap.empty) {
      console.log('Seeding initial Prayers to Firestore...');
      for (const prayer of INITIAL_PRAYERS) {
        await setDoc(doc(db, PRAYERS_COLLECTION, prayer.id), {
          ...prayer,
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.warn('Initial seeding encountered an error or offline state:', error);
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToGCs(onUpdate: (gcs: GC[]) => void): () => void {
  const path = GCS_COLLECTION;
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // If empty, trigger async seed
        seedInitialFirestoreData();
        onUpdate(INITIAL_GCS);
        return;
      }
      const data: GC[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<GC, 'id'>),
      }));
      onUpdate(data);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToMembers(onUpdate: (members: Member[]) => void): () => void {
  const path = MEMBERS_COLLECTION;
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_MEMBERS);
        return;
      }
      const data: Member[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Member, 'id'>),
      }));
      onUpdate(data);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToPrayers(onUpdate: (prayers: PrayerRequest[]) => void): () => void {
  const path = PRAYERS_COLLECTION;
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(INITIAL_PRAYERS);
        return;
      }
      const data: PrayerRequest[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<PrayerRequest, 'id'>),
      }));
      onUpdate(data);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ============================================================================
// MUTATIONS (SAVES & UPDATES)
// ============================================================================

export async function addMemberToFirestore(newMember: Omit<Member, 'id'>): Promise<string> {
  const path = MEMBERS_COLLECTION;
  const newId = `m-${Date.now()}`;
  try {
    await setDoc(doc(db, path, newId), {
      ...newMember,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return newId;
  }
}

export async function updateMemberStageInFirestore(memberId: string, newStage: PipelineStage) {
  const path = `${MEMBERS_COLLECTION}/${memberId}`;
  try {
    await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), {
      pipelineStage: newStage,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markContactedInFirestore(memberId: string) {
  const path = `${MEMBERS_COLLECTION}/${memberId}`;
  try {
    await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), {
      consecutiveAbsences: 0,
      needsFollowUp: false,
      notes: 'Contato pastoral realizado nesta semana.',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addPrayerToFirestore(
  newPrayer: Omit<PrayerRequest, 'id' | 'prayingCount' | 'isAnswered' | 'userPrayed'>
): Promise<string> {
  const path = PRAYERS_COLLECTION;
  const newId = `p-${Date.now()}`;
  try {
    await setDoc(doc(db, path, newId), {
      ...newPrayer,
      id: newId,
      prayingCount: 1,
      isAnswered: false,
      createdAt: new Date().toISOString(),
    });
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return newId;
  }
}

export async function togglePrayInFirestore(prayerId: string, currentCount: number, increment: boolean) {
  const path = `${PRAYERS_COLLECTION}/${prayerId}`;
  try {
    await updateDoc(doc(db, PRAYERS_COLLECTION, prayerId), {
      prayingCount: increment ? currentCount + 1 : Math.max(0, currentCount - 1),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveMeetingReportToFirestore(
  report: {
    gcId: string;
    topic: string;
    date: string;
    presentMemberIds: string[];
    visitorCount: number;
    visitorsNames: string[];
    offeringAmount: number;
    observations: string;
  },
  currentMembers: Member[],
  currentGc?: GC
) {
  const meetingId = `mt-${Date.now()}`;
  const meetingPath = `${MEETINGS_COLLECTION}/${meetingId}`;

  try {
    // 1. Save Meeting
    await setDoc(doc(db, MEETINGS_COLLECTION, meetingId), {
      ...report,
      id: meetingId,
      gcName: currentGc?.name || 'GC',
      createdAt: new Date().toISOString(),
    });

    // 2. Update Member Absences in Firestore
    for (const member of currentMembers) {
      if (member.gcId === report.gcId) {
        const wasPresent = report.presentMemberIds.includes(member.id);
        const newAbsences = wasPresent ? 0 : member.consecutiveAbsences + 1;
        await updateDoc(doc(db, MEMBERS_COLLECTION, member.id), {
          consecutiveAbsences: newAbsences,
          needsFollowUp: newAbsences >= 2,
          lastAttendance: wasPresent ? report.date : (member.lastAttendance || report.date),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 3. If visitors, create member records in pipeline
    if (report.visitorsNames && report.visitorsNames.length > 0) {
      for (let i = 0; i < report.visitorsNames.length; i++) {
        const name = report.visitorsNames[i];
        const vId = `v-${Date.now()}-${i}`;
        await setDoc(doc(db, MEMBERS_COLLECTION, vId), {
          id: vId,
          gcId: report.gcId,
          gcName: currentGc ? currentGc.name : 'GC Alpha',
          name,
          phone: '(A coletar)',
          birthDate: '2000-01-01',
          role: 'visitante',
          consecutiveAbsences: 0,
          needsFollowUp: false,
          pipelineStage: 'primeiro_contato',
          notes: `Visitante na reunião sobre "${report.topic}"`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, meetingPath);
  }
}
