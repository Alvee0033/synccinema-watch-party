import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if critical config is missing (basic check for apiKey)
const isConfigConfigured = !!firebaseConfig.apiKey;

let app: any;
let auth: any;
let db: any;
let rtdb: any;
let googleProvider: any;

if (isConfigConfigured) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        rtdb = getDatabase(app);
        googleProvider = new GoogleAuthProvider();
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
    }
} else {
    console.warn("Firebase credentials missing. App running in unconfigured mode.");
    // Mock objects or nulls could cause issues if not handled in AuthContext
    // We will export nulls and check in AuthContext
    auth = null;
    db = null;
    rtdb = null;
    googleProvider = null;
    app = null;
}

export { app, auth, db, rtdb, googleProvider, isConfigConfigured };
export default app;
