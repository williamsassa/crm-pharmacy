import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

function getAdminAuth(): Auth {
  if (adminAuth) return adminAuth;

  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Firebase Admin SDK credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
      );
    }

    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  }

  adminAuth = getAuth(adminApp!);
  return adminAuth;
}

export async function verifyFirebaseToken(token: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
}

export async function getFirebaseUser(uid: string) {
  try {
    const auth = getAdminAuth();
    return await auth.getUser(uid);
  } catch (error) {
    console.error('Get Firebase user failed:', error);
    return null;
  }
}
