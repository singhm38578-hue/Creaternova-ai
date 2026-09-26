import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocFromServer,
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  FirebaseStorage
} from 'firebase/storage';
import firebaseConfigRaw from '../../firebase-applet-config.json';

// Validate config presence
export const isFirebaseConfigured = Boolean(
  firebaseConfigRaw &&
  firebaseConfigRaw.projectId &&
  firebaseConfigRaw.apiKey &&
  !firebaseConfigRaw.apiKey.includes('YOUR_')
);

export const firebaseConfig = {
  projectId: firebaseConfigRaw.projectId,
  appId: firebaseConfigRaw.appId,
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  firestoreDatabaseId: firebaseConfigRaw.firestoreDatabaseId || '(default)',
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
};

// Initialize App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore targeting the provisioned database ID
export const db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Storage
export const storage: FirebaseStorage = getStorage(app);

// Test connection on boot according to skill guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    // getDocFromServer validates network reachability
    await getDocFromServer(doc(db, 'test', 'connection')).catch((err) => {
      // Missing document is expected and means connection succeeded
      if (err?.code === 'not-found' || err?.message?.includes('not found')) {
        return;
      }
      throw err;
    });
    return true;
  } catch (error: any) {
    if (error?.message?.includes('offline') || error?.code === 'unavailable') {
      console.warn('Firestore is currently unreachable or offline. Check network permissions.');
      return false;
    }
    // Connected even if permission denied on test doc
    return true;
  }
}

// -------------------------------------------------------------
// AUTHENTICATION ARCHITECTURE
// -------------------------------------------------------------

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function registerWithEmail(email: string, pass: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && cred.user) {
    await updateProfile(cred.user, { displayName: name });
  }
  // Initialize user profile in Firestore
  await initUserProfile(cred.user.uid, {
    name: name || email.split('@')[0],
    email,
    photoURL: cred.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
  });
  return cred.user;
}

export async function loginWithEmail(email: string, pass: string) {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  if (cred.user) {
    // Ensure profile document exists
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (!userDoc.exists()) {
      await initUserProfile(cred.user.uid, {
        name: cred.user.displayName || 'Creator',
        email: cred.user.email || '',
        photoURL: cred.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cred.user.uid)}`,
      });
    }
  }
  return cred.user;
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  await signOut(auth);
}

// -------------------------------------------------------------
// USER PROFILE & CREDITS (users/{uid})
// -------------------------------------------------------------

export interface FirestoreUserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'creator' | 'business';
  billingCycle: 'monthly' | 'yearly';
  credits: number;
  creditBalance: number;
  creditResetDate: string;
  monthlyAllocation: number;
  preferredLanguage: string;
  creatorNiche?: string;
  defaultPlatform?: string;
  createdAt: string;
  updatedAt: string;
}

export async function initUserProfile(uid: string, data: { name: string; email: string; photoURL?: string }) {
  const now = new Date().toISOString();
  const resetDate = new Date(Date.now() + 30 * 86400000).toISOString();
  const profile: FirestoreUserProfile = {
    uid,
    name: data.name,
    email: data.email,
    photoURL: data.photoURL,
    role: data.email.includes('admin') ? 'admin' : 'user',
    plan: 'free',
    billingCycle: 'monthly',
    credits: 50,
    creditBalance: 50,
    creditResetDate: resetDate,
    monthlyAllocation: 50,
    preferredLanguage: 'English',
    creatorNiche: 'Content Creation',
    defaultPlatform: 'YouTube Shorts',
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'users', uid), profile, { merge: true });

  // Initial Brand Kit setup
  await setDoc(doc(db, 'users', uid, 'brandKits', 'default'), {
    userId: uid,
    channelName: `${data.name}'s Studio`,
    channelNiche: 'General Content',
    targetAudience: 'Global Audience',
    preferredLanguage: 'English',
    preferredVisualStyle: 'Cinematic High-Contrast',
    defaultVideoStyle: 'High-Retention Shorts',
    toneOfVoice: 'Energetic, Curious & Authoritative',
    recurringCharacterDescription: 'Dr. Nova, an energetic robotic cosmic guide with deep violet plating and glowing cyan eyes',
    preferredCta: 'Subscribe for daily insights!',
    updatedAt: now,
  });

  // Record initial grant transaction
  await recordCreditTransaction(uid, {
    type: 'monthly_allocation',
    amount: 50,
    balanceBefore: 0,
    balanceAfter: 50,
    operation: 'initial_free_allocation',
    projectId: null,
    status: 'completed',
    createdAt: now,
  });

  return profile;
}

