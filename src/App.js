// src/App.js
import React, { useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import './App.css'; // For general app styles

// Components
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import ReceiptModal from './components/ReceiptModal';
import Login from './components/Login';

// Management Components
import MenuManagement from './management/MenuManagement';
import TableManagement from './management/TableManagement';
import UserManagement from './management/UserManagement';
import TransactionHistory from './management/TransactionHistory';
import SalesAnalysis from './management/SalesAnalysis';
import PendingOrdersList from './management/PendingOrdersList';
import KitchenDisplay from './kitchen/KitchenDisplay';

// Contexts
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import { ProductContext } from './contexts/ProductContext';

function AppWrapper() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

// New component for the order confirmation modal
const OrderConfirmationModal = ({ isOpen, onClose, orderData, onConfirm }) => {
    if (!isOpen || !orderData) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Confirm Order</h2>
                <div className="mb-4">
                    <p className="text-gray-700">Order for: <span className="font-semibold">{orderData.table_name}</span></p>
                    {orderData.orderId && <p className="text-gray-700">Order ID: <span className="font-semibold">{orderData.orderId}</span></p>}
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">Items:</h3>
                <ul className="list-disc list-inside mb-6 max-h-48 overflow-y-auto border p-3 rounded-md bg-gray-50">
                    {orderData.items.length > 0 ? (
                        orderData.items.map((item, index) => (
                            <li key={index} className="text-gray-700 text-sm">
                                {item.quantity} x {item.product.name} @ ${item.product.price.toFixed(2)} = ${(item.quantity * item.product.price).toFixed(2)}
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-500">No items in this order.</li>
                    )}
                </ul>
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onClose} // Allows closing the modal without confirming the reset
                        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition duration-200 ease-in-out"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition duration-200 ease-in-out"
                    >
                        Confirm Order
                    </button>
                </div>
            </div>
        </div>
    );
};


function AppContent() {
    const { currentUser, logout } = useContext(AuthContext);

    // State for core POS functionality
    const [products, setProducts] = useState({}); // Products grouped by category
    const [cart, setCart] = useState([]); // Cart structure: [{ product: {...}, quantity: N }]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [appMessage, setAppMessage] = useState(null);

    // State for navigation/UI views
    const [currentView, setCurrentView] = useState(() => {
        if (!currentUser) return 'login';
        switch (currentUser.role) {
            case 'admin':
            case 'manager':
            case 'cashier':
            case 'waiter':
                return 'pos';
            case 'chef':
                return 'kitchen-display';
            default:
                return 'login';
        }
    });

    // Floor and Table States
    const [floors, setFloors] = useState([]);
    const [tables, setTables] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isWalkInOrder, setIsWalkInOrder] = useState(false);

    // NEW STATE: Manages the sub-view within the 'pos' section
    const [posSubView, setPosSubView] = useState('floor-selection'); // 'floor-selection', 'table-selection', 'product-selection'

    // NEW STATE: Manages the visibility of the "Management Menu" sidebar/modal
    const [showManagementMenu, setShowManagementMenu] = useState(false);
    // NEW STATE: Manages the visibility of the user dropdown menu
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userDropdownRef = useRef(null); // Ref for handling clicks outside dropdown

    // NEW STATES for Order Confirmation Modal
    const [showOrderConfirmationModal, setShowOrderConfirmationModal] = useState(false);
    const [confirmedOrderData, setConfirmedOrderData] = useState(null);


    // Pending Orders and Transactions States
    const [pendingOrders, setPendingOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // State to hold the ID of the order currently being processed (if loaded from pending orders)
    const [currentProcessingOrderId, setCurrentProcessingOrderId] = useState(null);

    // State for Search and Product Categories (for main POS product list)
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Effect to clear global messages automatically after a delay
    useEffect(() => {
        if (appMessage) {
            const timer = setTimeout(() => {
                setAppMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [appMessage]);

    // Effect to close user dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [userDropdownRef]);


    // Function to fetch all necessary data from the backend
    const fetchInitialData = useCallback(async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const productsResponse = await fetch('https://my-pos-backend.onrender.com/api/products');
            if (!productsResponse.ok) {
                const errorText = await productsResponse.text();
                throw new Error(`HTTP error! Status: ${productsResponse.status} for products. Response: ${errorText.substring(0, 100)}...`);
            }
            const productsData = await productsResponse.json();
            const groupedProducts = productsData.reduce((acc, product) => {
                const category = product.category || 'Uncategorized'; // Default category for products without one
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(product);
                return acc;
            }, {});
            setProducts(groupedProducts); // Set grouped products here

            const floorsResponse = await fetch('https://my-pos-backend.onrender.com/api/floors');
            if (!floorsResponse.ok) {
                const errorText = await floorsResponse.text();
                throw new Error(`HTTP error! Status: ${floorsResponse.status} for floors. Response: ${errorText.substring(0, 100)}...`);
            }
            const floorsData = await floorsResponse.json();
            setFloors(floorsData);

            const tablesResponse = await fetch('https://my-pos-backend.onrender.com/api/tables');
            if (!tablesResponse.ok) {
                const errorText = await tablesResponse.text();
                throw new Error(`HTTP error! Status: ${tablesResponse.status} for tables. Response: ${errorText.substring(0, 100)}...`);
            }
            const tablesData = await tablesResponse.json();
            setTables(tablesData);

            const pendingOrdersResponse = await fetch('https://my-pos-backend.onrender.com/api/pending-orders');
            if (!pendingOrdersResponse.ok) {
                const errorText = await pendingOrdersResponse.text();
                throw new Error(`HTTP error! Status: ${pendingOrdersResponse.status} for pending orders. Response: ${errorText.substring(0, 100)}...`);
            }
            const pendingOrdersData = await pendingOrdersResponse.json();
            setPendingOrders(pendingOrdersData);

            const transactionsResponse = await fetch('https://my-pos-backend.onrender.com/api/transactions');
            if (!transactionsResponse.ok) {
                const errorText = await transactionsResponse.text();
                throw new Error(`HTTP error! Status: ${transactionsResponse.status} for transactions. Response: ${errorText.substring(0, 100)}...`);
            }
            const transactionsData = await transactionsResponse.json();
            setTransactions(transactionsData);
            console.log('App.js: Fetched and set transactions:', transactionsData); // Log transactions after setting

        } catch (err) {
            console.error('Failed to fetch initial data:', err);
            setError('Failed to load data. Please ensure your local server is running and you are logged in. Details: ' + err.message);
            setAppMessage({ type: 'error', text: 'Failed to load data: ' + err.message });
        } finally {
            setLoading(false);
        }
    }, [currentUser, setProducts, setFloors, setTables, setPendingOrders, setTransactions, setAppMessage]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Effect to manage view state on user login/role change
    useEffect(() => {
        if (!currentUser) {
            setCurrentView('login');
        } else if (currentUser && currentView === 'login') {
            switch (currentUser.role) {
                case 'admin':
                case 'manager':
                case 'cashier':
                case 'waiter':
                    setCurrentView('pos');
                    setPosSubView('floor-selection'); // Reset POS sub-view on login/view change
                    break;
                case 'chef':
                    setCurrentView('kitchen-display');
                    break;
                default:
                    setCurrentView('pos');
                    setPosSubView('floor-selection'); // Default to floor selection
            }
        } else if (currentView === 'pos') {
            // When already in POS view and currentView is explicitly set to 'pos', ensure we're at floor selection
            // unless a table or walk-in is already selected (e.e.g., loaded from pending order)
            if (!selectedTable && !isWalkInOrder) {
                 setPosSubView('floor-selection');
            } else {
                 setPosSubView('product-selection'); // If something is selected, go to products
            }
        }
    }, [currentUser, currentView, selectedTable, isWalkInOrder]);


    useEffect(() => {
        if (showReceipt) {
            console.log("App.js: Attempting to render ReceiptModal. showReceipt:", showReceipt, "receiptData exists:", !!receiptData);
            if (receiptData && receiptData.items && receiptData.items.length > 0) {
                console.log("   Receipt data has items. First item:", receiptData.items[0]);
            } else if (receiptData) {
                console.log("   Receipt data is set, but no items found or items array is empty.");
            } else {
                console.log("   Receipt data is null or undefined.");
            }
        }
    }, [showReceipt, receiptData]);

    const updateTableStatus = async (tableId, newStatus) => {
        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/tables/${tableId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to update table ${tableId} status.`);
            }
            await fetchInitialData();
            setAppMessage({ type: 'success', text: `Table ${tableId} status updated to ${newStatus}.` });
        } catch (err) {
            console.error('Error updating table status via API:', err);
            setAppMessage({ type: 'error', text: `Error updating table status: ${err.message}` });
        }
    };

    // Modified updateOrderStatus to handle receipt display on completion
    const updateOrderStatus = async (orderId, newStatus, paymentDetails = {}) => {
        try {
            const payload = { status: newStatus };
            let response;
            let result;

            if (newStatus === 'completed') {
                // If completing an order, send payment details and retrieve full transaction data
                response = await fetch(`https://my-pos-backend.onrender.com/api/orders/${orderId}/complete`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...paymentDetails, // amountPaid, discountPercentage, changeDue, paymentType
                        cashierId: currentUser.id, // The user completing the order
                        status: 'completed'
                    }),
                });
                result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || `Failed to complete order ${orderId}.`);
                }

                // Construct receipt data from the response or relevant order details
                // The backend /complete endpoint should ideally return the complete transaction for the receipt
                const completedTransaction = result.transaction; // Assuming backend returns transaction object
                const originalPendingOrder = pendingOrders.find(order => order.id === orderId);

                // Construct a comprehensive receipt data object
                const receiptDataForModal = {
                    transaction_id: completedTransaction?.transaction_id || result.transactionId,
                    order_date: completedTransaction?.order_date || originalPendingOrder?.order_date || new Date().toISOString(),
                    payment_type: paymentDetails.paymentType,
                    final_total: paymentDetails.finalTotal, // Use the finalTotal calculated in the payment form
                    amountPaid: paymentDetails.amountPaid,
                    changeDue: paymentDetails.changeDue,
                    cashier_username: currentUser.username,
                    waiter_username: originalPendingOrder?.waiter_username || 'N/A', // If waiter took original order
                    table_name: originalPendingOrder?.table_name || 'Walk-in',
                    floor_name: originalPendingOrder?.floor_name || 'N/A',
                    items: originalPendingOrder.items || [], // Items come from the original pending order
                };
                setReceiptData(receiptDataForModal);
                setShowReceipt(true);
                setAppMessage({ type: 'success', text: result.message || `Order ${orderId} completed successfully!` });

            } else {
                // For other status updates (e.g., 'cooked', 'ready' from kitchen display)
                response = await fetch(`https://my-pos-backend.onrender.com/api/orders/${orderId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || `Failed to update order ${orderId} status.`);
                }
                setAppMessage({ type: 'success', text: `Order ${orderId} status updated to '${newStatus}'!` });
            }

            fetchInitialData(); // Re-fetch all data to update the lists

        } catch (err) {
            console.error('Error updating order status:', err);
            setAppMessage({ type: 'error', text: `Failed to update order status: ${err.message}` });
        }
    }


    const addToCart = (productToAdd) => {
        // Find the actual product details from the main products state to get stock_quantity
        // Flatten the grouped products into a single array for easier searching
        const allAvailableProducts = Object.values(products).flat();
        const productDetails = allAvailableProducts.find(p => p.id === productToAdd.id);

        if (!productDetails) {
            setAppMessage({ type: 'error', text: `Product "${productToAdd.name}" details not found.` });
            return;
        }

        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.product.id === productDetails.id);
            if (existingItem) {
                if (existingItem.quantity + 1 > productDetails.stock_quantity) {
                    setAppMessage({ type: 'warning', text: `Cannot add more than available stock for ${productDetails.name}. Only ${productDetails.stock_quantity} in stock.` });
                    return prevCart;
                }
                return prevCart.map(item =>
                    item.product.id === productDetails.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                if (productDetails.stock_quantity <= 0) {
                     setAppMessage({ type: 'warning', text: `"${productDetails.name}" is out of stock!` });
                     return prevCart;
                }
                return [...prevCart, { product: productDetails, quantity: 1 }];
            }
        });
        setAppMessage(null); // Clear previous messages
    };

    const updateCartQuantity = (productId, newQuantity) => {
        // Find the actual product details from the main products state to get stock_quantity
        const allAvailableProducts = Object.values(products).flat();
        const productDetails = allAvailableProducts.find(p => p.id === productId);

        if (!productDetails) {
            setAppMessage({ type: 'error', text: `Product details for ID ${productId} not found.` });
            return;
        }

        setCart((prevCart) => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.product.id !== productId);
            } else {
                if (newQuantity > productDetails.stock_quantity) {
                    setAppMessage({ type: 'warning', text: `Cannot add more than available stock for ${productDetails.name}. Only ${productDetails.stock_quantity} in stock.` });
                    return prevCart;
                }
                return prevCart.map(item =>
                    item.product.id === productId
                        ? { ...item, quantity: newQuantity }
                        : item
                ).filter(item => item.quantity > 0);
            }
        });
        setAppMessage(null); // Clear previous messages
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter(item => item.product.id !== productId));
        setAppMessage({ type: 'info', text: `Item removed from cart.` });
    };

    const loadPendingOrderIntoCart = (order) => {
        setCart(order.items);
        // Ensure floor and table IDs are numbers if they need to be strictly matched against integer IDs
        setSelectedFloor(order.floor_id ? String(order.floor_id) : null);
        setSelectedTable(order.table_id ? String(order.table_id) : null);
        setIsWalkInOrder(!order.floor_id && !order.table_id); // Determine if it's a walk-in based on loaded order
        setCurrentProcessingOrderId(order.id);
        setAppMessage({ type: 'info', text: `Loaded order for ${order.floor_name || 'Walk-in'} / ${order.table_name || 'Walk-in'}. Please process payment.` });
        setCurrentView('pos');
        setPosSubView('product-selection'); // Go to product selection after loading order
    };

    const handleOrderOrPayment = async ({ paymentType = 'cash', amountPaid = 0, discountPercentage = 0 }) => {
        if (cart.length === 0) {
            setAppMessage({ type: 'error', text: "Cart is empty. Cannot proceed." });
            return;
        }

        // Validate floor/table selection for non-walk-in orders
        if (!isWalkInOrder && (!selectedFloor || !selectedTable)) {
            setAppMessage({ type: 'error', text: "Please select a Floor and Table before proceeding, or enable 'Walk-in Order'." });
            return;
        }

        const initialTotal = calculateTotal();
        const discountAmount = initialTotal * (parseFloat(discountPercentage) / 100);
        const finalTotal = initialTotal - discountAmount;

        // Ensure amountPaid is a number for cash payments
        const actualAmountPaid = paymentType === 'cash' ? parseFloat(amountPaid) : finalTotal;
        const changeDue = paymentType === 'cash' ? (actualAmountPaid - finalTotal) : 0;

        const currentFloorName = isWalkInOrder ? 'Walk-in' : (floors.find(f => String(f.id) === selectedFloor)?.name || 'N/A');
        const currentTableName = isWalkInOrder ? 'Walk-in' : (tables.find(t => String(t.id) === selectedTable)?.name || 'N/A');

        let orderData = {
            items: cart.map(item => ({
                product: { id: item.product.id, name: item.product.name, price: item.product.price },
                quantity: item.quantity,
                priceAtSale: item.product.price // Ensure this is the price at the time of sale
            })),
            initialTotal: initialTotal,
            discountPercentage: parseFloat(discountPercentage) || 0,
            discountAmount: discountAmount,
            finalTotal: finalTotal,
            orderDate: new Date().toISOString(),
            floorId: isWalkInOrder ? null : (selectedFloor ? parseInt(selectedFloor) : null),
            tableId: isWalkInOrder ? null : (selectedTable ? parseInt(selectedTable) : null),
            floor_name: currentFloorName, // Pass names for receipt display
            table_name: currentTableName, // Pass names for receipt display
            cashierId: currentUser.role === 'cashier' || currentUser.role === 'admin' || currentUser.role === 'manager' ? currentUser.id : null,
            waiterId: currentUser.role === 'waiter' ? currentUser.id : null,
            paymentType: paymentType,
            amountPaid: actualAmountPaid,
            changeDue: changeDue,
            // ALL orders initiated from the POS page will now be 'pending'
            status: 'pending',
        };

        try {
            let response;
            let result;

            if (currentProcessingOrderId) {
                // If an existing pending order is loaded and this function is called,
                // it means we are completing the order.
                console.log("App.js: Completing existing order from POS Checkout. ID:", currentProcessingOrderId);
                 // We will call updateOrderStatus with 'completed' status and payment details
                await updateOrderStatus(currentProcessingOrderId, 'completed', {
                    paymentType: paymentType,
                    amountPaid: actualAmountPaid, // Use actualAmountPaid from Checkout form
                    discountPercentage: discountPercentage,
                    finalTotal: finalTotal, // Use finalTotal from Checkout form
                    changeDue: changeDue
                });
                // After completing an existing order, the receipt will show, and then the UI will reset.
                setCart([]);
                setCurrentProcessingOrderId(null);
                setSelectedFloor(null);
                setSelectedTable(null);
                setIsWalkInOrder(false);
                setPosSubView('floor-selection');
                await fetchInitialData(); // Re-fetch data to update pending orders list
            } else {
                // Creating a brand new order as 'pending'
                console.log("App.js: Creating a brand new PENDING order from POS.");
                response = await fetch('https://my-pos-backend.onrender.com/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData),
                });
                result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || 'Order submission failed');
                }
                setAppMessage({ type: 'success', text: result.message || 'Order submitted as pending!' });

                // Show confirmation modal instead of immediately resetting POS
                setConfirmedOrderData({
                    items: cart, // Pass the current cart for display in the popup
                    floor_name: currentFloorName,
                    table_name: currentTableName,
                    orderId: result.orderId // Pass the new order ID for context
                });
                setShowOrderConfirmationModal(true);

                // The actual reset of the POS UI (clearing cart, setting subview)
                // will happen when the user clicks "Confirm Order" in the modal.
            }

        } catch (err) {
            console.error('Error processing order/payment:', err);
            setAppMessage({ type: 'error', text: `Operation failed: ${err.message}. Please try again.` });
        }
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    };

    // Filter tables based on selected floor, memoized for performance
    const filteredTables = useMemo(() => {
        if (!selectedFloor || tables.length === 0 || floors.length === 0) {
            return [];
        }
        const selectedFloorId = parseInt(selectedFloor);
        return tables.filter(table => table.floor_id === selectedFloorId);
    }, [selectedFloor, tables, floors]);


    // Filter and search products for the main POS ProductList display
    const getFilteredProducts = useMemo(() => {
        let currentProducts = [];
        // Ensure products object is not empty and has values before attempting to iterate
        if (products && Object.values(products).length > 0) {
            if (selectedCategory === 'All') {
                Object.values(products).forEach(categoryProducts => {
                    currentProducts = currentProducts.concat(categoryProducts);
                });
            } else if (products[selectedCategory]) {
                currentProducts = products[selectedCategory];
            }
        }

        if (searchTerm) {
            return currentProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return currentProducts;
    }, [products, selectedCategory, searchTerm]);


    // Determine all product categories
    const allCategories = useMemo(() => {
        // Ensure products object is not empty before getting keys
        return ['All', ...(products ? Object.keys(products) : [])];
    }, [products]);

    // Determine current table name for "Current Order" display
    const currentOrderTableName = useMemo(() => {
        if (selectedTable) {
            const table = tables.find(t => String(t.id) === selectedTable);
            return table ? table.name : 'N/A';
        }
        return isWalkInOrder ? 'Walk-in' : 'No Table Selected';
    }, [selectedTable, tables, isWalkInOrder]);


    if (!currentUser) {
        return <Login />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 to-purple-800 text-white">
                <div className="text-2xl font-semibold animate-pulse">Loading POS System...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-800 text-white">
                <div className="text-2xl font-semibold">{error}</div>
            </div>
        );
    }

    // Function to handle confirmation after a new order is taken (from the confirmation modal)
    const handleOrderConfirmed = async () => {
        setCart([]); // Clear the cart
        setCurrentProcessingOrderId(null); // Clear any processing order ID
        setSelectedFloor(null); // Reset floor selection
        setSelectedTable(null); // Reset table selection
        setIsWalkInOrder(false); // Reset walk-in status
        setPosSubView('floor-selection'); // Go back to floor selection
        await fetchInitialData(); // Re-fetch all data to ensure lists are updated
        setShowOrderConfirmationModal(false); // Close the modal
        setConfirmedOrderData(null); // Clear confirmed order data
        setAppMessage({ type: 'success', text: 'Order confirmed and POS is ready for next order.' }); // Final success message
    };


    return (
        <ProductContext.Provider value={{
            products: products, // NOW Providing the raw, grouped products object
            cart, addToCart, updateCartQuantity, removeFromCart,
            calculateTotal, handleOrderOrPayment, loadPendingOrderIntoCart,
            selectedFloor, setSelectedFloor, selectedTable, setSelectedTable,
            isWalkInOrder, setIsWalkInOrder,
            floors, setFloors,
            tables, setTables, updateTableStatus, // Pass updateTableStatus
            transactions, setTransactions,
            pendingOrders, setPendingOrders, // Provide pendingOrders and its setter
            fetchInitialData, // Provide function to re-fetch all data
            currentUser, // Pass currentUser to context
            updateOrderStatus, // Pass updateOrderStatus function to context
            loading, // Pass loading state to context
            setAppMessage, // Provide the global message setter to context
            // searchTerm, setSearchTerm, // No longer pass these for general 'products' in context
            // selectedCategory, setSelectedCategory, // No longer pass these for general 'products' in context
            // allCategories // No longer pass this for general 'products' in context
        }}>
            <div className="min-h-screen bg-gray-100 font-inter antialiased flex flex-col">
                {/* Unified Header/Navigation Bar */}
                <nav className="bg-white p-4 shadow-sm rounded-b-xl z-20 print:hidden sticky top-0">
                    {/* Top Row: Dashboard, Search, User/Notification */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                            {/* Menu Icon - Now opens the Management Menu */}
                            {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                                <button
                                    onClick={() => setShowManagementMenu(!showManagementMenu)}
                                    className="p-2 mr-3 rounded-full hover:bg-gray-200 transition-colors"
                                    aria-label="Toggle Management Menu"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-gray-700">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                                    </svg>
                                </button>
                            )}
                            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        </div>

                        {/* Search Bar (Conditionally rendered) */}
                        {(posSubView === 'product-selection') && (
                            <div className="relative flex-grow mx-4 max-w-lg">
                                <input
                                    type="text"
                                    id="product-search-input" // Added unique ID
                                    placeholder="Search menu items..."
                                    className="w-full sm:w-64 py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-800 placeholder-gray-500 shadow-sm"
                                    value={searchTerm} // Use local searchTerm state
                                    onChange={(e) => setSearchTerm(e.target.value)} // Use local setSearchTerm
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* User Profile / Notifications */}
                        <div className="flex items-center space-x-4">
                            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors relative">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-gray-700">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.04 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                </svg>
                                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500"></span>
                            </button>
                            <div className="relative" ref={userDropdownRef}> {/* Attach ref here */}
                                <button
                                    onClick={() => setShowUserDropdown(!showUserDropdown)} // Toggle dropdown visibility
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500 text-white font-semibold text-lg hover:bg-indigo-600 transition-colors shadow-md"
                                >
                                    {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'JD'} {/* Initials */}
                                </button>

                                {showUserDropdown && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fade-in-down">
                                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                                            <div className="block px-4 py-2 text-sm text-gray-700">
                                                <p className="font-semibold truncate">{currentUser.username || 'User Name'}</p>
                                                <p className="text-gray-500 truncate">{currentUser.email || 'user@example.com'}</p>
                                                <p className="text-xs text-gray-400 mt-1">Role: {currentUser.role}</p>
                                            </div>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setShowUserDropdown(false); // Close dropdown after logout
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-700 transition-colors"
                                                role="menuitem"
                                            >
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2 text-red-500">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H9" />
                                                    </svg>
                                                    Logout
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Secondary Navigation Buttons */}
                    <ul className="flex flex-wrap justify-center space-x-2 sm:space-x-4 text-sm sm:text-base font-semibold border-t border-gray-200 pt-3">
                        {/* POS Button */}
                        {(currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'cashier' || currentUser.role === 'waiter') && (
                            <li>
                                <button
                                    onClick={() => {
                                        setCurrentView('pos');
                                        setSelectedFloor(null); // Clear selection when returning to POS overview
                                        setSelectedTable(null);
                                        setIsWalkInOrder(false);
                                        setPosSubView('floor-selection'); // Always reset to floor selection when navigating to POS
                                        setShowManagementMenu(false); // Close management menu
                                    }}
                                    className={`py-2 px-4 rounded-lg transition-colors duration-200 ease-in-out transform hover:scale-105 flex items-center ${currentView === 'pos' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.268 12.04A2.25 2.25 0 0118.75 22.5H5.25a2.25 2.25 0 01-2.244-2.003L1.994 8.507A2.25 2.25 0 014.25 6.25h15.5c1.24 0 2.25.915 2.25 2.003z" /></svg>
                                    POS
                                </button>
                            </li>
                        )}
                        {/* Orders Button */}
                        {(currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'cashier' || currentUser.role === 'waiter') && (
                            <li>
                                <button
                                    onClick={() => {
                                        setCurrentView('orders');
                                        setShowManagementMenu(false); // Close management menu
                                    }}
                                    className={`py-2 px-4 rounded-lg transition-colors duration-200 ease-in-out transform hover:scale-105 flex items-center ${currentView === 'orders' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.234 1.172v.334c-.14.237-.298.468-.47.689m-4.594-4.242a2.25 2.25 0 00-2.25 2.25V14.25m6.06-9.106V4.5a2.25 2.25 0 00-2.25-2.25H9M16.5 9.75M18 14.25v4.5m-6.75-4.5h.008v.008h-.008v-.008zm11.25 0h.008v.008h-.008v-.008zm-5.625-10.875a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
                                    Orders
                                </button>
                            </li>
                        )}
                        {/* Transaction History Button (Renamed from History) */}
                        {(currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'cashier') && (
                            <li>
                                <button
                                    onClick={() => {
                                        setCurrentView('transaction-history');
                                        setShowManagementMenu(false); // Close management menu
                                    }}
                                    className={`py-2 px-4 rounded-lg transition-colors duration-200 ease-in-out transform hover:scale-105 flex items-center ${currentView === 'transaction-history' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.079 0-2.157.17-3.206.518M18.414 6.426C21.661 10.14 22.5 8.57 22.5 6.75a4.5 4.5 0 00-4.5-4.5h-1.319c-.791 0-1.569.079-2.331.227A6.786 6.786 0 0112 1.974c-1.005 0-1.992.115-2.934.336C8.241 2.502 7.463 2.581 6.75 2.581H5.25a4.5 4.5 0 00-4.5 4.5c0 1.725.839 3.294 2.194 4.296m18.414 6.426a2.25 2.25 0 01-2.244 2.003H3.75a2.25 2.25 0 01-2.244-2.003m18.414 6.426c.347.347.65.65.953.953-.303.303-.606.606-.953.953m-18.414-6.426a2.25 2.25 0 00-2.244-2.003H3.75a2.25 2.25 0 00-2.244-2.003m18.414 6.426c.347.347.65.65.953.953-.303.303-.606.606-.953.953" /></svg>
                                    Transactions
                                </button>
                            </li>
                        )}
                        {/* Kitchen Display Button */}
                        {currentUser.role === 'chef' && (
                            <li>
                                <button
                                    onClick={() => {
                                        setCurrentView('kitchen-display');
                                        setShowManagementMenu(false); // Close management menu
                                    }}
                                    className={`py-2 px-4 rounded-lg transition-colors duration-200 ease-in-out transform hover:scale-105 flex items-center ${currentView === 'kitchen-display' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M10.5 5.25L9 6.75M12 3L10.5 5.25M12 3v18M12 3L13.5 5.25M12 21L13.5 18.75M12 21L10.5 18.75M12 21V3" /></svg>
                                    Kitchen
                                </button>
                            </li>
                        )}
                    </ul>
                </nav>

                {/* Management Menu Sidebar/Modal (Conditionally rendered) */}
                {(currentUser.role === 'admin' || currentUser.role === 'manager') && showManagementMenu && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-start animate-fade-in print:hidden"> {/* Changed justify-end to justify-start */}
                        <div className={`bg-white w-64 p-6 shadow-xl overflow-y-auto transform transition-transform duration-300 ease-in-out ${showManagementMenu ? 'translate-x-0' : '-translate-x-full'} sm:w-80`}> {/* Added conditional translate-x class */}
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h3 className="text-xl font-semibold text-gray-800">Management</h3>
                                <button
                                    onClick={() => setShowManagementMenu(false)}
                                    className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
                                    aria-label="Close Management Menu"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <ul className="space-y-3">
                                <li>
                                    <button
                                        onClick={() => { setCurrentView('menu-management'); setShowManagementMenu(false); }}
                                        className={`w-full text-left py-3 px-4 rounded-lg flex items-center text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${currentView === 'menu-management' ? 'bg-indigo-100 text-indigo-800' : ''}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                                        Menu Management
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => { setCurrentView('table-management'); setShowManagementMenu(false); }}
                                        className={`w-full text-left py-3 px-4 rounded-lg flex items-center text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${currentView === 'table-management' ? 'bg-indigo-100 text-indigo-800' : ''}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" /></svg>
                                        Table Management
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => { setCurrentView('user-management'); setShowManagementMenu(false); }}
                                        className={`w-full text-left py-3 px-4 rounded-lg flex items-center text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${currentView === 'user-management' ? 'bg-indigo-100 text-indigo-800' : ''}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a8.967 8.967 0 0015.002 0m-12.932-2.352v-.223m2.25-.996v-.75M2.25 10.5v-2.25m.337-2.617c1.455-1.455 3.39-2.352 5.485-2.352h1.12a2.351 2.351 0 012.351 2.351v1.12a3.75 3.75 0 003.75 3.75h1.12a2.351 2.351 0 012.351 2.351v1.12a3.75 3.75 0 003.75 3.75h1.12c.087.416.024.838-.064 1.249m-1.249 3.344c-.416.087-.838.024-1.249-.064M9.75 20.118v-.223m2.25-.996v-.75M18.75 10.5v-2.25m.337-2.617c-1.455-1.455-3.39-2.352-5.485-2.352h-1.12a2.351 2.351 0 01-2.351-2.351v-1.12a3.75 3.75 0 00-3.75-3.75h-1.12a2.351 2.351 0 01-2.351-2.351v-1.12A3.75 3.75 0 006 4.5v.75m3.75 14.868v-.223m2.25-.996v-.75" /></svg>
                                        User Management
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => { setCurrentView('sales-analysis'); setShowManagementMenu(false); }}
                                        className={`w-full text-left py-3 px-4 rounded-lg flex items-center text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${currentView === 'sales-analysis' ? 'bg-indigo-100 text-indigo-800' : ''}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l9-9 9 9m-12 0l4 4m0 0l4-4" /></svg>
                                        Sales Analysis
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Main Content Area - Split into two columns.
                    Uses CSS Grid for responsive column layout: 1 column on small screens, 3 columns on large screens. */}
                <main className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Floor Plan, Categories, Product List */}
                    {currentView === 'pos' && (
                        <div className="lg:col-span-2 flex flex-col space-y-6">
                            {/* Conditional Rendering based on posSubView */}

                            {/* Floor Selection View */}
                            {posSubView === 'floor-selection' && (
                                <section className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100 animate-fade-in">
                                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Select a Floor</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {floors.map(floor => (
                                            <button
                                                key={floor.id}
                                                onClick={() => {
                                                    setSelectedFloor(String(floor.id));
                                                    setPosSubView('table-selection'); // Move to table selection
                                                    setSelectedTable(null); // Clear previous table selection
                                                    setIsWalkInOrder(false); // Ensure walk-in is false
                                                }}
                                                className="relative p-4 rounded-xl shadow-md text-center bg-indigo-100 border-indigo-400 text-indigo-800 border-2 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ease-in-out transform hover:scale-105"
                                            >
                                                <h3 className="font-semibold text-lg">{floor.name}</h3>
                                                <p className="text-sm">{tables.filter(t => t.floor_id === floor.id).length} tables</p>
                                            </button>
                                        ))}
                                        {/* Walk-in Order button directly in floor selection */}
                                        <button
                                            onClick={() => {
                                                setIsWalkInOrder(true);
                                                setSelectedFloor(null);
                                                setSelectedTable(null);
                                                setPosSubView('product-selection'); // Go straight to products
                                            }}
                                            className={`relative p-4 rounded-xl shadow-md text-center transition-all duration-200 ease-in-out transform hover:scale-105
                                                ${isWalkInOrder ? 'ring-4 ring-indigo-500 ring-offset-2 bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-100 border-gray-400 text-gray-800'}
                                                border-2 flex flex-col items-center justify-center space-y-1
                                            `}
                                        >
                                            <h3 className="font-semibold text-lg">Walk-in Order</h3>
                                            <p className="text-sm">No Table Required</p>
                                            <span className={`w-3 h-3 rounded-full ${isWalkInOrder ? 'bg-blue-500' : 'bg-gray-500'} absolute top-2 right-2`}></span>
                                        </button>
                                    </div>
                                </section>
                            )}

                            {/* Table Selection View */}
                            {posSubView === 'table-selection' && (
                                <section className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100 animate-fade-in">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-gray-800">Tables on {floors.find(f => String(f.id) === selectedFloor)?.name || 'Selected Floor'}</h2>
                                        <button
                                            onClick={() => {
                                                setPosSubView('floor-selection'); // Go back to floor selection
                                                setSelectedFloor(null);
                                                setSelectedTable(null);
                                                setCart([]); // Clear cart when going back
                                                setCurrentProcessingOrderId(null); // Clear any loaded order
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                                            Back to Floors
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {filteredTables.length > 0 ? (
                                            filteredTables.map(table => (
                                                <button
                                                    key={table.id}
                                                    onClick={() => {
                                                        setSelectedTable(String(table.id));
                                                        setIsWalkInOrder(false); // Ensure walk-in is false
                                                        setPosSubView('product-selection'); // Move to product selection
                                                    }}
                                                    className={`relative p-4 rounded-xl shadow-md text-center transition-all duration-200 ease-in-out transform hover:scale-105
                                                        ${String(table.id) === selectedTable ? 'ring-4 ring-indigo-500 ring-offset-2' : ''}
                                                        ${table.status === 'occupied' ? 'bg-orange-100 border-orange-400 text-orange-800' : 'bg-green-100 border-green-400 text-green-800'}
                                                        border-2 flex flex-col items-center justify-center space-y-1
                                                    `}
                                                >
                                                    <h3 className="font-semibold text-lg">{table.name}</h3>
                                                    <p className="text-sm">Seats: N/A</p> {/* Placeholder, add actual seats if table schema has it */}
                                                    {table.status === 'occupied' && <p className="text-xs italic">Occupied</p>}
                                                    <span className={`w-3 h-3 rounded-full ${table.status === 'occupied' ? 'bg-red-500' : 'bg-green-500'} absolute top-2 right-2`}></span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="lg:col-span-4 text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                                                <p className="text-lg font-semibold">No tables found on this floor.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Product Selection View */}
                            {posSubView === 'product-selection' && (
                                <>
                                    {/* Back to Tables/Floors Button */}
                                    <div className="flex justify-end mb-4">
                                        <button
                                            onClick={() => {
                                                if (isWalkInOrder) {
                                                    setPosSubView('floor-selection'); // Back to floor selection for walk-in reset
                                                    setIsWalkInOrder(false);
                                                } else {
                                                    setPosSubView('table-selection'); // Back to tables on selected floor
                                                    setSelectedTable(null); // Clear selected table
                                                }
                                                setCart([]); // Clear cart when going back
                                                setCurrentProcessingOrderId(null); // Clear any loaded order
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                                            Back to {isWalkInOrder ? 'Floor/Walk-in Selection' : 'Table Selection'}
                                        </button>
                                    </div>

                                    {/* Product Categories */}
                                    <section className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100 animate-fade-in">
                                        <h2 className="sr-only">Product Categories</h2>
                                        <div className="flex flex-wrap gap-3 justify-center">
                                            {allCategories.map(category => (
                                                <button
                                                    key={category}
                                                    onClick={() => setSelectedCategory(category)} // Use local setSelectedCategory
                                                    className={`py-2 px-5 rounded-full text-lg font-medium transition-all duration-200 ease-in-out
                                                        ${selectedCategory === category ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                                                    `}
                                                >
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Product List Section */}
                                    <section className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100 animate-fade-in flex-grow">
                                        <h2 className="sr-only">Menu Items</h2>
                                        {/* Pass getFilteredProducts as a prop to ProductList */}
                                        <ProductList products={getFilteredProducts} />
                                    </section>
                                </>
                            )}

                            {/* Initial Prompt when no floors/tables are configured yet */}
                            {posSubView === 'floor-selection' && floors.length === 0 && (
                                <section className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100 flex flex-col items-center justify-center min-h-[300px] text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-16 h-16 text-indigo-400 mb-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5 1.5H9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xl font-semibold text-center">No floors configured!</p>
                                    <p className="text-md mt-2 text-center">Please add floors and tables in Table Management.</p>
                                </section>
                            )}
                        </div>
                    )}


                    {/* Right Column: Cart and Checkout */}
                    {currentView === 'pos' && (
                        <div className="lg:col-span-1 bg-white rounded-xl shadow-2xl p-6 border border-gray-100 flex flex-col animate-fade-in-left">
                             <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-3">
                                Current Order {currentOrderTableName && `(${currentOrderTableName})`}
                            </h2>
                            <Cart />
                            <Checkout />
                        </div>
                    )}

                    {/* Management Views (conditional rendering based on currentView) */}
                    {currentView === 'orders' && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'cashier' || currentUser.role === 'waiter') && (
                        <div className="lg:col-span-3 overflow-x-auto">
                            <PendingOrdersList />
                        </div>
                    )}
                    {currentView === 'menu-management' && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
                        <div className="lg:col-span-3">
                            <MenuManagement />
                        </div>
                    )}
                    {currentView === 'table-management' && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
                        <div className="lg:col-span-3">
                            <TableManagement />
                        </div>
                    )}
                    {currentView === 'user-management' && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
                        <div className="lg:col-span-3">
                            <UserManagement />
                        </div>
                    )}
                    {currentView === 'transaction-history' && (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'cashier') && (
                        <div className="lg:col-span-3">
                            <TransactionHistory />
                        </div>
                    )}
                    {currentView === 'sales-analysis' && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
                        <div className="lg:col-span-3">
                            <SalesAnalysis />
                        </div>
                    )}
                    {/* Kitchen Display View */}
                    {currentView === 'kitchen-display' && currentUser.role === 'chef' && (
                        <div className="lg:col-span-3">
                            <KitchenDisplay />
                        </div>
                    )}
                </main>

                {/* Footer Section */}
                <footer className="mt-auto p-4 bg-gray-900 text-white text-center text-sm rounded-t-xl shadow-inner print:hidden">
                    &copy; {new Date().getFullYear()} Premium POS Solution. All rights reserved.
                </footer>
            </div>
            {/* Receipt Modal */}
            {showReceipt && receiptData && (
                <>
                    {console.log("App.js: Attempting to render ReceiptModal. showReceipt:", showReceipt, "receiptData exists:", !!receiptData)}
                    <ReceiptModal
                        receiptData={receiptData}
                        onClose={() => {
                            setShowReceipt(false);
                            setReceiptData(null);
                        }}
                    />
                </>
            )}

            {/* Order Confirmation Modal - NEW */}
            {showOrderConfirmationModal && confirmedOrderData && (
                <OrderConfirmationModal
                    isOpen={showOrderConfirmationModal}
                    onClose={() => {
                        setShowOrderConfirmationModal(false);
                        setConfirmedOrderData(null);
                        // If user cancels this modal, they might want to continue with the current order
                        // so we don't clear the cart or reset POS view here.
                        setAppMessage({ type: 'info', text: 'Order confirmation cancelled. Cart retained.' });
                    }}
                    orderData={confirmedOrderData}
                    onConfirm={handleOrderConfirmed}
                />
            )}

            {/* Global Message Display */}
            {appMessage && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white font-semibold z-50 animate-fade-in-up ${
                    appMessage.type === 'success' ? 'bg-green-600' :
                    appMessage.type === 'error' ? 'bg-red-600' :
                    appMessage.type === 'info' ? 'bg-blue-600' :
                    appMessage.type === 'warning' ? 'bg-orange-600' :
                    'bg-gray-600'
                }`}>
                    <div className="flex items-center">
                        {appMessage.type === 'success' && <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        {appMessage.type === 'error' && <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2A9 9 0 111 12a9 9 0 0118 0z"></path></svg>}
                        {appMessage.type === 'info' && <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        {appMessage.type === 'warning' && <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                        <span>{appMessage.text}</span>
                    </div>
                    <button
                        onClick={() => setAppMessage(null)}
                        className="ml-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            )}
        </ProductContext.Provider>
    );
}

export default AppWrapper;
