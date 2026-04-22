import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  query, 
  onSnapshot,
  addDoc,
  setDoc,
  serverTimestamp,
  orderBy,
  limit,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth();

// --- Types ---

export interface CrisisEvent {
  id?: string;
  crisisType: 'fire' | 'smoke' | 'intrusion' | 'panic';
  floor: number;
  roomNumber: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: any;
  status: 'active' | 'contained' | 'resolved';
  description?: string;
}

export interface RoomStatus {
  id?: string;
  roomNumber: string;
  floor: number;
  occupancyStatus: 'evacuated' | 'occupied' | 'unknown';
  hasAlert: boolean;
  lastCheckIn?: any;
}

export interface ResponderUnit {
  id?: string;
  unitId: string;
  commander: string;
  sectorId: string;
  status: 'standby' | 'patrol' | 'active' | 'evacuating';
  lastActive?: any;
}

export interface OperationalLog {
  id?: string;
  timestamp: any;
  event: string;
  source: string;
  status: string;
  category: 'system' | 'security' | 'alert' | 'hardware';
}

// --- Crisis Handlers ---

export const streamCrises = (callback: (crises: CrisisEvent[]) => void) => {
  const q = query(
    collection(db, 'crises'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const crises = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CrisisEvent));
    callback(crises);
  }, (error) => {
    console.error("Crises stream failed:", error);
  });
};

export const triggerCrisis = async (crisis: Omit<CrisisEvent, 'timestamp' | 'status'>) => {
  const docRef = await addDoc(collection(db, 'crises'), {
    ...crisis,
    timestamp: serverTimestamp(),
    status: 'active'
  });
  
  await addLog({
    event: `CRISIS ACTIVATED: ${crisis.crisisType.toUpperCase()}`,
    source: `Floor ${crisis.floor} Sensor`,
    status: 'warning',
    category: 'alert'
  });
  
  return docRef;
};

export const clearAllCrises = async () => {
  const q = query(collection(db, 'crises'));
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletePromises);
  
  await addLog({
     event: 'SYSTEM RESET: ALL CRISES RESOLVED',
     source: 'Admin Override',
     status: 'success',
     category: 'system'
  });
};

// --- Room Handlers ---

export const streamRooms = (callback: (rooms: RoomStatus[]) => void) => {
  return onSnapshot(collection(db, 'rooms'), (snapshot) => {
    const rooms = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RoomStatus));
    callback(rooms);
  }, (error) => {
    console.error("Rooms stream failed:", error);
  });
};

export const updateRoomStatus = async (roomId: string, status: Partial<RoomStatus>) => {
  return await setDoc(doc(db, 'rooms', roomId), status, { merge: true });
};

// --- Unit Handlers ---

export const streamUnits = (callback: (units: ResponderUnit[]) => void) => {
  return onSnapshot(collection(db, 'units'), (snapshot) => {
    const units = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ResponderUnit));
    callback(units);
  }, (error) => {
    console.error("Units stream failed:", error);
  });
};

// --- Log Handlers ---

export const streamLogs = (callback: (logs: OperationalLog[]) => void) => {
  const q = query(
    collection(db, 'logs'),
    orderBy('timestamp', 'desc'),
    limit(100)
  );
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OperationalLog));
    callback(logs);
  }, (error) => {
    console.error("Logs stream failed:", error);
  });
};

export const addLog = async (log: Omit<OperationalLog, 'timestamp'>) => {
  return await addDoc(collection(db, 'logs'), {
    ...log,
    timestamp: serverTimestamp()
  });
};

// --- Seed Data ---

export const seedDatabase = async () => {
  try {
    const units = [
      { unitId: 'ALPHA-01', commander: 'Vance R.', sectorId: 'Sector G', status: 'active' },
      { unitId: 'BRAVO-02', commander: 'Chen M.', sectorId: 'North Wing', status: 'patrol' },
      { unitId: 'CHARLIE-03', commander: 'Smith J.', sectorId: 'Main Lobby', status: 'standby' },
      { unitId: 'DELTA-04', commander: 'Lopez K.', sectorId: 'Sector B', status: 'evacuating' }
    ];
    for (const u of units) {
      await addDoc(collection(db, 'units'), { ...u, lastActive: serverTimestamp() });
    }

    const logs = [
      { event: 'Batch Inbound: 45 Guests', source: 'North Gate Hub', status: 'normal', category: 'system' },
      { event: 'Sensor Latency Detected', source: 'South Wing Exit B', status: 'warning', category: 'hardware' },
      { event: 'Roster Sync Complete', source: 'Automated Task', status: 'success', category: 'system' },
      { event: 'Zone Cleared: Pool Side', source: 'Manual Patrol', status: 'success', category: 'security' },
      { event: 'Hardware Self-Test', source: 'Routine Check', status: 'normal', category: 'hardware' },
      { event: 'Emergency Kit Audit', source: 'Inventory Bot', status: 'normal', category: 'security' },
      { event: 'Encryption Handshake', source: 'Main Bridge', status: 'success', category: 'system' },
      { event: 'Low Battery: Unit 04', source: 'Sector B Hub', status: 'warning', category: 'hardware' },
      { event: 'Vulnerability Scan Complete', source: 'Sentinel Core', status: 'success', category: 'security' },
      { event: 'Patrol Route Updated', source: 'Manual Admin', status: 'normal', category: 'security' },
      { event: 'Air Quality Nominal', source: 'Climate Control', status: 'success', category: 'system' },
      { event: 'CCTV Blindspot Warning', source: 'Visual Engine', status: 'warning', category: 'hardware' },
      { event: 'Resource Manifest Sync', source: 'Inventory Engine', status: 'success', category: 'system' },
      { event: 'Unauthorized Access Attempt', source: 'Server Room', status: 'warning', category: 'security' },
      { event: 'Cloud Backup Complete', source: 'Google Cloud Sync', status: 'success', category: 'system' }
    ];
    for (const l of logs) {
      await addDoc(collection(db, 'logs'), { ...l, timestamp: serverTimestamp() });
    }
    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Database seed failed:", error);
    throw error;
  }
};
