import React, { useState, useEffect, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { getCombinedData, getTransactions } from './ApiService';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';

// Register necessary chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
    const [month, setMonth] = useState('March'); // Default to "March"
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);

    // Function to fetch combined data (statistics, bar chart, pie chart)
    const fetchCombinedData = useCallback(async () => {
        setLoading(true);
        try {
            const combinedData = await getCombinedData(month);
            setData(combinedData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    }, [month]);

    // Function to fetch transactions for the selected month
    const fetchTransactions = useCallback(async () => {
        try {
            const transactionsData = await getTransactions(month, '', page, perPage);
            setTransactions(transactionsData.transactions || []);
            setFilteredTransactions(transactionsData.transactions || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setTransactions([]);
            setFilteredTransactions([]);
        }
    }, [month, page, perPage]);

    // Fetch data when month or page changes
    useEffect(() => {
        fetchCombinedData();
        fetchTransactions();
    }, [fetchCombinedData, fetchTransactions]);

    // Filter transactions based on the search term
    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearch(searchTerm);

        if (searchTerm.trim() === '') {
            setFilteredTransactions(transactions);
        } else {
            const filtered = transactions.filter(transaction =>
                transaction.title.toLowerCase().includes(searchTerm) ||
                transaction.description.toLowerCase().includes(searchTerm) ||
                transaction.price.toString().includes(searchTerm)
            );
            setFilteredTransactions(filtered);
        }
    };

    // Handle changes in the selected month
    const handleMonthChange = (e) => {
        setMonth(e.target.value);
        setPage(1); // Reset to the first page when a new month is selected
    };

    const handleNextPage = () => {
        setPage((prev) => prev + 1);
    };

    const handlePreviousPage = () => {
        setPage((prev) => Math.max(prev - 1, 1));
    };

    const renderBarChart = () => {
        if (data && data.barChart) {
            const labels = Object.keys(data.barChart);
            const values = Object.values(data.barChart);

            return (
                <Bar
                    data={{
                        labels,
                        datasets: [
                            {
                                label: 'Number of Items',
                                data: values,
                                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                            },
                        ],
                    }}
                    options={{
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: `Price Range Distribution for ${month}`,
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                            },
                        },
                    }}
                />
            );
        }
        return null;
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="dashboard">
            <h1>Transaction Dashboard</h1>
            <div className="controls">
                <div className="search">
                    <input
                        type="text"
                        placeholder="Search transaction"
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="month-selector">
                    <button>Select Month</button>
                    <select value={month} onChange={handleMonthChange}>
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Sold</th>
                        <th>Image</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(filteredTransactions) && filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction) => (
                            <tr key={transaction.id}>
                                <td>{transaction.id}</td>
                                <td>{transaction.title}</td>
                                <td>{transaction.description}</td>
                                <td>${transaction.price}</td>
                                <td>{transaction.category}</td>
                                <td>{transaction.sold ? 'Yes' : 'No'}</td>
                                <td>
                                    <img src={transaction.image} alt={transaction.title} width="50" height="50" />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7">No transactions found for the selected month.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="pagination">
                <span>Page No: {page}</span>
                <button onClick={handlePreviousPage} disabled={page === 1}>Previous</button>
                <button onClick={handleNextPage}>Next</button>
                <span>Per Page: {perPage}</span>
            </div>

            {data && (
                <div className="statistics">
                    <h2>Statistics for {month}</h2>
                    <p>Total Sale Amount: ${data.statistics.totalSaleAmount}</p>
                    <p>Total Sold Items: {data.statistics.totalSoldItems}</p>
                    <p>Total Not Sold Items: {data.statistics.totalNotSoldItems}</p>
                </div>
            )}

            <h2>Transactions Bar Chart</h2>
            {renderBarChart()}

            <h2>Pie Chart</h2>
            <ul>
                {data && Object.entries(data.pieChart).map(([category, count]) => (
                    <li key={category}>{category}: {count} items</li>
                ))}
            </ul>
        </div>
    );
};

export default Dashboard;
