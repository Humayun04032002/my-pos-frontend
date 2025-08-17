// src/components/ProductList.js
import React, { useContext } from 'react';
import { ProductContext } from '../contexts/ProductContext';

// ProductList Component: Displays a list of products with Add to Cart functionality.
// It now receives filtered products as a prop.
function ProductList({ products }) { // Receive products as a prop
    // We only need 'addToCart' here from context.
    // 'searchTerm', 'selectedCategory', and 'allCategories' are managed in App.js and passed as props or are not needed here.
    const { addToCart } = useContext(ProductContext);

    // products prop is already the array to display. No need for Object.values or flat().
    const productsToDisplay = Array.isArray(products) ? products : [];


    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-fr">
            {productsToDisplay.length === 0 ? (
                <div className="lg:col-span-4 text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
                    <p className="text-lg font-semibold">No products found for your current selection.</p>
                    <p className="text-sm mt-1">Try adjusting filters or search terms.</p>
                </div>
            ) : (
                productsToDisplay.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out border border-gray-100 flex flex-col justify-between overflow-hidden group"
                    >
                        {/* Product Image Placeholder */}
                        <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-sm overflow-hidden relative">
                            {/* Low Stock Indicator */}
                            {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                                <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md z-10">
                                    Low Stock!
                                </span>
                            )}
                             {product.stock_quantity === 0 && (
                                <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md z-10">
                                    Out of Stock
                                </span>
                            )}
                            {/* Placeholder image (replace with actual image later) */}
                            <img
                                src={`https://placehold.co/150x150/E0E7FF/4338CA?text=${encodeURIComponent(product.name.split(' ')[0])}`}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                        </div>
                        {/* Product Details */}
                        <div className="p-4 flex-grow">
                            <h3 className="font-bold text-xl text-gray-900 leading-tight mb-1">{product.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                            <p className="font-extrabold text-2xl text-indigo-700">${product.price.toFixed(2)}</p>
                        </div>
                        {/* Add to Cart Button */}
                        <div className="p-4 pt-0">
                            <button
                                onClick={() => addToCart(product)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                disabled={product.stock_quantity === 0} // Disable if out of stock
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553L16.5 4H5.4M7 20a1 1 0 11-2 0 1 1 0 012 0zm9 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default ProductList;
