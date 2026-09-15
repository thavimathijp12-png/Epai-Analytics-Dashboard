const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('--- EPAI Backend Health & E2E Test ---');

const testApi = async () => {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:5000/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ API Health Check: PASS (Status 200)');
                    resolve(true);
                } else {
                    console.log(`❌ API Health Check: FAIL (Status ${res.statusCode})`);
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.log('❌ API Health Check: FAIL (' + err.message + ')');
            resolve(false);
        });
    });
};

const testDb = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee_intelligence';
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connection: PASS');
        
        const Employee = require('../models/Employee');
        const count = await Employee.countDocuments();
        
        if (count > 0) {
            console.log(`✅ Employee Data: PASS (${count} records found)`);
        } else {
            console.log('❌ Employee Data: FAIL (0 records)');
        }
        
        const User = require('../models/User');
        const adminCount = await User.countDocuments({ email: 'admin@epai.com' });
        
        if (adminCount > 0) {
            console.log('✅ Admin User: PASS (Found admin@epai.com)');
        } else {
            console.log('❌ Admin User: FAIL (Not found)');
        }
        
        await mongoose.disconnect();
        return true;
    } catch (e) {
        console.log('❌ MongoDB Connection: FAIL (' + e.message + ')');
        return false;
    }
};

const runAll = async () => {
    console.log('1. Testing Database & Seed State...');
    await testDb();
    
    console.log('\n2. Testing API Endpoints (Requires backend to be running)...');
    await testApi();
    
    console.log('\nTest complete.');
    process.exit(0);
};

runAll();
