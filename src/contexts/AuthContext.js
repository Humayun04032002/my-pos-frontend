// src/contexts/AuthContext.js
import { createContext, useState, useEffect } from 'react';

// AuthContext provides user authentication state and functions (currentUser, login, logout).
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Initialize currentUser from localStorage or null if not found
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('currentUser');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse stored user from localStorage", error);
            return null;
        }
    });

    // Effect to store currentUser in localStorage whenever it changes
    useEffect(() => {
        try {
            if (currentUser) {
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
                localStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.error("Failed to store user in localStorage", error);
        }
    }, [currentUser]);

    // Function to handle user login
    const login = async (username, pin) => {
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, pin }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Backend returns user object (id, username, role, name)
            setCurrentUser(data.user);
            return data.user;
        } catch (error) {
            console.error('Login API call error:', error);
            throw error; // Re-throw to be caught by the Login component
        }
    };

    // Function to handle user logout
    const logout = () => {
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
