// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    // signInAnonymously, // Removed for standard deploy, unless explicitly needed for a different auth flow
    // signInWithCustomToken, // Removed for standard deploy
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// AuthContext will provide authentication state and functions
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [db, setDb] = useState(null); // Firestore instance
    const [auth, setAuth] = useState(null); // Firebase Auth instance
    const [userId, setUserId] = useState(null); // Current user's UID or anonymous ID

    // Use your deployed Render.com backend URL here
    const API_BASE_URL = 'https://my-pos-backend.onrender.com/api';

    // Initialize Firebase and set up auth listener
    useEffect(() => {
        const initFirebase = async () => {
            try {
                // For Vercel deployment, replace this empty object with your actual Firebase config:
                // const firebaseConfig = {
                //   apiKey: "YOUR_API_KEY",
                //   authDomain: "YOUR_AUTH_DOMAIN",
                //   projectId: "YOUR_PROJECT_ID",
                //   storageBucket: "YOUR_STORAGE_BUCKET",
                //   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
                //   appId: "YOUR_APP_ID"
                // };
                const firebaseConfig = {}; // Placeholder: Replace with your actual Firebase config if using Firebase features.

                const app = initializeApp(firebaseConfig);
                const authInstance = getAuth(app);
                const dbInstance = getFirestore(app);

                setAuth(authInstance);
                setDb(dbInstance);

                const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                    // Firebase's onAuthStateChanged might provide a user if Firebase Auth is used.
                    // For backend-only login, this might initially be null.
                    // The 'login' function will update currentUser after successful backend auth.
                    if (user) {
                        setCurrentUser({
                            id: user.uid,
                            username: user.displayName || 'Guest',
                            role: 'guest', // This role is temporary, updated by backend login
                            email: user.email || 'N/A'
                        });
                        setUserId(user.uid);
                    } else {
                        setCurrentUser(null);
                        setUserId(null);
                    }
                    setAuthReady(true); // Firebase auth state is ready regardless of logged-in status
                });

                // In a Vercel deployment, you typically wouldn't use __initial_auth_token.
                // The main authentication is handled by your backend.
                // If you *do* need Firebase client-side auth, implement it here (e.g., email/password sign-in).
                // Example for anonymous sign-in (if still desired, but less common with backend auth):
                // await signInAnonymously(authInstance);

                return () => unsubscribe(); // Cleanup auth listener on unmount

            } catch (error) {
                console.error("Firebase initialization failed:", error);
                // Important: Still set authReady to true even if Firebase init fails,
                // so the app doesn't stay in a perpetual loading state.
                setAuthReady(true);
            }
        };

        initFirebase();
    }, []); // Run only once on mount

    const login = useCallback(async (username, pin) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, pin }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed.');
            }

            // Update currentUser state with details from backend
            setCurrentUser(data.user);
            return data.user; // Return user data on success
        } catch (error) {
            console.error('Login failed:', error);
            throw error; // Re-throw to be caught by the Login component
        }
    }, [API_BASE_URL]);


    const logout = useCallback(async () => {
        if (auth) {
            try {
                await signOut(auth);
                setCurrentUser(null); // Clear local user state
                console.log('User logged out from Firebase.');
            } catch (error) {
                console.error('Error signing out:', error);
            }
        }
    }, [auth]);

    // Context value includes Firebase instances
    const contextValue = useMemo(() => ({
        currentUser,
        login,
        logout,
        authReady,
        db, // Firestore instance
        auth, // Firebase Auth instance
        userId // Current Firebase user ID
    }), [currentUser, login, logout, authReady, db, auth, userId]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
