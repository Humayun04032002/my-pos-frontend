// src/components/ReceiptModal.js
import React, { useEffect } from 'react';

// ReceiptModal Component: Displays a detailed receipt for a selected transaction.
// It expects `receiptData` (the full transaction object) and `onClose` function.
function ReceiptModal({ receiptData, onClose }) {
    // Add a console log to confirm when ReceiptModal is mounted and what data it receives
    useEffect(() => {
        console.log("ReceiptModal: Mounted with receiptData:", receiptData);
    }, [receiptData]);

    // If no receipt data is provided, or the data structure is unexpected, render nothing or a loading state.
    if (!receiptData) {
        console.warn("ReceiptModal: No receiptData received, rendering null.");
        return null;
    }

    // Destructure necessary properties from receiptData for easier access.
    // Use default empty array for 'items' to prevent errors if 'items' is undefined.
    const {
        transaction_id,
        order_date,
        payment_type,
        final_total,
        cashier_username,
        waiter_username,
        table_name,
        amountPaid, // Add amountPaid
        changeDue,  // Add changeDue
        items = [] // Ensure 'items' is an array, default to empty if not present
    } = receiptData;

    // Helper to format date for display
    const formatDate = (dateString) => {
        if (!dateString) {
            console.log("formatDate: dateString is null or empty. Cannot format date.");
            return 'N/A';
        }
        try {
            const date = new Date(dateString);

            if (isNaN(date.getTime())) {
                console.error("formatDate: Invalid date string received:", dateString);
                return 'Invalid Date';
            }

            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };

            return date.toLocaleString(undefined, options);
        } catch (error) {
            console.error("Error formatting date:", error, "Input:", dateString);
            return 'Error Formatting Date';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        // Removed 'print:hidden' from this outermost div.
        // The 'body * { visibility: hidden; }' in index.css will now hide this overlay by default during print,
        // and only the 'print-area' content will be made visible.
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-auto">
            {/* The actual receipt content that should be visible when printing */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto transform transition-all sm:my-8 sm:align-middle sm:max-w-md md:max-w-lg lg:max-w-xl print-area"> {/* print-area class ensures this content is visible during print */}
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Transaction Receipt</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors print:hidden" // Hide close button on print
                        aria-label="Close receipt"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Modal Body - Receipt Content */}
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-2">Transaction ID: <span className="font-semibold">{transaction_id || 'N/A'}</span></p>
                    <p className="text-sm text-gray-600 mb-2">Date: <span className="font-semibold">{formatDate(order_date)}</span></p>
                    <p className="text-sm text-gray-600 mb-2">Payment Type: <span className="font-semibold capitalize">{payment_type || 'N/A'}</span></p>
                    {cashier_username && <p className="text-sm text-gray-600 mb-2">Cashier: <span className="font-semibold">{cashier_username}</span></p>}
                    {waiter_username && <p className="text-sm text-gray-600 mb-2">Waiter: <span className="font-semibold">{waiter_username}</span></p>}
                    {table_name && <p className="text-sm text-gray-600 mb-4">Table: <span className="font-semibold">{table_name}</span></p>}

                    {/* Items List */}
                    <div className="border-t border-b border-gray-200 py-4 mb-4">
                        <p className="font-bold text-gray-800 mb-2">Items:</p>
                        <div className="space-y-2">
                            {items.length > 0 ? (
                                items.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm text-gray-700">
                                        <span>{item.product?.name || 'Unknown Item'} (x{item.quantity || 1})</span>
                                        <span>
                                            {formatCurrency((item.product?.price || 0) * (item.quantity || 1))}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center">No items listed for this transaction.</p>
                            )}
                        </div>
                    </div>

                    {/* Total Section */}
                    <div className="mt-6 pt-4 border-t border-gray-300">
                        <p className="flex justify-between items-center text-lg font-bold text-gray-900">
                            <span>Total Amount:</span>
                            <span>{formatCurrency(final_total || 0)}</span> {/* Safely display final_total */}
                        </p>
                        {payment_type === 'cash' && (
                            <>
                                <p className="flex justify-between items-center text-sm text-gray-700 mt-2">
                                    <span>Amount Paid:</span>
                                    <span>{formatCurrency(amountPaid || 0)}</span>
                                </p>
                                <p className="flex justify-between items-center text-md font-semibold text-green-700 mt-2">
                                    <span>Change Due:</span>
                                    <span>{formatCurrency(changeDue || 0)}</span>
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 print:hidden" // Hide close button on print
                    >
                        Close
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="ml-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 print:hidden" // Hide print button on print
                    >
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReceiptModal;
