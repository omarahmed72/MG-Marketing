import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore,
  doc,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize app safely using live provisioned configuration
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export { app };

export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Authentication Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Operation Types for error tracing
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

// Global contextual error wrapper
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
    },
    operationType,
    path
  };
  console.error("Firestore Permission or Structural Error Context:", JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Function to safely validate connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Try to run a quick, secure server lookup
    await getDocFromServer(doc(db, "test_connection", "connection"));
    return true;
  } catch (error: any) {
    console.warn("Firebase rules/connectivity warning (Standard behavior if unconfigured):", error?.message);
    if (error?.message && error.message.includes("offline")) {
      return false;
    }
    return true; // connected, even if blocked by missing document rules
  }
}
