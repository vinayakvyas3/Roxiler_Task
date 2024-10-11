import express from 'express'
import mongoose from "mongoose";
import { dbConnection } from "./database/dbConnection.js";
import axios from "axios";
import Transaction from "./models/Transaction.js"
import { config } from "dotenv";
import transactionsRoute from "./routes/transactions.js"
import cors from 'cors';


const app = express();
config({ path: "./config/.env" });
dbConnection();

// Use CORS middleware
app.use(cors());

// Function to seed the database with data from the API
const seedDatabase = async() => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const data = response.data;

        // Clear existing data
        await Transaction.deleteMany();

        // Map the data to match the schema fields
        const formattedData = data.map(item => ({
            id: item.id, // If there's an id field in the API data
            title: item.title,
            description: item.description,
            price: item.price,
            category: item.category,
            image: item.image, // Assuming this field contains the image URL
            sold: item.sold, // Directly match the field name
            dateOfSale: new Date(item.dateOfSale) // Ensure this is a valid Date object
        }));

        // Insert the mapped data into the database
        await Transaction.insertMany(formattedData);
        console.log('Database seeded successfully with updated fields!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};
seedDatabase();
// Endpoint to seed the database manually
app.get('/initialize', async(req, res) => {
    await seedDatabase();
    res.send('Database initialized with seed data');
});

// Use the transactions route
app.use('/transactions', transactionsRoute);

app.listen(process.env.PORT, () => {
    console.log(`Server running at port ${process.env.PORT}`);
});