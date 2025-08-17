// src/management/MenuManagement.js
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { ProductContext } from '../contexts/ProductContext';
import { PlusCircle, Search, Edit, Trash2, XCircle, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react'; // Import icons

// MenuManagement Component: Allows Admin/Manager to add, edit, or remove menu items.
function MenuManagement() {
    // Get raw products (grouped by category), setProducts, fetchInitialData, and setAppMessage from context
    const { products, setProducts, fetchInitialData, setAppMessage } = useContext(ProductContext);

    const [newItem, setNewItem] = useState({ name: '', price: '', stock_quantity: '', category: '', description: '', imageUrl: '', is_available: true });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for controlling edit modal visibility
    const [currentProductToEdit, setCurrentProductToEdit] = useState(null); // State to hold product being edited
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false); // State for delete confirmation modal
    const [productToDelete, setProductToDelete] = useState(null); // State to hold product id/name for deletion

    // New states for UI/UX from PDF
    const [selectedCategoryTab, setSelectedCategoryTab] = useState('All'); // For category tabs
    const [searchQuery, setSearchQuery] = useState(''); // For item search
    const [showAddItemModal, setShowAddItemModal] = useState(false); // To control visibility of "Add New Item" modal
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false); // To control visibility of "Add Category" modal
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDescription, setNewCategoryDescription] = useState('');
    // State to hold categories fetched from backend (actual category objects, not just names)
    const [allCategoriesData, setAllCategoriesData] = useState([]);
    // State to hold category names for tabs/dropdowns (includes 'All')
    const [categories, setCategories] = useState([]);

    // States for category editing/deletion
    const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    const [isConfirmDeleteCategoryModalOpen, setIsConfirmDeleteCategoryModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);


    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('https://my-pos-backend.onrender.com/api/categories');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch categories.');
                }
                const data = await response.json();
                setAllCategoriesData(data); // Store full category objects
                setCategories(['All', ...data.map(cat => cat.name)]); // Set names for display
            } catch (err) {
                console.error('Error fetching categories:', err);
                setAppMessage({ type: 'error', text: `Failed to load categories: ${err.message}` });
            }
        };
        fetchCategories();
    }, [setAppMessage, fetchInitialData]); // Corrected: changed 'fetchAppMessage' to 'setAppMessage'

    // Memoized, filtered, and searched products for display
    const filteredAndSearchedProducts = useMemo(() => {
        // Ensure products is an object before using Object.values
        let allProductsFlat = [];
        if (products && typeof products === 'object' && Object.keys(products).length > 0) {
            allProductsFlat = Object.values(products).flat();
        } else if (Array.isArray(products)) { // Defensive check in case products is already flattened
            allProductsFlat = products;
        }


        let filtered = selectedCategoryTab === 'All'
            ? allProductsFlat
            : allProductsFlat.filter(product => product.category === selectedCategoryTab);

        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        return filtered;
    }, [products, selectedCategoryTab, searchQuery]);


    // Function to add a new menu item
    const handleAddItem = async (e) => {
        e.preventDefault();
        // Basic validation
        if (!newItem.name || !newItem.price || !newItem.stock_quantity || !newItem.category) {
            setAppMessage({ type: 'error', text: 'Please fill in all required fields (Name, Price, Stock, Category).' });
            return;
        }
        if (isNaN(parseFloat(newItem.price)) || parseFloat(newItem.price) < 0) {
            setAppMessage({ type: 'error', text: 'Price must be a valid non-negative number.' });
            return;
        }
        if (isNaN(parseInt(newItem.stock_quantity)) || parseInt(newItem.stock_quantity) < 0) {
            setAppMessage({ type: 'error', text: 'Stock quantity must be a valid non-negative integer.' });
            return;
        }

        try {
            const response = await fetch('https://my-pos-backend.onrender.com/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newItem.name.trim(),
                    price: parseFloat(newItem.price),
                    stock_quantity: parseInt(newItem.stock_quantity),
                    category: newItem.category,
                    description: newItem.description.trim(), // Ensure description is sent
                    imageUrl: newItem.imageUrl || 'https://placehold.co/150x150/E0E7FF/4338CA?text=Product'
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add item.');
            }
            setAppMessage({ type: 'success', text: `Item "${data.product.name}" added successfully!` });
            setShowAddItemModal(false); // Close modal
            setNewItem({ name: '', price: '', stock_quantity: '', category: '', description: '', imageUrl: '', is_available: true }); // Clear form
            fetchInitialData(); // Refresh product list in App.js and consequently here
        } catch (err) {
            console.error('Error adding item:', err);
            setAppMessage({ type: 'error', text: `Failed to add item: ${err.message}` });
        }
    };

    // Function to handle editing an existing item
    const handleEditItem = async (e) => {
        e.preventDefault();
        if (!currentProductToEdit) return;

        // Basic validation
        if (!currentProductToEdit.name || !currentProductToEdit.price || !currentProductToEdit.stock_quantity || !currentProductToEdit.category) {
            setAppMessage({ type: 'error', text: 'Please fill in all required fields (Name, Price, Stock, Category).' });
            return;
        }
        if (isNaN(parseFloat(currentProductToEdit.price)) || parseFloat(currentProductToEdit.price) < 0) {
            setAppMessage({ type: 'error', text: 'Price must be a valid non-negative number.' });
            return;
        }
        if (isNaN(parseInt(currentProductToEdit.stock_quantity)) || parseInt(currentProductToEdit.stock_quantity) < 0) {
            setAppMessage({ type: 'error', text: 'Stock quantity must be a valid non-negative integer.' });
            return;
        }

        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/products/${currentProductToEdit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: currentProductToEdit.name.trim(),
                    price: parseFloat(currentProductToEdit.price),
                    stock_quantity: parseInt(currentProductToEdit.stock_quantity),
                    category: currentProductToEdit.category,
                    description: currentProductToEdit.description.trim(), // Ensure description is sent
                    imageUrl: currentProductToEdit.imageUrl || 'https://placehold.co/150x150/E0E7FF/4338CA?text=Product'
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update item.');
            }
            setAppMessage({ type: 'success', text: `Item "${data.product.name}" updated successfully!` });
            setIsEditModalOpen(false); // Close modal
            setCurrentProductToEdit(null); // Clear edited product
            fetchInitialData(); // Refresh product list
        } catch (err) {
            console.error('Error updating item:', err);
            setAppMessage({ type: 'error', text: `Failed to update item: ${err.message}` });
        }
    };

    // Function to handle deleting an item
    const handleDeleteConfirmed = async () => {
        if (!productToDelete) return; // Should not happen if modal is correctly used

        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/products/${productToDelete.id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete item.');
            }
            setAppMessage({ type: 'success', text: `Item "${productToDelete.name}" deleted successfully!` });
            setIsConfirmDeleteModalOpen(false); // Close modal
            setProductToDelete(null); // Clear deleted product
            fetchInitialData(); // Refresh product list
        } catch (err) {
            console.error('Error deleting item:', err);
            setAppMessage({ type: 'error', text: `Failed to delete item: ${err.message}` });
        }
    };

    // --- Category Management ---
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            setAppMessage({ type: 'error', text: 'Category name cannot be empty.' });
            return;
        }
        try {
            const response = await fetch('https://my-pos-backend.onrender.com/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName.trim(), description: newCategoryDescription.trim() }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add category.');
            }
            setAppMessage({ type: 'success', text: `Category "${data.category.name}" added successfully!` });
            setNewCategoryName('');
            setNewCategoryDescription('');
            setIsAddCategoryModalOpen(false);
            fetchInitialData(); // Re-fetch products and categories in App.js, and this component will re-render
            const updatedCategories = await fetch('https://my-pos-backend.onrender.com/api/categories').then(res => res.json());
            setAllCategoriesData(updatedCategories); // Update full category data
            setCategories(['All', ...updatedCategories.map(cat => cat.name)]); // Update category names for display
        } catch (err) {
            console.error('Error adding category:', err);
            setAppMessage({ type: 'error', text: `Failed to add category: ${err.message}` });
        }
    };

    // Function to handle editing an existing category
    const handleEditCategory = async (e) => {
        e.preventDefault();
        if (!categoryToEdit) return;

        if (!categoryToEdit.name.trim()) {
            setAppMessage({ type: 'error', text: 'Category name cannot be empty.' });
            return;
        }

        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/categories/${categoryToEdit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: categoryToEdit.name.trim(), description: categoryToEdit.description.trim() }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update category.');
            }
            setAppMessage({ type: 'success', text: `Category "${data.category.name}" updated successfully!` });
            setIsEditCategoryModalOpen(false);
            setCategoryToEdit(null);
            fetchInitialData(); // Refresh product list and categories
            const updatedCategories = await fetch('https://my-pos-backend.onrender.com/api/categories').then(res => res.json());
            setAllCategoriesData(updatedCategories);
            setCategories(['All', ...updatedCategories.map(cat => cat.name)]);
        } catch (err) {
            console.error('Error updating category:', err);
            setAppMessage({ type: 'error', text: `Failed to update category: ${err.message}` });
        }
    };

    // Function to handle deleting a category
    const handleDeleteConfirmedCategory = async () => {
        if (!categoryToDelete) return;

        try {
            const response = await fetch(`https://my-pos-backend.onrender.com/api/categories/${categoryToDelete.id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete category.');
            }
            setAppMessage({ type: 'success', text: `Category "${categoryToDelete.name}" deleted successfully!` });
            setIsConfirmDeleteCategoryModalOpen(false);
            setCategoryToDelete(null);
            fetchInitialData(); // Refresh product list and categories
            const updatedCategories = await fetch('https://my-pos-backend.onrender.com/api/categories').then(res => res.json());
            setAllCategoriesData(updatedCategories);
            setCategories(['All', ...updatedCategories.map(cat => cat.name)]);
            setSelectedCategoryTab('All'); // Reset selected tab if the deleted category was selected
        } catch (err) {
            console.error('Error deleting category:', err);
            setAppMessage({ type: 'error', text: `Failed to delete category: ${err.message}` });
        }
    };

    // Utility function to get all unique categories from products for the dropdown (now derived from allCategoriesData)
    const allUniqueCategories = useMemo(() => {
        return Array.from(new Set(allCategoriesData.map(cat => cat.name))).sort();
    }, [allCategoriesData]);


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Menu Management</h1>

            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-md mb-6">
                <div className="flex items-center w-full sm:w-auto mb-4 sm:mb-0">
                    <button
                        onClick={() => setShowAddItemModal(true)}
                        className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 mr-3"
                    >
                        <PlusCircle size={20} className="mr-2" /> Add New Item
                    </button>
                    <button
                        onClick={() => setIsAddCategoryModalOpen(true)}
                        className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200"
                    >
                        <PlusCircle size={20} className="mr-2" /> Add Category
                    </button>
                </div>
                <div className="relative w-full sm:w-72">
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center bg-white p-3 rounded-xl shadow-md">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategoryTab(category)}
                        className={`py-2 px-4 rounded-full text-sm font-medium transition-colors duration-200
                            ${selectedCategoryTab === category ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                        `}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Menu Items Table */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Menu Items</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Defensive check for filteredAndSearchedProducts being an array */}
                        {Array.isArray(filteredAndSearchedProducts) && filteredAndSearchedProducts.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                    No menu items found. Try adjusting filters or search.
                                </td>
                            </tr>
                        ) : (
                            Array.isArray(filteredAndSearchedProducts) && filteredAndSearchedProducts.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.price?.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            product.stock_quantity === 0 ? 'bg-red-100 text-red-800' :
                                            product.stock_quantity <= 5 ? 'bg-orange-100 text-orange-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {product.stock_quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{product.description || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => { setCurrentProductToEdit(product); setIsEditModalOpen(true); }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                                            title="Edit Item"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => { setProductToDelete(product); setIsConfirmDeleteModalOpen(true); }}
                                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                            title="Delete Item"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Category List for Management */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Manage Categories</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {allCategoriesData.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                    No categories found.
                                </td>
                            </tr>
                        ) : (
                            allCategoriesData.map(category => (
                                <tr key={category.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{category.description || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => { setCategoryToEdit(category); setIsEditCategoryModalOpen(true); }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                                            title="Edit Category"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => { setCategoryToDelete(category); setIsConfirmDeleteCategoryModalOpen(true); }}
                                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                            title="Delete Category"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>


            {/* Add New Item Modal */}
            {showAddItemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Add New Menu Item</h2>
                            <button onClick={() => setShowAddItemModal(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Item Name</label>
                                <input
                                    type="text" id="itemName"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    id="itemCategory"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {allUniqueCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700">Price ($)</label>
                                <input
                                    type="number" id="itemPrice" step="0.01"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                    required min="0"
                                />
                            </div>
                            <div>
                                <label htmlFor="itemStock" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                                <input
                                    type="number" id="itemStock"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={newItem.stock_quantity} onChange={(e) => setNewItem({ ...newItem, stock_quantity: e.target.value })}
                                    required min="0"
                                />
                            </div>
                            <div>
                                <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                                <textarea
                                    id="itemDescription" rows="3"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddItemModal(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                                >
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {isEditModalOpen && currentProductToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Menu Item</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditItem} className="space-y-4">
                            <div>
                                <label htmlFor="editItemName" className="block text-sm font-medium text-gray-700">Item Name</label>
                                <input
                                    type="text" id="editItemName"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={currentProductToEdit.name} onChange={(e) => setCurrentProductToEdit({ ...currentProductToEdit, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="editItemCategory" className="block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    id="editItemCategory"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={currentProductToEdit.category}
                                    onChange={(e) => setCurrentProductToEdit({ ...currentProductToEdit, category: e.target.value })}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {allUniqueCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="editItemPrice" className="block text-sm font-medium text-gray-700">Price ($)</label>
                                <input
                                    type="number" id="editItemPrice" step="0.01"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={currentProductToEdit.price} onChange={(e) => setCurrentProductToEdit({ ...currentProductToEdit, price: e.target.value })}
                                    required min="0"
                                />
                            </div>
                            <div>
                                <label htmlFor="editItemStock" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                                <input
                                    type="number" id="editItemStock"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={currentProductToEdit.stock_quantity} onChange={(e) => setCurrentProductToEdit({ ...currentProductToEdit, stock_quantity: e.target.value })}
                                    required min="0"
                                />
                            </div>
                            <div>
                                <label htmlFor="editItemDescription" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                                <textarea
                                    id="editItemDescription" rows="3"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={currentProductToEdit.description} onChange={(e) => setCurrentProductToEdit({ ...currentProductToEdit, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Item Confirmation Modal */}
            {isConfirmDeleteModalOpen && productToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 text-center">
                        <div className="flex justify-center mb-4">
                            <Trash2 size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
                        <p className="text-lg font-semibold text-red-600 mb-6 text-center">"{productToDelete.name}"</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => { setIsConfirmDeleteModalOpen(false); setProductToDelete(null); }}
                                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirmed}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Category Modal */}
            {isAddCategoryModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Add New Category</h2>
                            <button onClick={() => setIsAddCategoryModalOpen(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div>
                                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">Category Name</label>
                                <input
                                    type="text" id="categoryName"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500"
                                    value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                                <textarea
                                    id="categoryDescription" rows="3"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500"
                                    value={newCategoryDescription} onChange={(e) => setNewCategoryDescription(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCategoryModalOpen(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                                >
                                    Add Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {isEditCategoryModalOpen && categoryToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Category</h2>
                            <button onClick={() => setIsEditCategoryModalOpen(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditCategory} className="space-y-4">
                            <div>
                                <label htmlFor="editCategoryName" className="block text-sm font-medium text-gray-700">Category Name</label>
                                <input
                                    type="text" id="editCategoryName"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500"
                                    value={categoryToEdit.name} onChange={(e) => setCategoryToEdit({ ...categoryToEdit, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="editCategoryDescription" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                                <textarea
                                    id="editCategoryDescription" rows="3"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500"
                                    value={categoryToEdit.description} onChange={(e) => setCategoryToEdit({ ...categoryToEdit, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditCategoryModalOpen(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Category Confirmation Modal */}
            {isConfirmDeleteCategoryModalOpen && categoryToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 text-center">
                        <div className="flex justify-center mb-4">
                            <Trash2 size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Category Deletion</h3>
                        <p className="text-gray-700 mb-6">Are you sure you want to delete the category "<span className="font-semibold">{categoryToDelete.name}</span>"? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => { setIsConfirmDeleteCategoryModalOpen(false); setCategoryToDelete(null); }}
                                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirmedCategory}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Delete Category
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MenuManagement;