export async function getUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    ...data,
    creditBalance: typeof data.creditBalance === 'number' ? data.creditBalance : (data.credits || 50),
    creditResetDate: data.creditResetDate || new Date(Date.now() + 30 * 86400000).toISOString(),
  } as FirestoreUserProfile;
}

export function subscribeToUserWallet(uid: string, onUpdate: (profile: FirestoreUserProfile) => void) {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snap: any) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        onUpdate({
          ...data,
          creditBalance: typeof data.creditBalance === 'number' ? data.creditBalance : (data.credits || 50),
          creditResetDate: data.creditResetDate || new Date(Date.now() + 30 * 86400000).toISOString(),
        } as FirestoreUserProfile);
      }
    },
    (err: any) => {
      console.warn('Wallet onSnapshot listener warning:', err?.message || err);
    }
  );
}

export async function updateUserProfile(uid: string, updates: Partial<FirestoreUserProfile>) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

// -------------------------------------------------------------
// CREDIT TRANSACTIONS (users/{uid}/creditTransactions/{txId})
// -------------------------------------------------------------

export interface CreditTransactionRecord {
  id?: string;
  userId: string;
  type: 'monthly_allocation' | 'generation_debit' | 'refund' | 'bonus' | 'admin_adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  operation: string;
  projectId?: string | null;
  status: 'completed' | 'refunded' | 'failed';
  createdAt: string;
}

export async function recordCreditTransaction(
  uid: string,
  tx: Omit<CreditTransactionRecord, 'userId'>
) {
  const txId = tx.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullTx: CreditTransactionRecord = {
    ...tx,
    id: txId,
    userId: uid,
    createdAt: tx.createdAt || new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid, 'creditTransactions', txId), fullTx);
  return fullTx;
}

export async function getCreditTransactions(uid: string, max: number = 50): Promise<CreditTransactionRecord[]> {
  try {
    const q = query(
      collection(db, 'users', uid, 'creditTransactions'),
      orderBy('createdAt', 'desc'),
      limit(max)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as CreditTransactionRecord);
  } catch (e) {
    // If index or field pending, fallback to un-ordered query
    const q = query(collection(db, 'users', uid, 'creditTransactions'), limit(max));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data() as CreditTransactionRecord);
    return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
}

// -------------------------------------------------------------
// PROJECTS (users/{uid}/projects/{projectId})
// -------------------------------------------------------------

export async function getFirestoreProjects(uid: string): Promise<any[]> {
  const colRef = collection(db, 'users', uid, 'projects');
  const snap = await getDocs(colRef);
  const projects = snap.docs.map((d) => d.data());
  return projects.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

export async function getFirestoreProject(uid: string, projectId: string): Promise<any | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'projects', projectId));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function saveFirestoreProject(uid: string, project: any): Promise<any> {
  const now = new Date().toISOString();
  const docRef = doc(db, 'users', uid, 'projects', project.id);
  const data = {
    ...project,
    userId: uid,
    updatedAt: now,
    createdAt: project.createdAt || now,
  };
  await setDoc(docRef, data, { merge: true });
  return data;
}

export async function deleteFirestoreProject(uid: string, projectId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'projects', projectId));
}

// -------------------------------------------------------------
// AGENT PLANS (users/{uid}/agentPlans/{planId})
// -------------------------------------------------------------

export async function getFirestoreAgentPlans(uid: string): Promise<any[]> {
  const colRef = collection(db, 'users', uid, 'agentPlans');
  const snap = await getDocs(colRef);
  return snap.docs
    .map((d) => d.data())
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export async function saveFirestoreAgentPlan(uid: string, plan: any): Promise<any> {
  const now = new Date().toISOString();
  const docRef = doc(db, 'users', uid, 'agentPlans', plan.id);
  const data = {
    ...plan,
    userId: uid,
    updatedAt: now,
    createdAt: plan.createdAt || now,
  };
  await setDoc(docRef, data, { merge: true });
  return data;
}

// -------------------------------------------------------------
// AGENT TASKS (users/{uid}/agentTasks/{taskId})
// -------------------------------------------------------------

export async function getFirestoreAgentTasks(uid: string): Promise<any[]> {
  const colRef = collection(db, 'users', uid, 'agentTasks');
  const snap = await getDocs(colRef);
  return snap.docs
    .map((d) => d.data())
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export async function saveFirestoreAgentTask(uid: string, task: any): Promise<any> {
  const now = new Date().toISOString();
  const docRef = doc(db, 'users', uid, 'agentTasks', task.id);
  const data = {
    ...task,
    userId: uid,
    updatedAt: now,
    createdAt: task.createdAt || now,
  };
  await setDoc(docRef, data, { merge: true });
  return data;
}

export async function deleteFirestoreAgentTask(uid: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'agentTasks', taskId));
}

