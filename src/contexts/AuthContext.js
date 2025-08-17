// src/contexts/AuthContext.js
import { createContext, useState, useEffect } from 'react';

// AuthContext provides user authentication state and functions (currentUser, login, logout).
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('currentUser');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse stored user from localStorage", error);
            return null;
        }
    });

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

    // Base API URL (works locally & in production if set in .env)
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

    const login = async (username, pin) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
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

            setCurrentUser(data.user); // user: {id, username, role, name}
            return data.user;
        } catch (error) {
            console.error('Login API call error:', error);
            throw error;
        }
    };

    const logout = () => {
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
