// src/management/TableManagement.js
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ProductContext } from '../contexts/ProductContext'; // For floors, tables, fetchInitialData, setAppMessage
import { PlusCircle, Edit, Trash2, XCircle, RefreshCcw } from 'lucide-react'; // Lucide icons

// TableManagement Component: Allows Admin/Manager to manage floors and tables.
function TableManagement() {
    // Access floors, tables, and fetchInitialData from ProductContext
    const { floors, tables, fetchInitialData, setAppMessage } = useContext(ProductContext);

    const [newFloorName, setNewFloorName] = useState('');
    const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false);
    const [floorToEdit, setFloorToEdit] = useState(null);
    const [isEditFloorModalOpen, setIsEditFloorModalOpen] = useState(false);
    const [floorToDelete, setFloorToDelete] = useState(null);
    const [isConfirmDeleteFloorModalOpen, setIsConfirmDeleteFloorModalOpen] = useState(false);

    const [newTable, setNewTable] = useState({ name: '', floor_id: '', max_seats: 4, status: 'available' });
    const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
    const [tableToEdit, setTableToEdit] = useState(null);
    const [isEditTableModalOpen, setIsEditTableModalOpen] = useState(false);
    const [tableToDelete, setTableToDelete] = useState(null);
    const [isConfirmDeleteTableModalOpen, setIsConfirmDeleteTableModalOpen] = useState(false);

    const [selectedFloorTab, setSelectedFloorTab] = useState('All'); // For floor tabs


    // Memoized list of all unique floor names for dropdowns/tabs
    const allFloorNames = useMemo(() => {
        return ['All', ...floors.map(floor => floor.name)].sort();
    }, [floors]);

    // Memoized and filtered tables for display based on selected tab
    const filteredTables = useMemo(() => {
        if (selectedFloorTab === 'All') {
            return tables.map(table => ({
                ...table,
                floor_name: floors.find(f => f.id === table.floor_id)?.name || 'N/A'
            }));
        } else {
            const selectedFloorId = floors.find(f => f.name === selectedFloorTab)?.id;
            return tables.filter(table => table.floor_id === selectedFloorId).map(table => ({
                ...table,
                floor_name: selectedFloorTab // Already known
            }));
        }
    }, [tables, selectedFloorTab, floors]);

    // --- Floor Management Functions ---
    const handleAddFloor = async (e) => {
        e.preventDefault();
        if (!newFloorName.trim()) {
            setAppMessage({ type: 'error', text: 'Floor name cannot be empty.' });
            return;
        }
        try {
            const response = await fetch('https://my-pos-backend.onrender.com/api/floors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFloorName.trim() }),
            });
            const data = await response.json();
            if (!response.ok) {
                // Robust error handling: Check if data is an object and has a message
                throw new Error(data && typeof data === 'object' && data.message ? data.message : 'Failed to add floor. Unknown server error.');
            }
            setAppMessage({ type: 'success', text: `Floor "${data.floor.name}" added successfully!` });
            setNewFloorName('');
            setIsAddFloorModalOpen(false);
            fetchInitialData(); // Refresh data in App.js
        } catch (err) {
            console.error('Error adding floor:', err.message);
            setAppMessage({ type: 'error', text: `Failed to add floor: ${err.message}` });
        }
    };

    const handleEditFloor = async (e) => {
        e.preventDefault();
        if (!floorToEdit || !floorToEdit.name.trim()) {
            setAppMessage({ type: 'error', text: 'Floor name cannot be empty.' });
            return;
        }
        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/floors/${floorToEdit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: floorToEdit.name.trim() }),
            });
            const data = await response.json();
            if (!response.ok) {
                // Robust error handling
                throw new Error(data && typeof data === 'object' && data.message ? data.message : 'Failed to update floor. Unknown server error.');
            }
            setAppMessage({ type: 'success', text: `Floor "${data.floor.name}" updated successfully!` });
            setIsEditFloorModalOpen(false);
            setFloorToEdit(null);
            fetchInitialData(); // Refresh data
        } catch (err) {
            console.error('Error updating floor:', err);
            setAppMessage({ type: 'error', text: `Failed to update floor: ${err.message}` });
        }
    };

    const handleDeleteFloorConfirmed = async () => {
        if (!floorToDelete) return;
        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/floors/${floorToDelete.id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                // Robust error handling
                throw new Error(data && typeof data === 'object' && data.message ? data.message : 'Failed to delete floor. Unknown server error.');
            }
            setAppMessage({ type: 'success', text: `Floor "${floorToDelete.name}" deleted successfully!` });
            setIsConfirmDeleteFloorModalOpen(false);
            setFloorToDelete(null);
            fetchInitialData(); // Refresh data
            setSelectedFloorTab('All'); // Reset tab if deleted floor was selected
        } catch (err) {
            console.error('Error deleting floor:', err);
            setAppMessage({ type: 'error', text: `Failed to delete floor: ${err.message}` });
        }
    };

    // --- Table Management Functions ---
    const handleAddTable = async (e) => {
        e.preventDefault();
        if (!newTable.name.trim() || !newTable.floor_id || newTable.max_seats === undefined || newTable.max_seats <= 0) {
            setAppMessage({ type: 'error', text: 'Table name, floor, and valid max seats are required.' });
            return;
        }
        try {
            const response = await fetch('https://my-pos-backend.onrender.com/api/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newTable.name.trim(),
                    floorId: parseInt(newTable.floor_id), // Ensure floor_id is an integer
                    max_seats: parseInt(newTable.max_seats),
                    status: newTable.status
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                // Robust error handling: Check if data is an object and has a message
                throw new Error(data && typeof data === 'object' && data.message ? data.message : 'Failed to add table. Unknown server error.');
            }
            // MODIFIED: Added optional chaining to prevent TypeError if 'data.table' is undefined
            setAppMessage({ type: 'success', text: `Table "${data.table?.name || 'N/A'}" added successfully!` });
            setNewTable({ name: '', floor_id: '', max_seats: 4, status: 'available' }); // Reset form
            setIsAddTableModalOpen(false);
            fetchInitialData(); // Refresh data
        } catch (err) {
            console.error('Error adding table:', err);
            setAppMessage({ type: 'error', text: `Failed to add table: ${err.message}` });
        }
    };

    const handleEditTable = async (e) => {
        e.preventDefault();
        if (!tableToEdit || !tableToEdit.name.trim() || !tableToEdit.floor_id || tableToEdit.max_seats === undefined || tableToEdit.max_seats <= 0 || !tableToEdit.status) {
            setAppMessage({ type: 'error', text: 'Table name, floor, max seats, and status are required.' });
            return;
        }
        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/tables/${tableToEdit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: tableToEdit.name.trim(),
                    floorId: parseInt(tableToEdit.floor_id), // Ensure floor_id is integer
                    max_seats: parseInt(tableToEdit.max_seats),
                    status: tableToEdit.status
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                // Robust error handling
                throw new Error(data && typeof data === 'object' && data.message ? data.message : 'Failed to update table. Unknown server error.');
            }
            setAppMessage({ type: 'success', text: `Table "${data.table.name}" updated successfully!` });
            setIsEditTableModalOpen(false);
            setTableToEdit(null);
            fetchInitialData(); // Refresh data
        } catch (err) {
            console.error('Error updating table:', err);
            setAppMessage({ type: 'error', text: `Failed to update table: ${err.message}` });
        }
    };

    const handleDeleteTableConfirmed = async () => {
        if (!tableToDelete) return;
        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/tables/${tableToDelete.id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                // Robust error handling
                throw new Error(data && typeof data === 'object' && data.message ? data.message : 'Failed to delete table. Unknown server error.');
            }
            setAppMessage({ type: 'success', text: `Table "${tableToDelete.name}" deleted successfully!` });
            setIsConfirmDeleteTableModalOpen(false);
            setTableToDelete(null);
            fetchInitialData(); // Refresh data
        } catch (err) {
            console.error('Error deleting table:', err);
            setAppMessage({ type: 'error', text: `Failed to delete table: ${err.message}` });
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Table Management</h1>

            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-md mb-6">
                <div className="flex items-center w-full sm:w-auto mb-4 sm:mb-0">
                    <button
                        onClick={() => setIsAddFloorModalOpen(true)}
                        className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 mr-3"
                    >
                        <PlusCircle size={20} className="mr-2" /> Add New Floor
                    </button>
                    <button
                        onClick={() => setIsAddTableModalOpen(true)}
                        className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200"
                    >
                        <PlusCircle size={20} className="mr-2" /> Add New Table
                    </button>
                </div>
                {/* Refresh button */}
                <button
                    onClick={fetchInitialData}
                    className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200"
                >
                    <RefreshCcw size={18} className="mr-2" /> Refresh Data
                </button>
            </div>

            {/* Floor Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center bg-white p-3 rounded-xl shadow-md">
                {allFloorNames.map(floorName => (
                    <button
                        key={floorName}
                        onClick={() => setSelectedFloorTab(floorName)}
                        className={`py-2 px-4 rounded-full text-sm font-medium transition-colors duration-200
                            ${selectedFloorTab === floorName ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                        `}
                    >
                        {floorName}
                    </button>
                ))}
            </div>

            {/* Floor List for Management */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Floors</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md mb-8">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tables Count</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {floors.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                    No floors configured. Please add one!
                                </td>
                            </tr>
                        ) : (
                            floors.map(floor => (
                                <tr key={floor.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{floor.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {tables.filter(table => table.floor_id === floor.id).length}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => { setFloorToEdit(floor); setIsEditFloorModalOpen(true); }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                                            title="Edit Floor"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => { setFloorToDelete(floor); setIsConfirmDeleteFloorModalOpen(true); }}
                                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                            title="Delete Floor"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Tables List */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Tables</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Seats</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTables.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                    {selectedFloorTab === 'All' ? 'No tables configured.' : `No tables found on ${selectedFloorTab}.`}
                                </td>
                            </tr>
                        ) : (
                            filteredTables.map(table => (
                                <tr key={table.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{table.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.floor_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.max_seats}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                                            table.status === 'available' ? 'bg-green-100 text-green-800' :
                                            table.status === 'occupied' ? 'bg-orange-100 text-orange-800' :
                                            'bg-red-100 text-red-800' // For 'dirty' or other statuses
                                        }`}>
                                            {table.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => { setTableToEdit(table); setIsEditTableModalOpen(true); }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                                            title="Edit Table"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => { setTableToDelete(table); setIsConfirmDeleteTableModalOpen(true); }}
                                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                            title="Delete Table"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>


            {/* Modals for Floor Management */}
            {/* Add Floor Modal */}
            {isAddFloorModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Add New Floor</h2>
                            <button onClick={() => setIsAddFloorModalOpen(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddFloor} className="space-y-4">
                            <div>
                                <label htmlFor="floorName" className="block text-sm font-medium text-gray-700">Floor Name</label>
                                <input
                                    type="text" id="floorName"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={newFloorName} onChange={(e) => setNewFloorName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddFloorModalOpen(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                                >
                                    Add Floor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Floor Modal */}
            {isEditFloorModalOpen && floorToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Floor</h2>
                            <button onClick={() => setIsEditFloorModalOpen(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditFloor} className="space-y-4">
                            <div>
                                <label htmlFor="editFloorName" className="block text-sm font-medium text-gray-700">Floor Name</label>
                                <input
                                    type="text" id="editFloorName"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={floorToEdit.name} onChange={(e) => setFloorToEdit({ ...floorToEdit, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditFloorModalOpen(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Floor Confirmation Modal */}
            {isConfirmDeleteFloorModalOpen && floorToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 text-center">
                        <div className="flex justify-center mb-4">
                            <Trash2 size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">Are you sure you want to delete the floor "<span className="font-semibold">{floorToDelete.name}</span>"? This will also delete all associated tables. This action cannot be undone.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => { setIsConfirmDeleteFloorModalOpen(false); setFloorToDelete(null); }}
                                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteFloorConfirmed}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals for Table Management */}
            {/* Add Table Modal */}
            {isAddTableModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Add New Table</h2>
                            <button onClick={() => setIsAddTableModalOpen(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddTable} className="space-y-4">
                            <div>
                                <label htmlFor="tableName" className="block text-sm font-medium text-gray-700">Table Name</label>
                                <input
                                    type="text" id="tableName"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500"
                                    value={newTable.name} onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="tableFloor" className="block text-sm font-medium text-gray-700">Floor</label>
                                <select
                                    id="tableFloor"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500"
                                    value={newTable.floor_id} onChange={(e) => setNewTable({ ...newTable, floor_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select a floor</option>
                                    {floors.map(floor => (
                                        <option key={floor.id} value={floor.id}>{floor.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="maxSeats" className="block text-sm font-medium text-gray-700">Max Seats</label>
                                <input
                                    type="number" id="maxSeats"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500"
                                    value={newTable.max_seats} onChange={(e) => setNewTable({ ...newTable, max_seats: parseInt(e.target.value) || '' })}
                                    required min="1"
                                />
                            </div>
                            <div>
                                <label htmlFor="tableStatus" className="block text-sm font-medium text-gray-700">Initial Status</label>
                                <select
                                    id="tableStatus"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500"
                                    value={newTable.status} onChange={(e) => setNewTable({ ...newTable, status: e.target.value })}
                                    required
                                >
                                    <option value="available">Available</option>
                                    <option value="occupied">Occupied</option>
                                    <option value="dirty">Dirty</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddTableModalOpen(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                                >
                                    Add Table
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Table Modal */}
            {isEditTableModalOpen && tableToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Table</h2>
                            <button onClick={() => setIsEditTableModalOpen(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditTable} className="space-y-4">
                            <div>
                                <label htmlFor="editTableName" className="block text-sm font-medium text-gray-700">Table Name</label>
                                <input
                                    type="text" id="editTableName"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={tableToEdit.name} onChange={(e) => setTableToEdit({ ...tableToEdit, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="editTableFloor" className="block text-sm font-medium text-gray-700">Floor</label>
                                <select
                                    id="editTableFloor"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={tableToEdit.floor_id} onChange={(e) => setTableToEdit({ ...tableToEdit, floor_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select a floor</option>
                                    {floors.map(floor => (
                                        <option key={floor.id} value={floor.id}>{floor.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="editMaxSeats" className="block text-sm font-medium text-gray-700">Max Seats</label>
                                <input
                                    type="number" id="editMaxSeats"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={tableToEdit.max_seats} onChange={(e) => setTableToEdit({ ...tableToEdit, max_seats: parseInt(e.target.value) || '' })}
                                    required min="1"
                                />
                            </div>
                            <div>
                                <label htmlFor="editTableStatus" className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    id="editTableStatus"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={tableToEdit.status} onChange={(e) => setTableToEdit({ ...tableToEdit, status: e.target.value })}
                                    required
                                >
                                    <option value="available">Available</option>
                                    <option value="occupied">Occupied</option>
                                    <option value="dirty">Dirty</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditTableModalOpen(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Table Confirmation Modal */}
            {isConfirmDeleteTableModalOpen && tableToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 text-center">
                        <div className="flex justify-center mb-4">
                            <Trash2 size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">Are you sure you want to delete table "<span className="font-semibold">{tableToDelete.name}</span>"? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => { setIsConfirmDeleteTableModalOpen(false); setTableToDelete(null); }}
                                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteTableConfirmed}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TableManagement;
