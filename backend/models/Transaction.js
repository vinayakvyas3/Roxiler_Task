import mongoose from "mongoose";

// Update the transaction schema to include new fields like 'id' and 'image'
const transactionSchema = new mongoose.Schema({
    id: Number,
    title: String,
    description: String,
    price: Number,
    category: String,
    image: String, // New field for image URL
    sold: Boolean, // Updated field name to match the data directly
    dateOfSale: Date
}, { collection: 'Transaction' }); // Explicitly set the collection name

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;