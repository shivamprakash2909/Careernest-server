const mongoose = require('mongoose');
const Application = require('../models/Application');

async function dropIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/careernest', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Get all indexes
        const indexes = await Application.collection.indexes();
        console.log('Current indexes:', indexes);

        // Drop all indexes except _id
        await Application.collection.dropIndexes();
        console.log('Dropped all indexes');

        // Create new non-unique indexes
        await Application.collection.createIndex({ job_id: 1, status: 1 });
        await Application.collection.createIndex({ internship_id: 1, status: 1 });
        await Application.collection.createIndex({ created_date: -1 });
        console.log('Created new non-unique indexes');

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

dropIndexes();
