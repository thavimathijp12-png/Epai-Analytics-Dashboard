require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Employee = require('../models/Employee');
const { calculateRiskScore } = require('../utils/riskScore');

const seedEmployees = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee_intelligence';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB...');

        // Clear existing data
        await Employee.deleteMany();
        console.log('Cleared existing employees...');

        // Read local JSON file (generated from earlier step)
        const dataPath = path.join(__dirname, '../../data/employees.json');
        
        if (!fs.existsSync(dataPath)) {
            console.error('Data file not found at:', dataPath);
            process.exit(1);
        }

        const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        
        // Calculate Risk Scores before inserting
        const employeesToInsert = rawData.map(emp => {
            const mappedEmp = { ...emp, Overtime: emp.OverTime || emp.Overtime };
            
            const riskData = calculateRiskScore(mappedEmp);
            return {
                ...mappedEmp,
                RiskScore: riskData.RiskScore,
                RiskLevel: riskData.RiskLevel,
                RiskFactors: riskData.RiskFactors,
                RecommendedAction: riskData.RecommendedAction
            };
        });

        await Employee.insertMany(employeesToInsert);
        console.log(`Successfully seeded ${employeesToInsert.length} employees into MongoDB!`);

        process.exit();
    } catch (error) {
        console.error('Error seeding employees:', error);
        process.exit(1);
    }
};

seedEmployees();
