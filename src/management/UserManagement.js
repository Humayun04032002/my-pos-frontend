// src/management/UserManagement.js
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ProductContext } from '../contexts/ProductContext'; // To access fetchInitialData and setAppMessage

// UserManagement Component: Allows Admin/Manager to view, add, edit, and delete users.
function UserManagement() {
    const { currentUser } = useContext(AuthContext);
    const { fetchInitialData, setAppMessage } = useContext(ProductContext); // Global message system

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('All Roles'); // 'All Roles' or specific role

    // Modals states
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);

    // Form states for Add/Edit User
    const [newUserData, setNewUserData] = useState({
        username: '',
        email: '', // PDF shows email, though backend currently doesn't store it for users. We will add a placeholder.
        password: '', // For new user, or new PIN for existing user
        role: '',
        status: true, // Assuming 'active' by default for new users
    });
    const [editingUser, setEditingUser] = useState(null); // User object being edited
    const [userToDelete, setUserToDelete] = useState(null); // User object to be deleted

    const roles = ['admin', 'manager', 'cashier', 'waiter', 'chef']; // Available roles

    // Fetch users from the backend
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://my-pos-backend.onrender.com/api/users');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch users.');
            }
            const data = await response.json();
            // Assign status based on roles that are generally "active"
            // Backend currently only returns username and role, so we infer status or set a default.
            const usersWithStatus = data.map(user => ({
                ...user,
                // Assuming all fetched users are active by default or if a specific status field is added to backend, use that.
                // For now, based on PDF which shows 'Active' for most, we set it true.
                status: 'active', // Placeholder, needs actual status from backend if available
                email: user.email || 'N/A' // Placeholder email
            }));
            setUsers(usersWithStatus);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(`Could not load users: ${err.message}`);
            setAppMessage({ type: 'error', text: `Could not load users: ${err.message}` });
        } finally {
            setLoading(false);
        }
    }, [setAppMessage]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Memoized filtered and searched users list
    const filteredUsers = useMemo(() => {
        let currentUsers = users;

        // Apply role filter
        if (selectedRoleFilter !== 'All Roles') {
            currentUsers = currentUsers.filter(user => user.role === selectedRoleFilter);
        }

        // Apply search term filter
        if (searchTerm) {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            currentUsers = currentUsers.filter(user =>
                user.username.toLowerCase().includes(lowercasedSearchTerm) ||
                user.role.toLowerCase().includes(lowercasedSearchTerm) ||
                user.email.toLowerCase().includes(lowercasedSearchTerm) // Include email in search
            );
        }
        return currentUsers;
    }, [users, selectedRoleFilter, searchTerm]);

    // Handle form input changes for new/edit user
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (showAddUserModal) {
            setNewUserData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        } else if (showEditUserModal) {
            setEditingUser(prev => ({
                ...prev,
                [name]: type === 'radio' ? (value === 'active') : value // Handle radio button for status
            }));
        }
    };

    // --- CRUD Operations ---

    // Add New User
    const handleAddUser = async (e) => {
        e.preventDefault();
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
            setAppMessage({ type: 'error', text: 'You do not have permission to add users.' });
            return;
        }

        const { username, password, role } = newUserData; // Note: Email and status are not sent to backend for /register

        if (!username || !password || !role) {
            setAppMessage({ type: 'error', text: 'Username, PIN, and Role are required.' });
            return;
        }

        try {
            const response = await fetch('https://my-pos-backend.onrender.com/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pin: password, role }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add user.');
            }
            setAppMessage({ type: 'success', text: `User "${username}" added successfully!` });
            setShowAddUserModal(false);
            setNewUserData({ username: '', email: '', password: '', role: '', status: true }); // Reset form
            fetchUsers(); // Refresh user list
        } catch (err) {
            console.error('Error adding user:', err);
            setAppMessage({ type: 'error', text: `Error adding user: ${err.message}` });
        }
    };

    // Edit Existing User
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
            setAppMessage({ type: 'error', text: 'You do not have permission to edit users.' });
            return;
        }
        if (!editingUser) return;

        // Backend API for user update takes `username`, `role`, and optionally `newPin`.
        // The `status` from frontend is not directly mapped to backend user table as it's not present there.
        // We will only update username, role, and optionally the PIN.
        const { id, username, role, newPin } = editingUser; 

        if (!username || !role) {
            setAppMessage({ type: 'error', text: 'Username and Role are required.' });
            return;
        }

        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, role, newPin }), // newPin will be passed if entered
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update user.');
            }
            setAppMessage({ type: 'success', text: `User "${username}" updated successfully!` });
            setShowEditUserModal(false);
            setEditingUser(null); // Clear editing state
            fetchUsers(); // Refresh user list
        } catch (err) {
            console.error('Error updating user:', err);
            setAppMessage({ type: 'error', text: `Error updating user: ${err.message}` });
        }
    };

    // Delete User
    const handleDeleteUser = async () => {
        if (currentUser.role !== 'admin') {
            setAppMessage({ type: 'error', text: 'Only Admins can delete users.' });
            return;
        }
        if (!userToDelete) return;

        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/users/${userToDelete.id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete user.');
            }
            setAppMessage({ type: 'success', text: `User "${userToDelete.username}" deleted successfully!` });
            setShowDeleteUserModal(false);
            setUserToDelete(null); // Clear deletion state
            fetchUsers(); // Refresh user list
        } catch (err) {
            console.error('Error deleting user:', err);
            setAppMessage({ type: 'error', text: `Error deleting user: ${err.message}` });
        }
    };

    // Permission check for the whole page
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center text-red-600 font-semibold">
                You do not have permission to access User Management.
            </div>
        );
    }

    if (loading) {
        return <div className="text-center py-8 text-gray-600">Loading users...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-600 font-semibold">{error}</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">User Management</h2>
            <p className="text-gray-600 mb-4">Add, edit, and organize user accounts and roles within your POS system.</p>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
                <div className="relative flex-grow sm:mr-4 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder-gray-500 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <select
                    className="w-full sm:w-auto py-2 px-4 rounded-full border border-gray-300 bg-gray-100 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                >
                    <option value="All Roles">All Roles</option>
                    {roles.map(role => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                    ))}
                </select>
                <button
                    onClick={() => setShowAddUserModal(true)}
                    className="ml-0 sm:ml-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center w-full sm:w-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add New User
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                    No users found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'N/A'}</td> {/* Email not stored in backend yet */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.status === 'active' ? '• Active' : '• Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setEditingUser({ ...user, newPin: '' }); // Prepare for editing, clear newPin
                                                setShowEditUserModal(true);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setUserToDelete(user);
                                                setShowDeleteUserModal(true);
                                            }}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Placeholder - functional pagination would require more state and logic) */}
            <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
                <span>Items per page: 10</span>
                <div className="flex items-center space-x-2">
                    <button className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="px-3 py-1 bg-indigo-500 text-white rounded-md">1</span>
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md">2</span>
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md">3</span>
                    <button className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>


            {/* Add New User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full transform transition-all duration-300 scale-95 origin-center">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Add New User</h3>
                            <button onClick={() => setShowAddUserModal(false)} className="text-gray-500 hover:text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-5">
                            <div>
                                <label htmlFor="add-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    id="add-username"
                                    name="username"
                                    value={newUserData.username}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="add-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    id="add-password"
                                    name="password"
                                    value={newUserData.password}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter password (PIN)"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="add-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    id="add-email"
                                    name="email"
                                    value={newUserData.email}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter email"
                                />
                            </div>
                            <div>
                                <label htmlFor="add-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    id="add-role"
                                    name="role"
                                    value={newUserData.role}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="">Select role</option>
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-gray-700 mb-2">Status</span>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="active"
                                            checked={newUserData.status === true} // Assuming 'true' for active, 'false' for inactive
                                            onChange={() => setNewUserData(prev => ({ ...prev, status: true }))}
                                            className="form-radio h-5 w-5 text-indigo-600"
                                        />
                                        <span className="ml-2 text-gray-700">Active</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="inactive"
                                            checked={newUserData.status === false}
                                            onChange={() => setNewUserData(prev => ({ ...prev, status: false }))}
                                            className="form-radio h-5 w-5 text-indigo-600"
                                        />
                                        <span className="ml-2 text-gray-700">Inactive</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddUserModal(false)}
                                    className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md"
                                >
                                    Save User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditUserModal && editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full transform transition-all duration-300 scale-95 origin-center">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Edit User</h3>
                            <button onClick={() => setShowEditUserModal(false)} className="text-gray-500 hover:text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="space-y-5">
                            <div>
                                <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    id="edit-username"
                                    name="username"
                                    value={editingUser.username}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    id="edit-email"
                                    name="email"
                                    value={editingUser.email || 'N/A'} // Placeholder for email
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled // Disable as email is not editable via API (or not present)
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-pin" className="block text-sm font-medium text-gray-700 mb-1">New PIN (Leave blank to keep current)</label>
                                <input
                                    type="password"
                                    id="edit-pin"
                                    name="newPin" // Name it 'newPin' for the backend
                                    value={editingUser.newPin}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter new PIN"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    id="edit-role"
                                    name="role"
                                    value={editingUser.role}
                                    onChange={handleFormChange}
                                    className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-gray-700 mb-2">Status</span>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="active"
                                            checked={editingUser.status === 'active'}
                                            onChange={() => setEditingUser(prev => ({ ...prev, status: 'active' }))}
                                            className="form-radio h-5 w-5 text-indigo-600"
                                        />
                                        <span className="ml-2 text-gray-700">Active</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="inactive"
                                            checked={editingUser.status === 'inactive'}
                                            onChange={() => setEditingUser(prev => ({ ...prev, status: 'inactive' }))}
                                            className="form-radio h-5 w-5 text-indigo-600"
                                        />
                                        <span className="ml-2 text-gray-700">Inactive</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditUserModal(false)}
                                    className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md"
                                >
                                    Save User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete User Confirmation Modal */}
            {showDeleteUserModal && userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all duration-300 scale-95 origin-center">
                        <div className="flex justify-end">
                            <button onClick={() => setShowDeleteUserModal(false)} className="text-gray-500 hover:text-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <h3 className="text-2xl font-bold text-red-700 mb-4">Delete User</h3>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete user "<span className="font-semibold">{userToDelete.username}</span>"?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => setShowDeleteUserModal(false)}
                                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-md"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserManagement;
