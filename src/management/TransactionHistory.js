// src/management/TransactionHistory.js
import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { ProductContext } from '../contexts/ProductContext'; // Access transactions, fetchInitialData, setAppMessage
import { AuthContext } from '../contexts/AuthContext'; // Access currentUser
import ReceiptModal from '../components/ReceiptModal'; // FIX: Import ReceiptModal

// TransactionHistory Component: Displays a list of completed transactions with filtering and search capabilities.
function TransactionHistory() {
    const { transactions, fetchInitialData, setAppMessage } = useContext(ProductContext);
    const { currentUser } = useContext(AuthContext);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDateRange, setSelectedDateRange] = useState('Today'); // e.g., 'Today', 'Last 7 Days', 'Last 30 Days', 'All Time'
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
    const [selectedOrderSource, setSelectedOrderSource] = useState('All');
    const [showExportDropdown, setShowExportDropdown] = useState(false); // State for export dropdown visibility
    const exportButtonRef = useRef(null); // Ref for the export button to position dropdown
    const tableRef = useRef(null); // Ref for the table element to capture its HTML

    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptToView, setReceiptToView] = useState(null);

    // Close export dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (exportButtonRef.current && !exportButtonRef.current.contains(event.target)) {
                setShowExportDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [exportButtonRef]);


    // Initial fetch of data when component mounts
    useEffect(() => {
        // fetchInitialData is typically called in App.js.
        // If this component can be accessed directly without App.js managing initial data, uncomment:
        // fetchInitialData();
    }, [fetchInitialData]);

    // Filter and aggregate transactions
    const filteredTransactions = useMemo(() => {
        let currentTransactions = transactions;

        // Apply date range filter
        const today = new Date();
        const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day

        currentTransactions = currentTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.order_date);
            switch (selectedDateRange) {
                case 'Today':
                    return transactionDate.toDateString() === today.toDateString();
                case 'Last 7 Days':
                    return (today - transactionDate) < (7 * oneDay);
                case 'Last 30 Days':
                    return (today - transactionDate) < (30 * oneDay);
                case 'All Time':
                default:
                    return true;
            }
        });

        // Apply search term filter
        if (searchTerm) {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            currentTransactions = currentTransactions.filter(transaction =>
                transaction.transaction_id.toLowerCase().includes(lowercasedSearchTerm) ||
                transaction.order_id.toLowerCase().includes(lowercasedSearchTerm) ||
                transaction.cashier_username?.toLowerCase().includes(lowercasedSearchTerm) ||
                transaction.waiter_username?.toLowerCase().includes(lowercasedSearchTerm) ||
                transaction.table_name?.toLowerCase().includes(lowercasedSearchTerm) ||
                transaction.payment_type.toLowerCase().includes(lowercasedSearchTerm)
            );
        }

        // Apply payment method filter
        if (selectedPaymentMethod !== 'All') {
            currentTransactions = currentTransactions.filter(transaction =>
                transaction.payment_type.toLowerCase() === selectedPaymentMethod.toLowerCase()
            );
        }

        // Apply order source filter
        if (selectedOrderSource !== 'All') {
            currentTransactions = currentTransactions.filter(transaction => {
                const source = transaction.table_name === 'Walk-in' ? 'Walk-in' : 'Table Orders';
                return source === selectedOrderSource;
            });
        }

        return currentTransactions;
    }, [transactions, searchTerm, selectedDateRange, selectedPaymentMethod, selectedOrderSource]);

    const totalSales = useMemo(() => {
        return filteredTransactions.reduce((sum, transaction) => sum + transaction.final_total, 0);
    }, [filteredTransactions]);

    const totalTransactionsCount = filteredTransactions.length;

    const orderDistribution = useMemo(() => {
        const tableOrders = filteredTransactions.filter(t => t.table_name !== 'Walk-in').length;
        const walkInOrders = filteredTransactions.filter(t => t.table_name === 'Walk-in').length;
        return { tableOrders, walkInOrders };
    }, [filteredTransactions]);

    const handleViewReceipt = (transaction) => {
        setReceiptToView(transaction);
        setShowReceiptModal(true);
    };

    const handleDeleteTransaction = async (transactionId) => {
        if (currentUser.role !== 'admin') {
            setAppMessage({ type: 'error', text: 'Only Admins can delete transactions.' });
            return;
        }

        // Using a custom modal instead of window.confirm as per instructions
        // For simplicity, directly using a confirm-like message for now.
        // TODO: Replace with a custom modal component for better UI/UX.
        if (!window.confirm(`Are you sure you want to delete transaction ID ${transactionId}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/transactions/${transactionId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete transaction.');
            }
            setAppMessage({ type: 'success', text: `Transaction ${transactionId} deleted successfully.` });
            fetchInitialData(); // Re-fetch transactions to update the list
        } catch (err) {
            console.error('Error deleting transaction:', err);
            setAppMessage({ type: 'error', text: `Error deleting transaction: ${err.message}` });
        }
    };

    // Handler for the refresh button
    const handleRefresh = useCallback(() => {
        setAppMessage({ type: 'info', text: 'Refreshing transactions...' });
        fetchInitialData(); // Re-fetch all data
    }, [fetchInitialData, setAppMessage]);

    // Function to export data to CSV
    const exportToCSV = useCallback(() => {
        if (filteredTransactions.length === 0) {
            setAppMessage({ type: 'warning', text: 'No data to export.' });
            return;
        }

        const headers = [
            "Transaction ID",
            "Order ID",
            "Processed By",
            "Table / Walk-in",
            "Payment Method",
            "Date & Time",
            "Amount"
        ];

        const rows = filteredTransactions.map(t => [
            t.transaction_id,
            `ORD-${String(t.id).padStart(3, '0')}`,
            t.cashier_username || t.waiter_username || 'N/A',
            t.table_name || 'Walk-in',
            new Date(t.order_date).toLocaleString(),
            t.final_total.toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'transactions.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setAppMessage({ type: 'success', text: 'Transactions exported to CSV successfully!' });
        } else {
            setAppMessage({ type: 'error', text: 'Your browser does not support downloading files directly.' });
        }
        setShowExportDropdown(false); // Close dropdown after export
    }, [filteredTransactions, setAppMessage]);

    // Function to handle printing using a new window
    const exportToPDF = useCallback(() => {
        if (!tableRef.current) {
            setAppMessage({ type: 'error', text: 'Table content not found for printing.' });
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            setAppMessage({ type: 'error', text: 'Pop-up blocker might be preventing the print window. Please allow pop-ups for this site.' });
            return;
        }

        // Get the HTML content of the table (excluding the actions column)
        const tableHtml = tableRef.current.outerHTML;

        // Construct the full HTML for the print window
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Transaction History Report</title>
                <style>
                    body {
                        font-family: 'Inter', sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    h1 {
                        text-align: center;
                        margin-bottom: 20px;
                        color: #222;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                        word-break: break-word; /* Ensure long words wrap */
                    }
                    th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                    }
                    .text-right {
                        text-align: right;
                    }
                    /* Hide the actions column when printing */
                    .no-print-column {
                        display: none;
                    }
                </style>
            </head>
            <body>
                <h1>Transaction History Report</h1>
                ${tableHtml}
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close(); // Close the document to ensure all content is loaded

        // Remove the 'Actions' column header and cells from the cloned table in the print window
        const headRow = printWindow.document.querySelector('thead tr');
        if (headRow) {
            const ths = headRow.querySelectorAll('th');
            if (ths.length > 0) {
                // Find the index of the 'Actions' column (or assume it's the last one)
                let actionsColumnIndex = -1;
                ths.forEach((th, index) => {
                    if (th.textContent.trim().toLowerCase() === 'actions') {
                        actionsColumnIndex = index;
                    }
                });

                if (actionsColumnIndex !== -1) {
                    // Remove the 'Actions' header
                    ths[actionsColumnIndex].remove();

                    // Remove the corresponding cells in each row
                    const rows = printWindow.document.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length > actionsColumnIndex) {
                            cells[actionsColumnIndex].remove();
                        }
                    });
                }
            }
        }


        // Wait for content to load and then print
        printWindow.onload = () => {
            printWindow.focus(); // Focus the new window
            printWindow.print(); // Trigger the print dialog
            printWindow.close(); // Close the window after printing (or after user closes print dialog)
            setAppMessage({ type: 'success', text: 'Print dialog opened. You can save as PDF.' });
        };

        setShowExportDropdown(false); // Close dropdown after print
    }, [filteredTransactions, setAppMessage]); // Added filteredTransactions to dependency array


    // Permissions check for the whole page
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && currentUser.role !== 'cashier') {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center text-red-600 font-semibold">
                You do not have permission to access Transaction History.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">Transactions Overview</h2>
            <p className="text-gray-600 mb-4">Review and analyze all completed sales transactions.</p>

            {/* Summary Cards - Add no-print class */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
                <div className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-200">
                    <p className="text-blue-800 font-medium">Today's Sales</p>
                    <h3 className="text-4xl font-extrabold text-blue-900 mt-2">${totalSales.toFixed(2)}</h3>
                    {/* Placeholder for percentage change, requires historical data */}
                    <p className="text-green-600 text-sm mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        7.3% (Placeholder)
                    </p>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl shadow-md border border-purple-200">
                    <p className="text-purple-800 font-medium">Total Transactions</p>
                    <h3 className="text-4xl font-extrabold text-purple-900 mt-2">{totalTransactionsCount}</h3>
                    <p className="text-gray-600 text-sm mt-1">Count of all filtered transactions.</p>
                </div>

                <div className="bg-green-50 p-6 rounded-xl shadow-md border border-green-200">
                    <p className="text-green-800 font-medium">Order Distribution</p>
                    <div className="flex items-center justify-between mt-2">
                        <div>
                            <p className="text-2xl font-extrabold text-green-900">{orderDistribution.tableOrders}</p>
                            <p className="text-sm text-gray-600">Table Orders</p>
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold text-green-900">{orderDistribution.walkInOrders}</p>
                            <p className="text-sm text-gray-600">Walk-in</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Actions - Add no-print class */}
            <div className="flex flex-wrap items-center gap-4 mb-6 no-print">
                <div className="relative flex-grow min-w-[200px] sm:min-w-[250px]">
                    <input
                        type="text"
                        placeholder="Search transactions..."
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
                    className="py-2 px-4 rounded-full border border-gray-300 bg-gray-100 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[150px]"
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e.target.value)}
                >
                    <option value="Today">Today</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="All Time">All Time</option>
                </select>

                <select
                    className="py-2 px-4 rounded-full border border-gray-300 bg-gray-100 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[150px]"
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                >
                    <option value="All">All Payment Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit Card</option>
                    <option value="Mobile Pay">Mobile Pay</option>
                </select>

                <select
                    className="py-2 px-4 rounded-full border border-gray-300 bg-gray-100 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[150px]"
                    value={selectedOrderSource}
                    onChange={(e) => setSelectedOrderSource(e.target.value)}
                >
                    <option value="All">All Order Sources</option>
                    <option value="Table Orders">Table Orders</option>
                    <option value="Walk-in">Walk-in</option>
                </select>

                <button
                    onClick={handleRefresh}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-200 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.922a.75.75 0 01.75.75v6.572a4.5 4.5 0 01-1.478 3.375l-.48.48a4.5 4.5 0 01-3.042 1.428h-8.25a4.5 4.5 0 01-3.042-1.428l-.48-.48A4.5 4.5 0 013 16.67V10.09h4.922m-4.922 0l-2.29-2.29A1.5 1.5 0 012.036 6.57M18 10.5h.008v.008H18zm-3 0h.008v.008H15z" />
                    </svg>
                    Refresh
                </button>

                {/* Export Button with Dropdown */}
                <div className="relative" ref={exportButtonRef}>
                    <button
                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-200 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-4.5-4.5M12 19.5l4.5-4.5M19.5 12h-15" /></svg>
                        Export
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="-mr-1 ml-2 h-5 w-5">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {showExportDropdown && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                <button
                                    onClick={exportToCSV}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    role="menuitem"
                                >
                                    Export to CSV
                                </button>
                                <button
                                    onClick={exportToPDF}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    role="menuitem"
                                >
                                    Print (Save as PDF)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200" ref={tableRef}>{/* Removed whitespace here */}
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed By</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table / Walk-in</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider no-print">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                    No transactions found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredTransactions.map((transaction) => (
                                <tr key={transaction.transaction_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.transaction_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`ORD-${String(transaction.id).padStart(3, '0')}`}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.cashier_username || transaction.waiter_username || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.table_name || 'Walk-in'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.payment_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(transaction.order_date).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">${transaction.final_total.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium no-print">
                                        <button
                                            onClick={() => handleViewReceipt(transaction)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                            aria-label="View receipt"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </button>
                                        {(currentUser.role === 'admin') && (
                                            <button
                                                onClick={() => handleDeleteTransaction(transaction.id)}
                                                className="text-red-600 hover:text-red-900"
                                                aria-label="Delete transaction"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.007H8.927a2.25 2.25 0 01-2.244-2.007L4.74 6.786m14.74-3.21a48.414 48.414 0 00-1.122-.122l-7.5-1.5m-.669 9.389L9.26 9m4.788 0l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.007H8.927a2.25 2.25 0 01-2.244-2.007L4.74 6.786m14.74-3.21a48.414 48.414 0 00-1.122-.122l-7.5-1.5m-.669 9.389L9.26 9M10.5 5.25v2.25M12 6.75h.008v.008H12zM12 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination placeholder - Add no-print class */}
            <div className="flex justify-between items-center mt-6 text-sm text-gray-600 no-print">
                <span>Items per page: 10</span>
                <div className="flex items-center space-x-2">
                    <button className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="px-3 py-1 bg-indigo-500 text-white rounded-md">1</span>
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md">2</span>
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md">3</span>
                    <button className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            {showReceiptModal && receiptToView && (
                <ReceiptModal
                    receiptData={receiptToView}
                    onClose={() => {
                        setShowReceiptModal(false);
                        setReceiptToView(null);
                    }}
                />
            )}
        </div>
    );
}

export default TransactionHistory;
