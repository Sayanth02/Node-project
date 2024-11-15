const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes')

dotenv.config()

const app = express();

// Enable CORS
app.use(cors({
    origin: 'http://localhost:5173'
}));

// Middleware to parse JSON
app.use(express.json());


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });

// Your routes will go here
app.use('/api/users', userRoutes)


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});