import express from 'express';
import Transaction from '../models/Transaction.js';
import axios from 'axios';
const router = express.Router();

// GET /transactions with search and pagination
router.get('/', async(req, res) => {
    try {
        const { search, page = 1, per_page = 10 } = req.query;
        const query = {};

        // Add search criteria if search text is provided
        if (search) {
            query.$or = [
                { product_title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { price: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
            .skip((page - 1) * per_page)
            .limit(parseInt(per_page));

        res.json({
            total,
            page: parseInt(page),
            per_page: parseInt(per_page),
            transactions,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions', error });
    }
});

// Statistics route
router.get('/statistics', async(req, res) => {
    try {
        const { month } = req.query;

        // Convert month name to a number (0-11)
        const monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth();

        // Fetch transactions for the specified month
        const transactions = await Transaction.find({
            dateOfSale: {
                $gte: new Date(2022, monthIndex, 1),
                $lt: new Date(2022, monthIndex + 1, 1)
            }
        });

        // Calculate statistics
        const totalSaleAmount = transactions.reduce((sum, transaction) => sum + transaction.price, 0);
        const totalSoldItems = transactions.length;
        const totalNotSoldItems = transactions.filter(transaction => !transaction.sold).length;

        // Send response
        res.json({
            totalSaleAmount,
            totalSoldItems,
            totalNotSoldItems
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching statistics', error });
    }
});

// Bar chart route
router.get('/bar-chart', async(req, res) => {
    try {
        const { month } = req.query;

        // Convert month name to a number (0-11)
        const monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth();

        // Fetch transactions for the specified month
        const transactions = await Transaction.find({
            dateOfSale: {
                $gte: new Date(2022, monthIndex, 1),
                $lt: new Date(2022, monthIndex + 1, 1)
            }
        });

        // Define price ranges
        const priceRanges = {
            "0-100": 0,
            "101-200": 0,
            "201-300": 0,
            "301-400": 0,
            "401-500": 0,
            "501-600": 0,
            "601-700": 0,
            "701-800": 0,
            "801-900": 0,
            "901-above": 0
        };

        // Iterate over transactions and categorize them into price ranges
        transactions.forEach(transaction => {
            const price = transaction.price;

            if (price <= 100) priceRanges["0-100"]++;
            else if (price <= 200) priceRanges["101-200"]++;
            else if (price <= 300) priceRanges["201-300"]++;
            else if (price <= 400) priceRanges["301-400"]++;
            else if (price <= 500) priceRanges["401-500"]++;
            else if (price <= 600) priceRanges["501-600"]++;
            else if (price <= 700) priceRanges["601-700"]++;
            else if (price <= 800) priceRanges["701-800"]++;
            else if (price <= 900) priceRanges["801-900"]++;
            else priceRanges["901-above"]++;
        });

        // Send response
        res.json(priceRanges);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bar chart data', error });
    }
});

// Pie chart route
router.get('/pie-chart', async(req, res) => {
    try {
        const { month } = req.query;

        // Convert month name to a number (0-11)
        const monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth();

        // Fetch transactions for the specified month
        const transactions = await Transaction.find({
            dateOfSale: {
                $gte: new Date(2022, monthIndex, 1),
                $lt: new Date(2022, monthIndex + 1, 1)
            }
        });

        // Create an object to store categories and their item counts
        const categoryCounts = {};

        // Iterate over transactions and count items by category
        transactions.forEach(transaction => {
            const category = transaction.category;

            if (categoryCounts[category]) {
                categoryCounts[category]++;
            } else {
                categoryCounts[category] = 1;
            }
        });

        // Send response
        res.json(categoryCounts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pie chart data', error });
    }
});

// Combined data route
router.get('/combined-data', async(req, res) => {
    try {
        const { month } = req.query;

        // Ensure the month parameter is provided
        if (!month) {
            return res.status(400).json({ message: 'Month query parameter is required' });
        }

        // Define the base URL for internal requests
        const baseUrl = `${req.protocol}://${req.get('host')}/transactions`;

        // Fetch data from the three internal APIs using axios
        const [statisticsResponse, barChartResponse, pieChartResponse] = await Promise.all([
            axios.get(`${baseUrl}/statistics`, { params: { month } }),
            axios.get(`${baseUrl}/bar-chart`, { params: { month } }),
            axios.get(`${baseUrl}/pie-chart`, { params: { month } })
        ]);

        // Combine the responses into a single JSON object
        const combinedData = {
            statistics: statisticsResponse.data,
            barChart: barChartResponse.data,
            pieChart: pieChartResponse.data
        };

        // Send the combined response
        res.json(combinedData);
    } catch (error) {
        console.error('Error fetching combined data:', error);
        res.status(500).json({ message: 'Error fetching combined data', error });
    }
});


export default router;