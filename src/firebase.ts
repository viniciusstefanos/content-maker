import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, getDocs, limit, orderBy, Timestamp, addDoc, updateDoc, deleteDoc, getDocFromServer, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, CarouselProject } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  limit, 
  orderBy, 
  Timestamp, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocFromServer
};
export type { FirebaseUser };

export const logout = () => signOut(auth);

export const syncUserProfile = async (user: FirebaseUser): Promise<UserProfile> => {
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }

  // Check if this is the first user
  const usersQuery = query(collection(db, 'users'), limit(1));
  const usersSnapshot = await getDocs(usersQuery);
  const isFirstUser = usersSnapshot.empty;

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    role: isFirstUser ? 'admin' : 'user',
    name: user.displayName || 'Usuário',
    avatar: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`,
    createdAt: new Date().toISOString()
  };

  await setDoc(userDocRef, newProfile);
  return newProfile;
};

export const saveCarousel = async (uid: string, project: CarouselProject): Promise<string> => {
  const carouselData = {
    ...project,
    updatedAt: serverTimestamp(),
    createdAt: project.id ? project.createdAt : serverTimestamp()
  };

  if (project.id) {
    await setDoc(doc(db, 'carousels', project.id), carouselData);
    return project.id;
  } else {
    const docRef = await addDoc(collection(db, 'carousels'), carouselData);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  }
};

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
