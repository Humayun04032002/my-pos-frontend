// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    signInWithCustomToken,
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
    const API_BASE_URL = 'https://my-pos-backend.onrender.com/api'; // <--- UPDATED THIS LINE

    // Initialize Firebase and set up auth listener
    useEffect(() => {
        const initFirebase = async () => {
            try {
                // Global variables provided by the Canvas environment
                const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
                const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

                const app = initializeApp(firebaseConfig);
                const authInstance = getAuth(app);
                const dbInstance = getFirestore(app);

                setAuth(authInstance);
                setDb(dbInstance);

                const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                    if (user) {
                        setCurrentUser({
                            id: user.uid,
                            username: user.displayName || 'Guest', // displayName might not be set for anonymous
                            role: 'guest', // Default role, will be updated after backend login
                            email: user.email || 'N/A'
                        });
                        setUserId(user.uid);
                    } else {
                        setCurrentUser(null);
                        setUserId(null);
                    }
                    setAuthReady(true); // Firebase auth state is ready
                });

                // Sign in with custom token or anonymously if not available
                if (initialAuthToken) {
                    await signInWithCustomToken(authInstance, initialAuthToken);
                } else {
                    await signInAnonymously(authInstance);
                }

                return () => unsubscribe(); // Cleanup auth listener on unmount

            } catch (error) {
                console.error("Firebase initialization failed:", error);
                setAuthReady(true); // Still set ready even if failed, to avoid infinite loading
            }
        };

        initFirebase();
    }, []); // Run only once on mount

    const login = useCallback(async (username, pin) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, { // Use API_BASE_URL
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
