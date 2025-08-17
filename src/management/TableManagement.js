// src/management/TableManagement.js
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { ProductContext } from '../contexts/ProductContext'; // Assuming ProductContext has fetchInitialData and setAppMessage
import { PlusCircle, Search, Edit, Trash2, XCircle, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react'; // Import icons

// Modals
const AddFloorModal = ({ isOpen, onClose, onSave }) => {
    const [floorName, setFloorName] = useState('');
    const [numberOfTables, setNumberOfTables] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFloorName('');
            setNumberOfTables('');
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Updated alert to use setAppMessage for consistency (assuming it's available)
        if (!floorName.trim() || !numberOfTables || isNaN(parseInt(numberOfTables))) {
            alert('Please enter a valid floor name and number of tables.'); // Keep alert for immediate feedback
            return;
        }
        onSave({ name: floorName.trim(), numberOfTables: parseInt(numberOfTables) });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Add New Floor</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label htmlFor="floorName" className="block text-gray-700 text-sm font-semibold mb-2">Floor Name</label>
                        <input
                            type="text"
                            id="floorName"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                            placeholder="e.g., Ground Floor"
                            value={floorName}
                            onChange={(e) => setFloorName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="numberOfTables" className="block text-gray-700 text-sm font-semibold mb-2">Number of Tables</label>
                        <input
                            type="number"
                            id="numberOfTables"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                            placeholder="e.g., 10"
                            value={numberOfTables}
                            onChange={(e) => setNumberOfTables(e.target.value)}
                            min="0"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition duration-200 ease-in-out"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out"
                        >
                            Save Floor
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditFloorModal = ({ isOpen, onClose, onSave, floor }) => {
    const [floorName, setFloorName] = useState(floor?.name || '');
    const [numberOfTables, setNumberOfTables] = useState(floor?.numberOfTables || ''); // Assuming this field exists or can be derived

    useEffect(() => {
        if (isOpen && floor) {
            setFloorName(floor.name);
            setNumberOfTables(floor.numberOfTables || ''); // Adjust based on actual floor object structure
        }
    }, [isOpen, floor]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!floorName.trim() || !numberOfTables || isNaN(parseInt(numberOfTables))) {
            alert('Please enter a valid floor name and number of tables.');
            return;
        }
        onSave({ ...floor, name: floorName.trim(), numberOfTables: parseInt(numberOfTables) });
        onClose();
    };

    if (!isOpen || !floor) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Edit Floor</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label htmlFor="editFloorName" className="block text-gray-700 text-sm font-semibold mb-2">Floor Name</label>
                        <input
                            type="text"
                            id="editFloorName"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                            placeholder="e.g., Ground Floor"
                            value={floorName}
                            onChange={(e) => setFloorName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="editNumberOfTables" className="block text-gray-700 text-sm font-semibold mb-2">Number of Tables</label>
                        <input
                            type="number"
                            id="editNumberOfTables"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                            placeholder="e.g., 10"
                            value={numberOfTables}
                            onChange={(e) => setNumberOfTables(e.target.value)}
                            min="0"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition duration-200 ease-in-out"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddTableModal = ({ isOpen, onClose, onSave, floors }) => {
    const [tableName, setTableName] = useState('');
    const [selectedFloorId, setSelectedFloorId] = useState(''); // Keep as string for select value
    const [maxSeats, setMaxSeats] = useState('');
    const [status, setStatus] = useState('available');

    useEffect(() => {
        if (isOpen) {
            setTableName('');
            // Set default floor to the first available floor's ID if floors exist
            setSelectedFloorId(floors.length > 0 ? String(floors[0].id) : '');
            setMaxSeats('');
            setStatus('available');
        }
    }, [isOpen, floors]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const nameTrimmed = tableName.trim();
        const floorIdParsed = parseInt(selectedFloorId);
        const maxSeatsParsed = parseInt(maxSeats);

        // More robust validation with specific alerts
        if (!nameTrimmed) {
            alert('Table name is required.');
            return;
        }
        if (!selectedFloorId || isNaN(floorIdParsed)) {
            alert('Please select a valid floor.');
            return;
        }
        if (isNaN(maxSeatsParsed) || maxSeatsParsed <= 0) {
            alert('Max seats must be a valid positive number.');
            return;
        }

        const newTableData = {
            name: nameTrimmed,
            floorId: floorIdParsed, // Ensure this matches backend expected key (camelCase)
            max_seats: maxSeatsParsed,
            status: status
        };
        console.log('Attempting to add table with data:', newTableData); // Log data being sent
        onSave(newTableData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Add New Table</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label htmlFor="tableName" className="block text-gray-700 text-sm font-semibold mb-2">Table Name</label>
                        <input
                            type="text"
                            id="tableName"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                            placeholder="e.g., T01"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-5">
                        <label htmlFor="tableFloor" className="block text-gray-700 text-sm font-semibold mb-2">Floor</label>
                        <select
                            id="tableFloor"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-white"
                            value={selectedFloorId}
                            onChange={(e) => setSelectedFloorId(e.target.value)}
                            required
                        >
                            <option value="" disabled hidden>Select a Floor</option> {/* Added placeholder option */}
                            {floors.map(floor => (
                                <option key={floor.id} value={floor.id}>{floor.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-5">
                        <label htmlFor="maxSeats" className="block text-gray-700 text-sm font-semibold mb-2">Max Seats</label>
                        <input
                            type="number"
                            id="maxSeats"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                            placeholder="e.g., 4"
                            value={maxSeats}
                            onChange={(e) => setMaxSeats(e.target.value)}
                            min="1"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="tableStatus" className="block text-gray-700 text-sm font-semibold mb-2">Status</label>
                        <select
                            id="tableStatus"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-white"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            required
                        >
                            <option value="available">Available</option>
                            <option value="occupied">Not Available</option> {/* Changed 'Occupied' to 'Not Available' */}
                            <option value="reserved">Reserved</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition duration-200 ease-in-out"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out"
                        >
                            Save Table
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditTableModal = ({ isOpen, onClose, onSave, table, floors }) => {
    const [tableName, setTableName] = useState(table?.name || '');
    const [selectedFloorId, setSelectedFloorId] = useState(String(table?.floor_id) || '');
    const [maxSeats, setMaxSeats] = useState(table?.max_seats || '');
    const [status, setStatus] = useState(table?.status || 'available');

    useEffect(() => {
        if (isOpen && table) {
            setTableName(table.name);
            setSelectedFloorId(String(table.floor_id));
            setMaxSeats(table.max_seats);
            setStatus(table.status);
        }
    }, [isOpen, table]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const nameTrimmed = tableName.trim();
        const floorIdParsed = parseInt(selectedFloorId);
        const maxSeatsParsed = parseInt(maxSeats);

        // More robust validation for edit modal
        if (!nameTrimmed) {
            alert('Table name is required.');
            return;
        }
        if (!selectedFloorId || isNaN(floorIdParsed)) {
            alert('Please select a valid floor.');
            return;
        }
        if (isNaN(maxSeatsParsed) || maxSeatsParsed <= 0) {
            alert('Max seats must be a valid positive number.');
            return;
        }

        // Backend expects name, floorId, status for PUT /api/tables/:id. max_seats might be ignored by backend.
        const dataToSend = {
            name: nameTrimmed,
            floor_id: floorIdParsed, // Ensure this matches backend expected key (snake_case)
            max_seats: maxSeatsParsed, // Include for consistency, even if backend ignores it for PUT
            status: status
        };
        onSave({
            ...table, // Keep existing table properties like 'id'
            ...dataToSend // Override with updated data
        });
        onClose();
    };

    if (!isOpen || !table) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Edit Table</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label htmlFor="editTableName" className="block text-gray-700 text-sm font-semibold mb-2">Table Name</label>
                        <input
                            type="text"
                            id="editTableName"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                            placeholder="e.g., T01"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-5">
                        <label htmlFor="editTableFloor" className="block text-gray-700 text-sm font-semibold mb-2">Floor</label>
                        <select
                            id="editTableFloor"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-white"
                            value={selectedFloorId}
                            onChange={(e) => setSelectedFloorId(e.target.value)}
                            required
                        >
                            {floors.map(floor => (
                                <option key={floor.id} value={floor.id}>{floor.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-5">
                        <label htmlFor="editMaxSeats" className="block text-gray-700 text-sm font-semibold mb-2">Max Seats</label>
                        <input
                            type="number"
                            id="editMaxSeats"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                            placeholder="e.g., 4"
                            value={maxSeats}
                            onChange={(e) => setMaxSeats(e.target.value)}
                            min="1"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="editTableStatus" className="block text-gray-700 text-sm font-semibold mb-2">Status</label>
                        <select
                            id="editTableStatus"
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 bg-white"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            required
                        >
                            <option value="available">Available</option>
                            <option value="occupied">Not Available</option> {/* Changed 'Occupied' to 'Not Available' */}
                            <option value="reserved">Reserved</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition duration-200 ease-in-out"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onDelete, itemName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm text-center transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
                <p className="text-gray-600 mb-6">Are you sure you want to delete <span className="font-semibold text-red-600">"{itemName}"</span>? This action cannot be undone.</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition duration-200 ease-in-out"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDelete}
                        className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold shadow-md hover:bg-red-700 transition duration-200 ease-in-out"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};


function TableManagement() {
    const { floors, setFloors, tables, setTables, fetchInitialData, setAppMessage } = useContext(ProductContext);

    // Modals state
    const [showAddFloorModal, setShowAddFloorModal] = useState(false);
    const [showEditFloorModal, setShowEditFloorModal] = useState(false);
    const [selectedFloorForEdit, setSelectedFloorForEdit] = useState(null);
    const [showDeleteFloorModal, setShowDeleteFloorModal] = useState(false);
    const [selectedFloorForDelete, setSelectedFloorForDelete] = useState(null);

    const [showAddTableModal, setShowAddTableModal] = useState(false);
    const [showEditTableModal, setShowEditTableModal] = useState(false);
    const [selectedTableForEdit, setSelectedTableForEdit] = useState(null);
    const [showDeleteTableModal, setShowDeleteTableModal] = useState(false);
    const [selectedTableForDelete, setSelectedTableForDelete] = useState(null);

    // Filtering and Search state for tables
    const [selectedFloorFilter, setSelectedFloorFilter] = useState('All'); // 'All' or floor.id
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'available', 'occupied', 'reserved'

    // Fetch initial data when component mounts
    useEffect(() => {
        fetchInitialData();
    }, []); // Empty dependency array means this effect runs only once after the initial render.


    // --- API Calls ---

    const handleAddFloor = async (newFloorData) => {
        try {
            const response = await fetch('http://localhost:5000/api/floors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFloorData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add floor.');
            }
            setAppMessage({ type: 'success', text: `Floor "${newFloorData.name}" added successfully!` });
            fetchInitialData(); // Re-fetch to update the list
        } catch (error) {
            console.error('Error adding floor:', error);
            setAppMessage({ type: 'error', text: `Error adding floor: ${error.message}` });
        }
    };

    const handleEditFloor = async (updatedFloorData) => {
        try {
            const response = await fetch(`http://localhost:5000/api/floors/${updatedFloorData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: updatedFloorData.name }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update floor.');
            }
            setAppMessage({ type: 'success', text: `Floor "${updatedFloorData.name}" updated successfully!` });
            fetchInitialData();
        } catch (error) {
            console.error('Error updating floor:', error);
            setAppMessage({ type: 'error', text: `Error updating floor: ${error.message}` });
        }
    };

    const handleDeleteFloor = async () => {
        if (!selectedFloorForDelete) return;
        console.log('Attempting to delete floor with ID:', selectedFloorForDelete.id, 'Name:', selectedFloorForDelete.name);
        try {
            const response = await fetch(`http://localhost:5000/api/floors/${selectedFloorForDelete.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete floor.');
            }
            setAppMessage({ type: 'success', text: `Floor "${selectedFloorForDelete.name}" deleted successfully!` });
            fetchInitialData();
            setShowDeleteFloorModal(false);
            setSelectedFloorForDelete(null);
        } catch (error) {
            console.error('Error deleting floor:', error);
            setAppMessage({ type: 'error', text: `Error deleting floor: ${error.message}` });
        }
    };

    const handleAddTable = async (newTableData) => {
        try {
            const response = await fetch('http://localhost:5000/api/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTableData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add table.');
            }
            setAppMessage({ type: 'success', text: `Table "${newTableData.name}" added successfully!` });
            fetchInitialData();
        } catch (error) {
            console.error('Error adding table:', error);
            setAppMessage({ type: 'error', text: `Error adding table: ${error.message}` });
        }
    };

    const handleEditTable = async (updatedTableData) => {
        try {
            const dataToSend = {
                name: updatedTableData.name,
                floor_id: updatedTableData.floor_id,
                status: updatedTableData.status
            };
            const response = await fetch(`http://localhost:5000/api/tables/${updatedTableData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update table.');
            }
            setAppMessage({ type: 'success', text: `Table "${updatedTableData.name}" updated successfully!` });
            fetchInitialData();
        } catch (error) {
            console.error('Error updating table:', error);
            setAppMessage({ type: 'error', text: `Error updating table: ${error.message}` });
        }
    };

    const handleDeleteTable = async () => {
        if (!selectedTableForDelete) return;
        try {
            const response = await fetch(`http://localhost:5000/api/tables/${selectedTableForDelete.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete table.');
            }
            setAppMessage({ type: 'success', text: `Table "${selectedTableForDelete.name}" deleted successfully!` });
            fetchInitialData();
            setShowDeleteTableModal(false);
            setSelectedTableForDelete(null);
        } catch (error) {
            console.error('Error deleting table:', error);
            setAppMessage({ type: 'error', text: `Error deleting table: ${error.message}` });
        }
    };

    // --- Filtered and Searched Tables ---
    const filteredAndSearchedTables = useMemo(() => {
        let currentTables = tables;

        // Filter by floor
        if (selectedFloorFilter !== 'All') {
            currentTables = currentTables.filter(table => String(table.floor_id) === selectedFloorFilter);
        }

        // Filter by status
        if (statusFilter !== 'All') {
            currentTables = currentTables.filter(table => table.status === statusFilter);
        }

        // Search by term
        if (searchTerm) {
            currentTables = currentTables.filter(table =>
                table.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return currentTables;
    }, [tables, selectedFloorFilter, searchTerm, statusFilter]);

    // Function to get status-based card classes for the entire table card
    const getCardStatusClasses = (status) => {
        switch (status) {
            case 'available': return 'bg-green-100 border-green-300 text-green-800';
            case 'occupied': return 'bg-red-100 border-red-300 text-red-800'; // Red for 'Not Available'
            case 'reserved': return 'bg-orange-100 border-orange-300 text-orange-800';
            default: return 'bg-gray-100 border-gray-300 text-gray-800'; // Default neutral
        }
    };

    // Function to get display text for status
    const getStatusDisplayText = (status) => {
        switch (status) {
            case 'available': return 'Available';
            case 'occupied': return 'Not Available';
            case 'reserved': return 'Reserved';
            default: return 'Unknown';
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen animate-fade-in">
            {/* Header */}
            <div className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">Floor & Table Management</h1>
                <p className="text-gray-600 mt-2">Manage your restaurant's floors and tables.</p>
            </div>

            {/* Floor Management Section */}
            <section className="bg-white rounded-xl shadow-2xl p-6 mb-8 border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Floor Management</h2>
                    <button
                        onClick={() => setShowAddFloorModal(true)}
                        className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out font-semibold"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Floor
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {floors.length > 0 ? (
                        floors.map(floor => (
                            <div key={floor.id} className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200 flex items-center justify-between transition-transform transform hover:scale-[1.02] duration-200 ease-in-out">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-800">{floor.name}</h3>
                                        <p className="text-sm text-gray-500">{tables.filter(t => t.floor_id === floor.id).length} tables</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => { setSelectedFloorForEdit(floor); setShowEditFloorModal(true); }}
                                        className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-indigo-600 transition duration-200"
                                        aria-label={`Edit ${floor.name}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 2.251A1.082 1.082 0 0118 3.75v12.75c0 .72-.58 1.3-1.3 1.3h-2.55A1.082 1.082 0 0113.5 17.25V4.5a1.082 1.082 0 011.088-1.088l.17-.017zM15 15.75L9 21.75M16.5 16.5L10.5 22.5M10.5 12.75v-1.5M12 11.25H9.75" /></svg>
                                    </button>
                                    <button
                                        onClick={() => { setSelectedFloorForDelete(floor); setShowDeleteFloorModal(true); }}
                                        className="p-2 rounded-full text-gray-500 hover:bg-red-200 hover:text-red-600 transition duration-200"
                                        aria-label={`Delete ${floor.name}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.007H5.493a2.25 2.25 0 01-2.244-2.007L1.926 6.75H19.08c.243 0 .482.02.72.054zm-9.968 0h.008v.008h-.008V6.75zm1.5 0h.008v.008h-.008V6.75zm1.5 0h.008v.008h-.008V6.75z" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="lg:col-span-3 text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                            <p className="text-lg font-semibold">No floors configured yet.</p>
                            <p className="text-md mt-2">Click "Add Floor" to get started!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Table Management Section */}
            <section className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Table Management</h2>
                    <button
                        onClick={() => setShowAddTableModal(true)}
                        className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out font-semibold"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Table
                    </button>
                </div>

                {/* Table Filters and Search */}
                <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search tables..."
                            className="w-full py-2 pl-10 pr-4 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder-gray-500 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            className="block w-full sm:w-auto py-2 pl-3 pr-10 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 appearance-none shadow-sm"
                            value={selectedFloorFilter}
                            onChange={(e) => setSelectedFloorFilter(e.target.value)}
                        >
                            <option value="All">All Floors</option>
                            {floors.map(floor => (
                                <option key={floor.id} value={floor.id}>{floor.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            className="block w-full sm:w-auto py-2 pl-3 pr-10 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 appearance-none shadow-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="available">Available</option>
                            <option value="occupied">Not Available</option> {/* Filter option updated */}
                            <option value="reserved">Reserved</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredAndSearchedTables.length > 0 ? (
                        filteredAndSearchedTables.map(table => (
                            <div key={table.id} className={`p-6 rounded-xl shadow-md border flex flex-col transition-transform transform hover:scale-[1.02] duration-200 ease-in-out ${getCardStatusClasses(table.status)}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-2">
                                        {/* Removed the small dot, as the whole card now shows the status color */}
                                        <h3 className="text-xl font-semibold">{table.name}</h3> {/* Text color is inherited from getCardStatusClasses */}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => { setSelectedTableForEdit(table); setShowEditTableModal(true); }}
                                            className="p-1 rounded-full text-current hover:bg-opacity-20 hover:bg-current transition duration-200"
                                            aria-label={`Edit ${table.name}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 2.251A1.082 1.082 0 0118 3.75v12.75c0 .72-.58 1.3-1.3 1.3h-2.55A1.082 1.082 0 0113.5 17.25V4.5a1.082 1.082 0 011.088-1.088l.17-.017zM15 15.75L9 21.75M16.5 16.5L10.5 22.5M10.5 12.75v-1.5M12 11.25H9.75" /></svg>
                                        </button>
                                        <button
                                            onClick={() => { setSelectedTableForDelete(table); setShowDeleteTableModal(true); }}
                                            className="p-1 rounded-full text-current hover:bg-opacity-20 hover:bg-red-200 transition duration-200"
                                            aria-label={`Delete ${table.name}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.007H5.493a2.25 2.25 0 01-2.244-2.007L1.926 6.75H19.08c.243 0 .482.02.72.054zm-9.968 0h.008v.008h-.008V6.75zm1.5 0h.008v.008h-.008V6.75zm1.5 0h.008v.008h-.008V6.75z" /></svg>
                                        </button>
                                    </div>
                                </div>
                                {/* Display full status text */}
                                <p className="text-sm font-medium">{getStatusDisplayText(table.status)}</p>
                                <p className="text-sm">Floor: {floors.find(f => f.id === table.floor_id)?.name || 'N/A'}</p>
                                <p className="text-sm">Max Seats: {table.max_seats}</p>
                            </div>
                        ))
                    ) : (
                        <div className="lg:col-span-4 text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                            <p className="text-lg font-semibold">No tables found matching your criteria.</p>
                            <p className="text-md mt-2">Try adjusting your filters or adding new tables.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Modals */}
            <AddFloorModal
                isOpen={showAddFloorModal}
                onClose={() => setShowAddFloorModal(false)}
                onSave={handleAddFloor}
            />
            <EditFloorModal
                isOpen={showEditFloorModal}
                onClose={() => setShowEditFloorModal(false)}
                onSave={handleEditFloor}
                floor={selectedFloorForEdit}
            />
            <DeleteConfirmationModal
                isOpen={showDeleteFloorModal}
                onClose={() => setShowDeleteFloorModal(false)}
                onDelete={handleDeleteFloor}
                itemName={selectedFloorForDelete?.name}
            />

            <AddTableModal
                isOpen={showAddTableModal}
                onClose={() => setShowAddTableModal(false)}
                onSave={handleAddTable}
                floors={floors}
            />
            <EditTableModal
                isOpen={showEditTableModal}
                onClose={() => setShowEditTableModal(false)}
                onSave={handleEditTable}
                table={selectedTableForEdit}
                floors={floors}
            />
            <DeleteConfirmationModal
                isOpen={showDeleteTableModal}
                onClose={() => setShowDeleteTableModal(false)}
                onDelete={handleDeleteTable}
                itemName={selectedTableForDelete?.name}
            />
        </div>
    );
}

export default TableManagement;
