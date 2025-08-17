// src/components/Cart.js
import React, { useContext } from 'react';
import { ProductContext } from '../contexts/ProductContext';
import { AuthContext } from '../contexts/AuthContext';

// Cart Component: Displays items currently in the shopping cart and allows quantity adjustments with enhanced UI/UX.
function Cart() {
    const { cart, updateCartQuantity, removeFromCart, selectedFloor, selectedTable, floors, tables, isWalkInOrder } = useContext(ProductContext);
    const { currentUser } = useContext(AuthContext);

    // Find the selected floor and table names for display
    const currentFloor = selectedFloor ? floors.find(f => String(f.id) === selectedFloor) : null;
    const currentTable = selectedTable ? tables.find(t => String(t.id) === selectedTable) : null;

    return (
        <div className="flex-grow min-h-[200px] overflow-y-auto pr-2 pb-4">
            {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-8 px-4 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <p className="font-semibold text-lg">Your cart is empty!</p>
                    <p className="text-sm mt-1">Add products from the menu to get started.</p>
                </div>
            ) : (
                <>
                    {/* Display selected Floor and Table if not a walk-in order */}
                    {!isWalkInOrder && currentFloor && currentTable && (currentUser.role === 'cashier' || currentUser.role === 'waiter' || currentUser.role === 'manager' || currentUser.role === 'admin') && (
                        <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg shadow-sm text-center">
                            <p className="text-md font-semibold text-blue-800">
                                Order for: <span className="font-extrabold">{currentFloor.name} / {currentTable.name}</span>
                            </p>
                        </div>
                    )}
                     {/* Display "Walk-in Order" if it is a walk-in order */}
                     {isWalkInOrder && (currentUser.role === 'cashier' || currentUser.role === 'manager' || currentUser.role === 'admin') && (
                        <div className="mb-4 p-3 bg-indigo-100 border border-indigo-200 rounded-lg shadow-sm text-center">
                            <p className="text-md font-semibold text-indigo-800">
                                This is a <span className="font-extrabold">Walk-in Order</span>
                            </p>
                        </div>
                    )}

                    <ul className="space-y-3">
                        {cart.map((item) => (
                            <li key={item.product.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-md border border-gray-100 animate-fade-in-up">
                                <div className="flex-grow mr-4">
                                    <p className="font-bold text-lg text-gray-900 leading-tight">{item.product.name}</p>
                                    <p className="text-sm text-gray-600">Unit Price: ${item.product.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {/* Decrease Quantity Button */}
                                    <button
                                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                        className="bg-red-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-xl hover:bg-red-600 transition-colors duration-200 shadow-sm"
                                        aria-label="Decrease quantity"
                                    >
                                        -
                                    </button>
                                    <span className="font-extrabold text-xl text-gray-800 w-8 text-center">{item.quantity}</span>
                                    {/* Increase Quantity Button */}
                                    <button
                                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                        className="bg-green-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-xl hover:bg-green-600 transition-colors duration-200 shadow-sm"
                                        aria-label="Increase quantity"
                                        disabled={item.quantity >= item.product.stock_quantity} // Disable if max stock reached
                                    >
                                        +
                                    </button>
                                    {/* Remove Item Button (Only for Cashiers, Managers, and Admins) */}
                                    {(currentUser.role === 'cashier' || currentUser.role === 'manager' || currentUser.role === 'admin') && (
                                        <button
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="text-gray-500 hover:text-red-600 transition-colors ml-3"
                                            aria-label="Remove item"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 01-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

export default Cart;
