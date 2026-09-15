require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee_intelligence';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB...');

        // Clear existing admin
        await User.deleteMany({ email: 'admin@epai.com' });

        const admin = new User({
            email: 'admin@epai.com',
            password: 'password123',
            role: 'admin'
        });

        await admin.save();
        console.log('Demo Admin user created: admin@epai.com / password123');

        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
