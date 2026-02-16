
import { UserProfile } from '../types';
import { auth, db } from '../firebaseConfig';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth";
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc 
} from "firebase/firestore";

// --- AUTH SERVICE (FIREBASE BACKED) ---

export const authService = {
    
    /**
     * LOGIN
     * Authenticates with Firebase Auth and fetches User Profile from Firestore.
     */
    async login(email: string, password: string): Promise<{ user: UserProfile, token: string }> {
        // 1. DEMO / ADMIN BYPASS
        // This ensures the 'Auto-Nav' demo button works even if Firebase isn't fully configured
        // or if the demo user doesn't actually exist in the backend.
        if (email === 'demo@careeros.com' && password === 'DemoUser123!') {
            const demoUser: UserProfile = {
                name: 'Demo Executive',
                email: 'demo@careeros.com',
                primaryFocus: 'Executive', // Set to Executive to show full features
                keywords: ['Strategic Planning', 'Change Management', 'P&L Ownership'],
                isSubscribed: true, // Enable premium features
                scaleScore: 720,
                marketValue: 8500,
                skillScore: 85,
                industry: 'Technology',
                companyName: 'Nexus Innovations',
                role: 'Director of Operations',
                appliedJobIds: [],
                savedJobIds: [],
                strategicRoadmap: [],
                enrolledCourses: [],
                network: [],
                events: []
            };
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            return { user: demoUser, token: 'demo-token-123' };
        }

        try {
            // 2. Authenticate
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            const token = await userCredential.user.getIdToken();

            // 3. Fetch Profile from Firestore
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { user: docSnap.data() as UserProfile, token };
            } else {
                // Handle edge case: Auth exists but Firestore doc missing
                // Return a basic profile based on Auth info
                const fallbackUser: UserProfile = {
                    name: userCredential.user.displayName || 'User',
                    email: email,
                    primaryFocus: 'Professional'
                };
                return { user: fallbackUser, token };
            }
        } catch (error: any) {
            console.error("Login Error:", error);
            // Translate Firebase errors to user-friendly messages
            if (error.code === 'auth/invalid-credential') {
                throw new Error("Invalid email or password. Try the Demo Account.");
            } else if (error.code === 'auth/user-not-found') {
                throw new Error("Account not found. Please sign up.");
            } else if (error.code === 'auth/wrong-password') {
                throw new Error("Incorrect password.");
            }
            throw new Error(error.message || "Login failed.");
        }
    },

    /**
     * SIGNUP
     * Creates Firebase Auth account and creates a new document in 'users' collection.
     */
    async signup(data: { name: string; email: string; password: string; primaryFocus: string }): Promise<{ user: UserProfile, token: string }> {
        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const uid = userCredential.user.uid;
            const token = await userCredential.user.getIdToken();

            // 2. Prepare Profile Object
            const newUser: UserProfile = {
                name: data.name,
                email: data.email,
                primaryFocus: data.primaryFocus as any,
                keywords: [],
                isSubscribed: false,
                scaleScore: 500,
                marketValue: 2500,
                skillScore: 0,
                industry: 'General',
                companyName: 'Freelance',
                role: 'Professional',
                // Initialize empty arrays to prevent undefined errors
                appliedJobIds: [],
                savedJobIds: [],
                strategicRoadmap: [],
                enrolledCourses: []
            };

            // 3. Save to Firestore
            await setDoc(doc(db, "users", uid), newUser);

            return { user: newUser, token };
        } catch (error: any) {
            console.error("Signup Error:", error);
            if (error.code === 'auth/email-already-in-use') {
                throw new Error("This email is already registered.");
            }
            throw new Error(error.message || "Signup failed.");
        }
    },

    /**
     * SESSION MANAGEMENT (No op for Firebase, handled by SDK)
     */
    createSession(user: UserProfile) {
        // Firebase handles token persistence automatically.
        return { user, token: 'firebase-handled' };
    },

    /**
     * LOGOUT
     */
    async logout() {
        await signOut(auth);
        localStorage.clear(); // Clear any local app state if needed
    },

    /**
     * RESTORE SESSION
     * Checks Firebase Auth state on app load and fetches profile.
     */
    async restoreSession(): Promise<UserProfile | null> {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                unsubscribe(); // We only need the initial check
                if (user) {
                    try {
                        const docRef = doc(db, "users", user.uid);
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            resolve(docSnap.data() as UserProfile);
                        } else {
                            // User exists in Auth but not Firestore (rare edge case)
                            resolve({
                                name: user.displayName || 'User',
                                email: user.email || '',
                                primaryFocus: 'Professional'
                            }); 
                        }
                    } catch (e) {
                        console.error("Error restoring session:", e);
                        // If offline/error, resolve null to force login
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        });
    },

    /**
     * UPDATE USER
     * Updates the document in Firestore.
     */
    async updateUser(updatedUser: UserProfile): Promise<void> {
        const user = auth.currentUser;
        if (!user) {
            console.warn("Cannot update user: No active session.");
            return;
        }

        // Demo user bypass - don't try to update Firestore for demo account
        if (updatedUser.email === 'demo@careeros.com') {
            return;
        }

        try {
            const docRef = doc(db, "users", user.uid);
            await updateDoc(docRef, updatedUser as any);
        } catch (error) {
            console.error("Failed to sync user data to cloud:", error);
        }
    }
};
