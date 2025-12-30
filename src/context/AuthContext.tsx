"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut as firebaseSignOut,
    User
} from "firebase/auth";
import { auth, googleProvider, db, rtdb, isConfigConfigured } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, onDisconnect, set, serverTimestamp } from "firebase/database";
import { TriangleAlert } from "lucide-react";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Banner Component for Missing Keys
function SetupBanner() {
    return (
        <div className="fixed top-0 left-0 w-full bg-yellow-600/20 backdrop-blur-md border-b border-yellow-500/20 p-2 z-[100] flex items-center justify-center gap-2 text-yellow-200 text-sm font-medium">
            <TriangleAlert size={16} />
            <span>Firebase not configured. Please add your credentials to .env.local (See FIREBASE_SETUP.md)</span>
        </div>
    );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isConfigConfigured || !auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Try to fetch/create user data, but don't block login if it fails (e.g. AdBlock)
                try {
                    // Firestore User Profile
                    if (db) {
                        const userRef = doc(db, "users", currentUser.uid);
                        const userSnap = await getDoc(userRef);

                        if (!userSnap.exists()) {
                            await setDoc(userRef, {
                                displayName: currentUser.displayName,
                                email: currentUser.email,
                                photoURL: currentUser.photoURL,
                                friendRequests: [],
                                friends: [],
                            }, { merge: true });
                        }
                    }

                    // RTDB Presence
                    if (rtdb) {
                        const statusRef = ref(rtdb, `status/${currentUser.uid}`);

                        // When disconnecting, set offline
                        onDisconnect(statusRef).set({
                            state: 'offline',
                            last_seen: serverTimestamp(),
                        });

                        // Set online now
                        set(statusRef, {
                            state: 'online',
                            last_seen: serverTimestamp(),
                        });
                    }
                } catch (err) {
                    console.error("Database sync failed (likely network block), but proceeding with Auth:", err);
                }

                setUser(currentUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        if (!isConfigConfigured) {
            alert("Cannot sign in: Firebase credentials are missing.");
            return;
        }
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in", error);
        }
    };

    const signOut = async () => {
        if (user && rtdb) {
            // Set offline explicitly before signing out
            const statusRef = ref(rtdb, `status/${user.uid}`);
            await set(statusRef, {
                state: 'offline',
                last_seen: serverTimestamp(),
            });
        }
        if (auth) {
            await firebaseSignOut(auth);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {!isConfigConfigured && <SetupBanner />}
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
