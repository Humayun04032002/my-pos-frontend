// src/kitchen/KitchenDisplay.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext'; // To verify chef role

function KitchenDisplay() {
    const { currentUser } = useContext(AuthContext);
    const [kitchenItems, setKitchenItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null); // For success/error messages

    const fetchKitchenItems = async () => {
        setLoading(true);
        setError(null);
        if (currentUser.role !== 'chef') {
            setError('You do not have permission to view the Kitchen Display.');
            setLoading(false);
            return;
        }
        try {
            const response = await fetch('https://my-pos-backend.onrender.com/api/products/api/kitchen/pending-items');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch kitchen items.');
            }
            const data = await response.json();
            setKitchenItems(data);
        } catch (err) {
            console.error('Error fetching kitchen items:', err);
            setError(`Could not load kitchen items: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch items on component mount and periodically refresh (e.g., every 15 seconds)
    useEffect(() => {
        fetchKitchenItems(); // Initial fetch

        const refreshInterval = setInterval(fetchKitchenItems, 15000); // Refresh every 15 seconds
        return () => clearInterval(refreshInterval); // Cleanup interval on component unmount
    }, [currentUser]); // Re-fetch if currentUser changes

    const updateItemStatus = async (itemId, newStatus) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/products/api/kitchen/order-items/${itemId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update item status.');
            }
            setMessage({ type: 'success', text: `Item ${itemId} marked as '${newStatus}'.` });
            fetchKitchenItems(); // Re-fetch to update the list
        } catch (err) {
            console.error('Error updating item status:', err);
            setMessage({ type: 'error', text: `Failed to update item status: ${err.message}` });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(null), 3000); // Clear message after 3 seconds
        }
    };

    // Group items by order, floor, and table for better display
    const groupedItems = kitchenItems.reduce((acc, item) => {
        const orderKey = `${item.order_id}-${item.floor_name}-${item.table_name}`;
        if (!acc[orderKey]) {
            acc[orderKey] = {
                order_id: item.order_id,
                transaction_id: item.transaction_id,
                floor_name: item.floor_name,
                table_name: item.table_name,
                order_date: item.order_date,
                items: [],
            };
        }
        acc[orderKey].items.push(item);
        return acc;
    }, {});

    const sortedOrders = Object.values(groupedItems).sort((a, b) => {
        // Sort by order date, then by table name
        const dateA = new Date(a.order_date);
        const dateB = new Date(b.order_date);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return a.table_name.localeCompare(b.table_name);
    });


    if (loading) {
        return <div className="text-center py-8 text-gray-600">Loading kitchen orders...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-600 font-semibold">{error}</div>;
    }

    if (currentUser.role !== 'chef') {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center text-red-600 font-semibold">
                You do not have permission to access the Kitchen Display.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">Kitchen Display</h2>
            <p className="text-gray-600 mb-4">View and manage pending food/beverage items for preparation.</p>

            {message && (
                <div className={`px-4 py-3 rounded-md relative mb-4 ${
                    message.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
                    'bg-red-100 border border-red-400 text-red-700'
                }`} role="alert">
                    <span className="block sm:inline">{message.text}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setMessage(null)}>
                        <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.103l-2.651 3.746a1.2 1.2 0 0 1-1.697-1.697l2.651-3.746-2.651-3.746a1.2 1.2 0 0 1 1.697-1.697l2.651 3.746 2.651 3.746a1.2 1.2 0 0 1 0 1.697z"/></svg>
                    </span>
                </div>
            )}

            {sortedOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No items currently awaiting preparation.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedOrders.map(order => (
                        <div key={order.order_id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-lg flex flex-col">
                            <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-3">
                                <span className="text-blue-600">Order #{order.order_id}</span>
                                <span className="block text-base font-semibold text-gray-700 mt-1">
                                    {order.floor_name} - {order.table_name}
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                {new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </p>
                            <ul className="flex-grow space-y-3">
                                {order.items.map(item => (
                                    <li key={item.item_id} className="flex flex-col p-2 border border-dashed border-gray-300 rounded-md">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-lg text-gray-800">{item.quantity}x {item.product_name}</span>
                                            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                                item.item_status === 'pending' ? 'bg-red-100 text-red-800' :
                                                item.item_status === 'cooked' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {item.item_status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            {item.item_status === 'pending' && (
                                                <button
                                                    onClick={() => updateItemStatus(item.item_id, 'cooked')}
                                                    className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md transition-colors"
                                                >
                                                    Mark Cooked
                                                </button>
                                            )}
                                            {(item.item_status === 'pending' || item.item_status === 'cooked') && (
                                                <button
                                                    onClick={() => updateItemStatus(item.item_id, 'ready')}
                                                    className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md transition-colors"
                                                >
                                                    Mark Ready
                                                </button>
                                            )}
                                            {item.item_status === 'ready' && (
                                                <button
                                                    onClick={() => updateItemStatus(item.item_id, 'pending')}
                                                    className="text-sm bg-gray-400 hover:bg-gray-500 text-white py-1 px-3 rounded-md transition-colors"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default KitchenDisplay;