// -------------------------------------------------------------
// CONTENT CALENDAR (users/{uid}/calendar/{calendarId})
// -------------------------------------------------------------

export async function getFirestoreCalendar(uid: string): Promise<any[]> {
  const colRef = collection(db, 'users', uid, 'calendar');
  const snap = await getDocs(colRef);
  return snap.docs
    .map((d) => d.data())
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

export async function saveFirestoreCalendarItem(uid: string, item: any): Promise<any> {
  const now = new Date().toISOString();
  const docRef = doc(db, 'users', uid, 'calendar', item.id);
  const data = {
    ...item,
    userId: uid,
    updatedAt: now,
    createdAt: item.createdAt || now,
  };
  await setDoc(docRef, data, { merge: true });
  return data;
}

export async function deleteFirestoreCalendarItem(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'calendar', id));
}

// -------------------------------------------------------------
// SERIES (users/{uid}/series/{seriesId})
// -------------------------------------------------------------

export async function getFirestoreSeries(uid: string): Promise<any[]> {
  const colRef = collection(db, 'users', uid, 'series');
  const snap = await getDocs(colRef);
  return snap.docs
    .map((d) => d.data())
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export async function saveFirestoreSeries(uid: string, series: any): Promise<any> {
  const now = new Date().toISOString();
  const docRef = doc(db, 'users', uid, 'series', series.id);
  const data = {
    ...series,
    userId: uid,
    updatedAt: now,
    createdAt: series.createdAt || now,
  };
  await setDoc(docRef, data, { merge: true });
  return data;
}

export async function deleteFirestoreSeries(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'series', id));
}

// -------------------------------------------------------------
// CHARACTERS (users/{uid}/characters/{characterId})
// -------------------------------------------------------------

export async function getFirestoreCharacters(uid: string): Promise<any[]> {
  const colRef = collection(db, 'users', uid, 'characters');
  const snap = await getDocs(colRef);
  return snap.docs
    .map((d) => d.data())
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export async function saveFirestoreCharacter(uid: string, char: any): Promise<any> {
  const now = new Date().toISOString();
  const docRef = doc(db, 'users', uid, 'characters', char.id);
  const data = {
    ...char,
    userId: uid,
    updatedAt: now,
    createdAt: char.createdAt || now,
  };
  await setDoc(docRef, data, { merge: true });
  return data;
}

export async function deleteFirestoreCharacter(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'characters', id));
}

// -------------------------------------------------------------
// BRAND KIT (users/{uid}/brandKits/default)
// -------------------------------------------------------------

export async function getFirestoreBrandKit(uid: string): Promise<any | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'brandKits', 'default'));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function saveFirestoreBrandKit(uid: string, brandKit: any): Promise<any> {
  const now = new Date().toISOString();
  const docRef = doc(db, 'users', uid, 'brandKits', 'default');
  const data = {
    ...brandKit,
    userId: uid,
    updatedAt: now,
  };
  await setDoc(docRef, data, { merge: true });
  return data;
}

// -------------------------------------------------------------
// AGENT ACTIVITY (users/{uid}/activity/{activityId})
// -------------------------------------------------------------

export async function logFirestoreActivity(uid: string, act: {
  actionType: string;
  description: string;
  projectId?: string;
  projectName?: string;
  creditsUsed?: number;
}) {
  const actId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const data = {
    id: actId,
    userId: uid,
    ...act,
    timestamp: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', uid, 'activity', actId), data);
  return data;
}

export async function getFirestoreActivity(uid: string, max: number = 30): Promise<any[]> {
  const q = query(
    collection(db, 'users', uid, 'activity'),
    orderBy('timestamp', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

// -------------------------------------------------------------
// FIREBASE STORAGE (users/{uid}/{folder}/{filename})
// -------------------------------------------------------------

export async function uploadUserAsset(
  uid: string,
  folder: 'thumbnails' | 'images' | 'voice' | 'videos',
  fileName: string,
  fileData: Blob | Uint8Array | ArrayBuffer
): Promise<{ downloadUrl: string; storagePath: string }> {
  const storagePath = `users/${uid}/${folder}/${Date.now()}_${fileName}`;
  const assetRef = ref(storage, storagePath);
  await uploadBytes(assetRef, fileData);
  const downloadUrl = await getDownloadURL(assetRef);

  // Store metadata in Firestore
  const mediaId = `media_${Date.now()}`;
  await setDoc(doc(db, 'users', uid, 'media', mediaId), {
    id: mediaId,
    userId: uid,
    type: folder === 'thumbnails' || folder === 'images' ? 'image' : folder === 'voice' ? 'voice' : 'video',
    storagePath,
    downloadUrl,
    fileName,
    createdAt: new Date().toISOString(),
  });

  return { downloadUrl, storagePath };
}
