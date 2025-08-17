// src/components/Login.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Login Component: Handles user authentication by sending credentials to the backend.
function Login() {
    // Access the login function from AuthContext
    const { login } = useContext(AuthContext);

    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Handle form submission for login
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null); // Clear previous errors

        try {
            // Call the login function provided by AuthContext
            await login(username, pin);
            // If login is successful, AuthContext will update currentUser and redirect App.js
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-900 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full animate-fade-in-up transform transition-all duration-300 hover:scale-105">
                <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-8 tracking-tight">
                    Login
                </h2>
                <p className="text-center text-gray-600 mb-6 text-sm">
                    Enter your username and PIN to access the system.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="your username from Manager"
                        />
                    </div>
                    <div>
                        <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                            PIN
                        </label>
                        <input
                            id="pin"
                            name="pin"
                            type="password" // Use type="password" for security
                            autoComplete="current-password"
                            required
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="11111"
                        />
                    </div>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-center" role="alert">
                            <span className="block sm:inline">{error}</span>
                            <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
                                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.103l-2.651 3.746a1.2 1.2 0 0 1-1.697-1.697l2.651-3.746-2.651-3.746a1.2 1.2 0 0 1 1.697-1.697l2.651 3.746 2.651 3.746a1.2 1.2 0 0 1 0 1.697z"/></svg>
                            </span>
                        </div>
                    )}
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Logging In...' : 'Log In'}
                        </button>
                    </div>
                </form>
                <p className="mt-6 text-center text-sm text-gray-500">
                </p>
            </div>
        </div>
    );
}

export default Login;
