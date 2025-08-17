// src/management/FloorTableManagement.js
import React, { useState, useContext } from 'react';
import { ProductContext } from '../contexts/ProductContext'; // Access floors, tables, and their setters

// FloorTableManagement Component: Allows Admin/Manager to add and manage floors and tables.
function FloorTableManagement() {
    const { floors, setFloors, tables, setTables } = useContext(ProductContext); // Get data and setters from context

    const [newFloorName, setNewFloorName] = useState('');
    const [newTableName, setNewTableName] = useState('');
    const [selectedFloorForTable, setSelectedFloorForTable] = useState(''); // To link a new table to a floor

    const handleAddFloor = (e) => {
        e.preventDefault();
        if (newFloorName.trim()) {
            // In a real app, send to backend API and use response to update state.
            setFloors(prev => [...prev, { id: `F${Date.now()}`, name: newFloorName.trim() }]); // Mock ID
            setNewFloorName(''); // Clear form
            alert('Floor added! (Backend integration needed)'); // Use custom modal
        }
    };

    const handleAddTable = (e) => {
        e.preventDefault();
        if (newTableName.trim() && selectedFloorForTable) {
            // In a real app, send to backend API and use response to update state.
            setTables(prev => [...prev, { id: `T${Date.now()}`, floorId: selectedFloorForTable, name: newTableName.trim(), status: 'available' }]); // Mock ID
            setNewTableName(''); // Clear form
            setSelectedFloorForTable(''); // Clear selection
            alert('Table added! (Backend integration needed)'); // Use custom modal
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">Floor & Table Management</h2>
            <p className="text-gray-600 mb-4">Manage your restaurant's floors and tables for efficient order taking.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Add New Floor Section */}
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Add New Floor</h3>
                    <form onSubmit={handleAddFloor} className="space-y-4">
                        <div>
                            <label htmlFor="floor-name" className="block text-sm font-medium text-gray-700">Floor Name</label>
                            <input
                                type="text"
                                id="floor-name"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={newFloorName}
                                onChange={(e) => setNewFloorName(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors">
                            Add Floor
                        </button>
                    </form>
                </div>

                {/* Add New Table Section */}
                <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Add New Table</h3>
                    <form onSubmit={handleAddTable} className="space-y-4">
                        <div>
                            <label htmlFor="table-floor" className="block text-sm font-medium text-gray-700">Select Floor</label>
                            <select
                                id="table-floor"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                value={selectedFloorForTable}
                                onChange={(e) => setSelectedFloorForTable(e.target.value)}
                                required
                            >
                                <option value="">-- Select a Floor --</option>
                                {floors.map(floor => (
                                    <option key={floor.id} value={floor.id}>{floor.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="table-name" className="block text-sm font-medium text-gray-700">Table Name</label>
                            <input
                                type="text"
                                id="table-name"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                value={newTableName}
                                onChange={(e) => setNewTableName(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors">
                            Add Table
                        </button>
                    </form>
                </div>
            </div>

            {/* Current Floors & Tables Display */}
            <h3 className="text-xl font-medium text-gray-800 mb-4">Current Floors & Tables (Status: Green=Available, Orange=Occupied)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {floors.map(floor => (
                    <div key={floor.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="font-bold text-lg text-gray-800">{floor.name}</h4>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                            {tables.filter(table => table.floorId === floor.id).map(table => (
                                <li key={table.id} className={`flex items-center ${table.status === 'occupied' ? 'text-orange-700 font-semibold' : 'text-green-700'}`}>
                                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${table.status === 'occupied' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                                    {table.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FloorTableManagement;
