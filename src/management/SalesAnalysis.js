import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
    ChevronDown, ChevronUp, Search, Calendar, Download, Filter, Eye
} from 'lucide-react'; // Using lucide-react for icons

// Utility to format numbers as currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

// Utility to calculate percentage change (frontend version, though backend now calculates)
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return parseFloat(((current - previous) / previous * 100).toFixed(1));
};

const SalesAnalysis = () => {
    const [salesMetrics, setSalesMetrics] = useState({
        todaySales: 0,
        todaySalesChange: 0,
        thisMonthSales: 0,
        thisMonthSalesChange: 0,
        totalSalesYTD: 0,
        totalSalesYTDChange: 0,
        salesChangeOverall: 0,
        salesChangeOverallPercent: 0,
    });
    const [dailySalesData, setDailySalesData] = useState([]);
    const [monthlyComparisonData, setMonthlyComparisonData] = useState([]);
    const [userSalesData, setUserSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('month'); // Default date range

    const API_BASE_URL = 'https://my-pos-backend.onrender.com/api'; // Ensure this matches your backend URL

    // Function to fetch sales metrics
    const fetchSalesMetrics = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sales/metrics`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSalesMetrics(data);
        } catch (err) {
            console.error('Error fetching sales metrics:', err);
            setError('Failed to load sales metrics.');
        }
    };

    // Function to fetch daily sales trend
    const fetchDailySalesTrend = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sales/daily-trend`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setDailySalesData(data);
        } catch (err) {
            console.error('Error fetching daily sales trend:', err);
            setError('Failed to load daily sales trend.');
        }
    };

    // Function to fetch monthly comparison
    const fetchMonthlyComparison = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sales/monthly-comparison`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setMonthlyComparisonData(data);
        } catch (err) {
            console.error('Error fetching monthly comparison:', err);
            setError('Failed to load monthly comparison data.');
        }
    };

    // Function to fetch user-wise sales report
    const fetchUserSales = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sales/user-report`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setUserSalesData(data);
        } catch (err) {
            console.error('Error fetching user sales report:', err);
            setError('Failed to load user sales report.');
        }
    };

    useEffect(() => {
        const loadAllSalesData = async () => {
            setLoading(true);
            setError(null);
            await Promise.all([
                fetchSalesMetrics(),
                fetchDailySalesTrend(),
                fetchMonthlyComparison(),
                fetchUserSales(),
            ]);
            setLoading(false);
        };

        loadAllSalesData();
    }, []); // Empty dependency array means this runs once on mount

    const filteredUserSales = userSalesData.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-lg font-semibold text-gray-700">Loading sales data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-lg font-semibold text-red-600">Error: {error}</p>
            </div>
        );
    }

    // Helper to render percentage change with icon and color
    const renderChange = (value) => {
        const isPositive = value >= 0;
        const icon = isPositive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
        const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
        return (
            <span className={`flex items-center gap-1 font-semibold ${colorClass}`}>
                {icon} {Math.abs(value)}%
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-inter">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
                    Dashboard / <span className="text-blue-600">Sales Analysis</span>
                </h1>
                <div className="flex space-x-2">
                    <button className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${dateRange === 'today' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`} onClick={() => setDateRange('today')}>Today</button>
                    <button className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${dateRange === 'week' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`} onClick={() => setDateRange('week')}>Week</button>
                    <button className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${dateRange === 'month' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`} onClick={() => setDateRange('month')}>Month</button>
                    <button className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${dateRange === 'quarter' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`} onClick={() => setDateRange('quarter')}>Quarter</button>
                </div>
            </div>

            {/* Sales Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Today's Sales */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start justify-between border-b-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
                    <p className="text-sm font-medium text-gray-500 mb-2">Today's Sales</p>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">{formatCurrency(salesMetrics.todaySales)}</h2>
                    {renderChange(salesMetrics.todaySalesChange)}
                </div>

                {/* This Month's Sales */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start justify-between border-b-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
                    <p className="text-sm font-medium text-gray-500 mb-2">This Month's Sales</p>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">{formatCurrency(salesMetrics.thisMonthSales)}</h2>
                    {renderChange(salesMetrics.thisMonthSalesChange)}
                </div>

                {/* Total Sales */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start justify-between border-b-4 border-purple-500 hover:shadow-xl transition-shadow duration-300">
                    <p className="text-sm font-medium text-gray-500 mb-2">Total Sales (YTD)</p>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">{formatCurrency(salesMetrics.totalSalesYTD)}</h2>
                    {renderChange(salesMetrics.totalSalesYTDChange)}
                </div>

                {/* Sales Change Overall */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start justify-between border-b-4 border-orange-500 hover:shadow-xl transition-shadow duration-300">
                    <p className="text-sm font-medium text-gray-500 mb-2">Sales Change (YTD vs Last YTD)</p>
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">{formatCurrency(salesMetrics.salesChangeOverall)}</h2>
                    {renderChange(salesMetrics.salesChangeOverallPercent)}
                </div>
            </div>

            {/* Daily Sales Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Sales Trend (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailySalesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Monthly Comparison Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Sales Comparison (Last 6 Months)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="current" fill="#8884d8" name="Current" radius={[10, 10, 0, 0]} />
                        <Bar dataKey="previous" fill="#82ca9d" name="Previous" radius={[10, 10, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* User-wise Sales Report */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">User-wise Sales Report</h3>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 sm:gap-0">
                    <div className="relative w-full sm:w-1/3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg shadow-sm hover:bg-gray-200 transition-colors duration-200 text-sm font-medium">
                            <Filter size={18} /> Filter
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                            <Download size={18} /> Export Reports
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUserSales.length > 0 ? (
                                filteredUserSales.map((user, index) => (
                                    <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name || user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(user.totalSales)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.orders}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{renderChange(parseFloat(user.change))}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                                                <Eye size={16} /> View Report
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No user sales data available or matches search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesAnalysis;
