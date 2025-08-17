import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Loader2, Table, LayoutList, CheckCircle, XCircle, UtensilsCrossed, ChefHat, BellRing, Circle, Eye, RefreshCcw, Printer } from 'lucide-react';

const PendingOrders = () => {
    const { currentUser, db, auth } = useContext(AuthContext);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false);
    const [selectedOrderToComplete, setSelectedOrderToComplete] = useState(null);
    const [paymentDetails, setPaymentDetails] = useState({
        paymentType: 'Cash',
        amountPaid: '',
        discountPercentage: 0,
        discountAmount: 0,
        changeDue: 0,
        finalTotal: 0 // State to hold the dynamically calculated final total after discount
    });
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedOrderInfo, setSelectedOrderInfo] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    const API_BASE_URL = 'https://my-pos-backend.onrender.com/api';

    // useRef to track previous payment type for conditional reset of amountPaid
    const prevPaymentTypeRef = useRef('Cash');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'text-orange-500';
            case 'prepared': return 'text-yellow-600';
            case 'served': return 'text-blue-500';
            case 'completed': return 'text-green-600';
            case 'cancelled': return 'text-red-600';
            case 'cooked': return 'text-yellow-600';
            case 'ready': return 'text-green-600';
            default: return 'text-gray-500';
        }
    };

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return <Circle className="w-4 h-4" />;
            case 'prepared': return <ChefHat className="w-4 h-4" />;
            case 'served': return <BellRing className="w-4 h-4" />;
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            case 'cooked': return <ChefHat className="w-4 h-4" />;
            case 'ready': return <CheckCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    const fetchPendingOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/pending-orders`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setPendingOrders(data);
        } catch (err) {
            console.error('Error fetching pending orders:', err);
            setError('Failed to load pending orders.');
        } finally {
            setLoading(false);
        }
    };

    // Fetches pending orders on component mount and every 5 seconds
    useEffect(() => {
        fetchPendingOrders();
        const intervalId = setInterval(fetchPendingOrders, 5000);
        return () => clearInterval(intervalId); // Cleanup interval on unmount
    }, []);

    // Handles marking an order as 'served'
    const handleMarkAsServed = async (orderId) => {
        if (!currentUser || !['admin', 'manager', 'waiter'].includes(currentUser.role)) {
            console.warn('Unauthorized attempt to mark order as served.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'served' }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            console.log(`Order ${orderId} marked as served.`);
            fetchPendingOrders(); // Re-fetch to update UI
        } catch (err) {
            console.error('Error marking order as served:', err);
            setError(`Failed to mark order as served: ${err.message}`);
        }
    };

    // Opens the complete order modal and initializes payment details
    const handleCompleteOrderClick = (order) => {
        setSelectedOrderToComplete(order);
        setPaymentDetails({
            paymentType: 'Cash', // Default to Cash initially
            amountPaid: '', // Empty for manual input for cash, auto-filled for others
            discountPercentage: order.discount_percentage || 0,
            discountAmount: 0, // Will be calculated by useEffect
            changeDue: 0, // Will be calculated by useEffect
            finalTotal: order.initial_total // Use initial_total as the starting point for calculations
        });
        setShowConfirmCompleteModal(true);
    };

    // Effect to recalculate discount and final totals whenever relevant payment details change
    useEffect(() => {
        if (selectedOrderToComplete) {
            const initialOrderTotal = selectedOrderToComplete.initial_total;
            const currentDiscountPercentage = parseFloat(paymentDetails.discountPercentage) || 0;

            const calculatedDiscountAmount = (initialOrderTotal * (currentDiscountPercentage / 100));
            const finalCalculatedTotal = initialOrderTotal - calculatedDiscountAmount;

            let currentAmountPaid = parseFloat(paymentDetails.amountPaid) || 0;

            // If payment type is Credit Card or Mobile Pay, amountPaid should match finalTotal
            if (paymentDetails.paymentType !== 'Cash') {
                currentAmountPaid = finalCalculatedTotal;
            } else {
                // If switching back to Cash and it was previously auto-filled, reset amountPaid to empty
                if (prevPaymentTypeRef.current !== 'Cash' && paymentDetails.amountPaid === prevPaymentTypeRef.current) {
                    // This specific condition ensures that if amountPaid was *just* auto-filled by a non-cash type
                    // and then user switches to cash, it resets.
                    currentAmountPaid = '';
                }
            }

            const change = currentAmountPaid - finalCalculatedTotal;

            setPaymentDetails(prev => ({
                ...prev,
                discountAmount: calculatedDiscountAmount, // Derived value
                finalTotal: finalCalculatedTotal, // Derived value
                changeDue: Math.max(0, change), // Ensure change is not negative
                amountPaid: currentAmountPaid // Update based on payment type logic
            }));
        }
    }, [
        paymentDetails.amountPaid,
        paymentDetails.discountPercentage,
        paymentDetails.paymentType,
        selectedOrderToComplete,
        prevPaymentTypeRef // Include ref in dependencies to trigger when its .current changes
    ]);


    // Handles changes in payment detail input fields
    const handlePaymentDetailChange = (e) => {
        const { name, value } = e.target;
        // Store the current paymentType before it's potentially updated
        prevPaymentTypeRef.current = paymentDetails.paymentType;

        if (name === 'amountPaid' || name === 'discountPercentage') {
             // Allow empty string for amountPaid if user clears it, otherwise parse to float
             const numericValue = value === '' ? '' : parseFloat(value);
             setPaymentDetails(prev => ({ ...prev, [name]: numericValue }));
        } else {
             setPaymentDetails(prev => ({ ...prev, [name]: value }));
        }
    };

    // Handles the final confirmation to complete an order
    const handleConfirmCompleteOrder = async () => {
        if (!selectedOrderToComplete) return;

        const finalAmountForPayment = paymentDetails.finalTotal;

        // Validation for amountPaid only if payment type is Cash
        if (paymentDetails.paymentType === 'Cash') {
            if (paymentDetails.amountPaid === '' || isNaN(parseFloat(paymentDetails.amountPaid))) {
                setError("Please enter a valid amount paid.");
                return;
            }
            if (parseFloat(paymentDetails.amountPaid) < finalAmountForPayment) {
                setError("Amount paid cannot be less than the final total after discount.");
                return;
            }
        }

        if (!currentUser) {
            setError("User not authenticated. Cannot complete order.");
            return;
        }

        const payload = {
            paymentType: paymentDetails.paymentType,
            amountPaid: parseFloat(paymentDetails.amountPaid),
            discountPercentage: parseFloat(paymentDetails.discountPercentage),
            discountAmount: paymentDetails.discountAmount, // Use the calculated discountAmount
            changeDue: paymentDetails.changeDue, // Use the calculated changeDue
            finalTotal: finalAmountForPayment, // Crucial: Send the final calculated total
            cashierId: currentUser.id
        };

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${selectedOrderToComplete.id}/complete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            console.log(`Order ${selectedOrderToComplete.id} completed successfully.`);
            setReceiptData({
                ...selectedOrderToComplete,
                ...payload,
                completionDate: new Date(),
                items: selectedOrderToComplete.items // Pass original items for receipt display
            });
            setShowConfirmCompleteModal(false);
            setSelectedOrderToComplete(null);
            fetchPendingOrders(); // Re-fetch to update the list, removing the completed order
            setShowReceiptModal(true); // Show receipt modal
        } catch (err) {
            console.error('Error completing order:', err);
            setError(`Failed to complete order: ${err.message}`);
        }
    };

    // Handles viewing full order information
    const handleViewOrderInfo = (order) => {
        setSelectedOrderInfo(order);
        setShowInfoModal(true);
    };

    // Handles printing the receipt
    const handlePrintReceipt = () => {
        if (!receiptData) {
            console.error("No receipt data available for printing.");
            return;
        }

        // Create a hidden iframe for printing
        const printFrame = document.createElement('iframe');
        printFrame.style.display = 'none';
        document.body.appendChild(printFrame);

        // Get the content from the receipt modal
        const receiptContent = document.getElementById('receipt-content').innerHTML;

        // Write the HTML to the iframe
        const doc = printFrame.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt Print</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body {
                        font-family: 'Inter', sans-serif;
                        margin: 0;
                        padding: 20px;
                        color: #1f2937; /* Tailwind gray-900 */
                    }
                    /* Add specific print styles here if needed to override modal styles */
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact; /* For better background color printing */
                            print-color-adjust: exact;
                        }
                        h3, h4, p, span, li { color: #000 !important; }
                        .text-red-600 { color: #dc2626 !important; }
                        .text-blue-600 { color: #2563eb !important; }
                        .font-bold { font-weight: 700 !important; }
                        .font-semibold { font-weight: 600 !important; }
                    }
                </style>
            </head>
            <body>
                <div style="max-width: 300px; margin: 0 auto; padding: 20px; border-top: 4px solid #3b82f6;">
                    ${receiptContent}
                </div>
            </body>
            </html>
        `);
        doc.close();

        // Wait for iframe content to load and then print
        printFrame.contentWindow.onload = () => {
            try {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
            } catch (err) {
                console.error("Error during iframe printing:", err);
            } finally {
                // Remove the iframe after a short delay
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                }, 1000);
            }
        };
    };

    const canManageOrders = currentUser && ['admin', 'manager', 'cashier', 'waiter'].includes(currentUser.role);
    const canCompleteOrders = currentUser && ['admin', 'manager', 'cashier'].includes(currentUser.role);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="ml-3 text-lg text-gray-700">Loading pending orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
                <p className="text-lg font-semibold text-red-600">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-inter">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Dashboard / <span className="text-blue-600">Pending Orders</span>
                </h1>
                <button
                    onClick={fetchPendingOrders}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium shadow-md"
                    title="Refresh Orders"
                >
                    <RefreshCcw size={16} className="mr-2" /> Refresh
                </button>
            </div>

            {pendingOrders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-6 text-center text-gray-600">
                    <p className="text-lg">No pending orders found. All clear!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pendingOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col border-t-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Order #{order.transaction_id.split('-')[1]}</h2>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)} bg-opacity-20 flex items-center gap-1`}>
                                    {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                            </div>
                            <p className="text-gray-600 mb-2">
                                <span className="font-medium">Table:</span> {order.table_name ? `${order.floor_name} - ${order.table_name}` : 'Walk-in'}
                            </p>
                            <p className="text-gray-600 mb-2">
                                <span className="font-medium">Waiter:</span> {order.waiter_username || 'N/A'}
                            </p>
                            <p className="text-gray-600 mb-4">
                                <span className="font-medium">Date:</span> {new Date(order.order_date).toLocaleString()}
                            </p>

                            <div className="mb-4">
                                <h3 className="font-semibold text-gray-700 mb-2">Items:</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm bg-gray-50 rounded-lg overflow-hidden">
                                        <thead className="bg-gray-200">
                                            <tr>
                                                <th className="py-2 px-3 text-left font-medium text-gray-700">Item</th>
                                                <th className="py-2 px-3 text-left font-medium text-gray-700">Qty</th>
                                                <th className="py-2 px-3 text-left font-medium text-gray-700">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item, itemIdx) => (
                                                <tr key={item.item_id || itemIdx} className="border-t border-gray-100">
                                                    <td className="py-2 px-3 text-gray-800">{item.product.name}</td>
                                                    <td className="py-2 px-3 text-gray-600">{item.quantity}</td>
                                                    <td className={`py-2 px-3 text-gray-600 flex items-center gap-1 ${getStatusColor(item.item_status)}`}>
                                                        {getStatusIcon(item.item_status)} {item.item_status.charAt(0).toUpperCase() + item.item_status.slice(1)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-200 flex flex-col items-center sm:flex-row sm:justify-between sm:items-center">
                                <span className="text-lg font-bold text-gray-900 mb-2 sm:mb-0">Total: {formatCurrency(order.final_total)}</span>
                                <div className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    {canManageOrders && order.status !== 'served' && order.status !== 'completed' && (
                                        <button
                                            onClick={() => handleMarkAsServed(order.id)}
                                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 text-sm font-medium shadow-md flex items-center justify-center gap-1 flex-grow sm:flex-grow-0"
                                            disabled={order.status === 'served' || order.status === 'completed'}
                                        >
                                            <BellRing size={16} /> Mark Served
                                        </button>
                                    )}
                                    {canCompleteOrders && (
                                        <button
                                            onClick={() => handleCompleteOrderClick(order)}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm font-medium shadow-md flex items-center justify-center gap-1 flex-grow sm:flex-grow-0"
                                            disabled={order.status === 'completed'}
                                        >
                                            <CheckCircle size={16} /> TakePayment
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleViewOrderInfo(order)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium shadow-md flex items-center justify-center gap-1 flex-grow sm:flex-grow-0"
                                    >
                                        <Eye size={16} /> View
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Complete Order Modal */}
            {showConfirmCompleteModal && selectedOrderToComplete && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Complete Order #{selectedOrderToComplete.transaction_id}</h3>
                        <p className="text-gray-700 mb-4">
                            Initial Total: <span className="font-bold">{formatCurrency(selectedOrderToComplete.initial_total)}</span>
                        </p>
                        <p className="text-gray-700 mb-4">
                            Final Total (after discount): <span className="font-bold text-blue-600">{formatCurrency(paymentDetails.finalTotal)}</span>
                        </p>
                        <div className="mb-4">
                            <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                            <select
                                id="paymentType"
                                name="paymentType"
                                value={paymentDetails.paymentType}
                                onChange={handlePaymentDetailChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Credit Card">Card</option>
                                <option value="Mobile Pay">Mobile Pay</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                            <input
                                type="number"
                                id="discountPercentage"
                                name="discountPercentage"
                                value={paymentDetails.discountPercentage}
                                onChange={handlePaymentDetailChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                step="0.01"
                                min="0" max="100"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
                            <input
                                type="number"
                                id="discountAmount"
                                name="discountAmount"
                                value={paymentDetails.discountAmount.toFixed(2)}
                                readOnly
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                                step="0.01"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                            <input
                                type="number"
                                id="amountPaid"
                                name="amountPaid"
                                value={paymentDetails.paymentType !== 'Cash' ? paymentDetails.finalTotal.toFixed(2) : paymentDetails.amountPaid}
                                onChange={handlePaymentDetailChange}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500
                                    ${paymentDetails.paymentType !== 'Cash' ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                                step="0.01"
                                readOnly={paymentDetails.paymentType !== 'Cash'}
                            />
                        </div>
                        <p className="text-gray-700 mb-4">
                            Change Due: <span className="font-bold">{formatCurrency(paymentDetails.changeDue)}</span>
                        </p>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowConfirmCompleteModal(false)}
                                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmCompleteOrder}
                                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                            >
                                Confirm Completion
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Info Modal */}
            {showInfoModal && selectedOrderInfo && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Order Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Order ID</p>
                                <p className="text-lg font-semibold text-gray-900">{selectedOrderInfo.transaction_id}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Status</p>
                                <p className={`text-lg font-semibold ${getStatusColor(selectedOrderInfo.status)} flex items-center gap-1`}>
                                    {getStatusIcon(selectedOrderInfo.status)} {selectedOrderInfo.status.charAt(0).toUpperCase() + selectedOrderInfo.status.slice(1)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Table</p>
                                <p className="text-lg text-gray-900">{selectedOrderInfo.table_name ? `${selectedOrderInfo.floor_name} - ${selectedOrderInfo.table_name}` : 'Walk-in'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Waiter</p>
                                <p className="text-lg text-gray-900">{selectedOrderInfo.waiter_username || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Order Date</p>
                                <p className="text-lg text-gray-900">{new Date(selectedOrderInfo.order_date).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Initial Total</p>
                                <p className="text-lg text-gray-900">{formatCurrency(selectedOrderInfo.initial_total)}</p>
                            </div>
                            {selectedOrderInfo.discount_percentage > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Discount (%)</p>
                                    <p className="text-lg text-gray-900">{selectedOrderInfo.discount_percentage}%</p>
                                </div>
                            )}
                            {selectedOrderInfo.discount_amount > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Discount Amount</p>
                                    <p className="text-lg text-gray-900">{formatCurrency(selectedOrderInfo.discount_amount)}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-500">Final Total</p>
                                <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedOrderInfo.final_total)}</p>
                            </div>
                            {selectedOrderInfo.status === 'completed' && (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Payment Type</p>
                                        <p className="text-lg text-gray-900">{selectedOrderInfo.payment_type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Amount Paid</p>
                                        <p className="text-lg text-gray-900">{formatCurrency(selectedOrderInfo.amount_paid || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Change Due</p>
                                        <p className="text-lg text-gray-900">{formatCurrency(selectedOrderInfo.change_due || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Cashier</p>
                                        <p className="text-lg text-gray-900">{selectedOrderInfo.cashier_username || 'N/A'}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <h4 className="text-xl font-semibold text-gray-800 mb-3">Ordered Items</h4>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price at Sale</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedOrderInfo.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.product.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.product.price)}</td>
                                            <td className={`px-4 py-2 whitespace-nowrap text-sm ${getStatusColor(item.item_status)} flex items-center gap-1`}>
                                                {getStatusIcon(item.item_status)} {item.item_status.charAt(0).toUpperCase() + item.item_status.slice(1)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal (visual preview) */}
            {showReceiptModal && receiptData && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md font-inter border-t-4 border-blue-500 relative">
                        {/* Close button for the modal */}
                        <button
                            onClick={() => setShowReceiptModal(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                            aria-label="Close"
                        >
                            <XCircle size={24} />
                        </button>

                        <div id="receipt-content"> {/* Added id for targeting this content for print */}
                            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Receipt</h3>
                            <div className="text-sm text-gray-700 space-y-2 mb-6 border-b pb-4 border-gray-200">
                                <p><strong>Order ID:</strong> {receiptData.transaction_id}</p>
                                <p><strong>Date:</strong> {new Date(receiptData.completionDate).toLocaleString()}</p>
                                <p><strong>Payment Method:</strong> {receiptData.paymentType}</p>
                                <p><strong>Cashier:</strong> {currentUser?.username || 'N/A'}</p>
                                <p><strong>Table/Walk-in:</strong> {receiptData.table_name ? `${receiptData.floor_name} - ${receiptData.table_name}` : 'Walk-in'}</p>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-800 mb-2">Items Purchased:</h4>
                                <ul className="space-y-1 text-gray-700">
                                    {receiptData.items.map((item, index) => (
                                        <li key={index} className="flex justify-between">
                                            <span>{item.quantity} x {item.product.name}</span>
                                            <span>{formatCurrency(item.quantity * item.product.price)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="text-lg font-semibold text-gray-800 space-y-2 border-t pt-4 border-gray-200">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(receiptData.initial_total)}</span>
                                </div>
                                {receiptData.discountAmount > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(receiptData.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xl font-bold text-blue-600">
                                    <span>Total:</span>
                                    <span>{formatCurrency(receiptData.final_total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Amount Paid:</span>
                                    <span>{formatCurrency(receiptData.amountPaid)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Change Due:</span>
                                    <span>{formatCurrency(receiptData.changeDue)}</span>
                                </div>
                            </div>

                            <p className="text-center text-xs text-gray-500 mt-6">Thank you for spent time with us</p>
                        </div> {/* End of receipt-content */}

                        <div className="flex justify-center space-x-3 mt-6">
                            <button
                                onClick={handlePrintReceipt}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center gap-2"
                            >
                                <Printer size={16} /> Print Receipt
                            </button>
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingOrders;
