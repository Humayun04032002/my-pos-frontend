// src/components/Checkout.js
import React, { useContext, useState } from 'react';
import { ProductContext } from '../contexts/ProductContext';
import { AuthContext } from '../contexts/AuthContext';

// Checkout Component: Handles payment details, discount, and triggers order/payment process with enhanced UI/UX.
function Checkout() {
    const { cart, calculateTotal, handleOrderOrPayment, selectedFloor, selectedTable, isWalkInOrder, setAppMessage } = useContext(ProductContext); // NEW: setAppMessage
    const { currentUser } = useContext(AuthContext);

    const [paymentType, setPaymentType] = useState('cash'); // 'cash' or 'card'
    const [amountPaid, setAmountPaid] = useState(''); // Amount customer pays
    const [discountPercentage, setDiscountPercentage] = useState(0); // Discount in percentage

    const initialTotal = calculateTotal(); // Total before discount
    const discountAmount = initialTotal * (discountPercentage / 100);
    const finalTotal = initialTotal - discountAmount; // Final total after discount
    const changeDue = paymentType === 'cash' ? (parseFloat(amountPaid) - finalTotal) : 0; // Change to be given back

    // Determine if the checkout button should be disabled
    const isButtonDisabled = cart.length === 0 || finalTotal <= 0 ||
                             (!isWalkInOrder && (!selectedFloor || !selectedTable)) || // NEW: Conditionally require floor/table
                             (paymentType === 'cash' && parseFloat(amountPaid) < finalTotal && currentUser.role !== 'waiter');

    // Handles the click for both "Take Order" (Waiter) and "Process Payment" (Cashier/Manager/Admin)
    const handleProcessClick = () => {
        console.log("Checkout.js: 'Process Payment' button clicked.");
        console.log("Checkout.js: Current cart:", cart);
        console.log("Checkout.js: isWalkInOrder:", isWalkInOrder);
        console.log("Checkout.js: selectedFloor:", selectedFloor);
        console.log("Checkout.js: selectedTable:", selectedTable);
        console.log("Checkout.js: isButtonDisabled (before calling handleOrderOrPayment):", isButtonDisabled);

        if (isButtonDisabled) {
            console.warn("Checkout.js: Button is disabled, handleOrderOrPayment will not be called.");
            // Display an informative message using the global message system
            if (cart.length === 0) {
                setAppMessage({ type: 'warning', text: "Cart is empty. Cannot proceed." });
            } else if (!isWalkInOrder && (!selectedFloor || !selectedTable)) {
                setAppMessage({ type: 'warning', text: "Please select a Floor and Table, or enable 'Walk-in Order'." });
            } else if (paymentType === 'cash' && parseFloat(amountPaid) < finalTotal && currentUser.role !== 'waiter') {
                 setAppMessage({ type: 'warning', text: "Amount paid is less than final total for cash payment." });
            }
            return; // Prevent further execution if disabled
        }

        handleOrderOrPayment({
            paymentType,
            amountPaid: parseFloat(amountPaid) || 0,
            discountPercentage: parseFloat(discountPercentage) || 0
        });
        // Reset local payment states after processing
        setAmountPaid('');
        setDiscountPercentage(0);
        setPaymentType('cash');
        // Messages handled by handleOrderOrPayment (which now uses setAppMessage)
    };

    // Waiters cannot see or interact with payment/discount sections
    if (currentUser.role === 'waiter') {
        return (
            <button
                onClick={handleProcessClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                disabled={cart.length === 0 || (!isWalkInOrder && (!selectedFloor || !selectedTable))} // Waiters always need floor/table unless walk-in
            >
                Take Order
            </button>
        );
    }

    // UI for Cashier, Manager, Admin
    return (
        <div className="mt-6 pt-6 border-t-2 border-gray-200">
            {/* Discount Section */}
            <div className="mb-6 p-4 bg-gray-500 rounded-lg border border-gray-200 shadow-sm">
                <label htmlFor="discount" className="block text-sm font-bold text-white mb-2">Discount (%)</label>
                <input
                    type="number"
                    id="discount"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={discountPercentage}
                    onChange={(e) => {
                        const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)); // Limit 0-100%
                        setDiscountPercentage(val);
                    }}
                    min="0"
                    max="100"
                    placeholder="Enter discount percentage"
                />
            </div>

            {/* Price Breakdown */}
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 shadow-md mb-6 space-y-3">
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                    <span>Subtotal:</span>
                    <span>${initialTotal.toFixed(2)}</span>
                </div>
                {discountPercentage > 0 && (
                    <div className="flex justify-between items-center text-lg text-red-600 font-semibold border-t border-red-200 pt-2">
                        <span>Discount ({discountPercentage}%):</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center text-3xl font-extrabold text-indigo-700 border-t-2 border-indigo-300 pt-3">
                    <span>Final Total:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                </div>
            </div>

            {/* Payment Type Selection */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Payment Type:</label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                    <label className="inline-flex items-center text-lg font-medium text-gray-800">
                        <input
                            type="radio"
                            name="paymentType"
                            value="cash"
                            checked={paymentType === 'cash'}
                            onChange={() => setPaymentType('cash')}
                            className="form-radio h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="ml-2">Cash</span>
                    </label>
                    <label className="inline-flex items-center text-lg font-medium text-gray-800">
                        <input
                            type="radio"
                            name="paymentType"
                            value="card"
                            checked={paymentType === 'card'}
                            onChange={() => setPaymentType('card')}
                            className="form-radio h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="ml-2">Card</span>
                    </label>
                </div>
            </div>

            {/* Cash Payment Details (Amount Paid & Change Due) */}
            {paymentType === 'cash' && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
                    <label htmlFor="amount-paid" className="block text-sm font-bold text-gray-700 mb-2">Amount Paid</label>
                    <input
                        type="number"
                        id="amount-paid"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-base focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        step="0.01"
                        placeholder="Enter amount paid"
                    />
                    {amountPaid !== '' && (
                        <p className="text-md text-gray-700 mt-3">
                            Change Due: <span className="font-extrabold text-green-700">${Math.max(0, changeDue).toFixed(2)}</span>
                        </p>
                    )}
                </div>
            )}

            {/* Process Payment Button */}
            <button
                onClick={handleProcessClick}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-800 hover:from-green-700 hover:to-emerald-900 text-white font-extrabold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={isButtonDisabled}
            >
                Take oder
            </button>
        </div>
    );
}

export default Checkout;
