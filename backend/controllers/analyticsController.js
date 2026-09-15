const Employee = require('../models/Employee');
const { generateInsights } = require('../utils/insights');

const buildQuery = (req) => {
    const query = {};
    if (req.query.department && req.query.department !== 'All') query.Department = req.query.department;
    if (req.query.jobRole && req.query.jobRole !== 'All' && req.query.jobRole !== 'All Roles') query.JobRole = req.query.jobRole;
    if (req.query.gender && req.query.gender !== 'All') query.Gender = req.query.gender;
    if (req.query.attrition && req.query.attrition !== 'All') query.Attrition = req.query.attrition;
    if (req.query.overtime && req.query.overtime !== 'All') query.Overtime = req.query.overtime;
    if (req.query.ageGroup && req.query.ageGroup !== 'All') {
        if (req.query.ageGroup === '55+') query.Age = { $gte: 55 };
        else {
            const [min, max] = req.query.ageGroup.split('-');
            query.Age = { $gte: Number(min), $lte: Number(max) };
        }
    }
    return query;
};

// Overview KPIs
exports.getOverview = async (req, res) => {
    try {
        const query = buildQuery(req);
        const data = await Employee.find(query);
        
        if (data.length === 0) {
            return res.json({ success: true, data: { totalEmployees: 0, attritionRate: 0, averagePerformance: 0, averageIncome: 0, averageJobSatisfaction: 0, highRiskEmployees: 0 }});
        }

        const totalEmployees = data.length;
        const attritionRate = ((data.filter(d => d.Attrition === 'Yes').length / totalEmployees) * 100).toFixed(1);
        const averagePerformance = (data.reduce((s,d) => s + d.PerformanceRating, 0) / totalEmployees).toFixed(1);
        const averageIncome = Math.round(data.reduce((s,d) => s + d.MonthlyIncome, 0) / totalEmployees);
        const averageJobSatisfaction = (data.reduce((s,d) => s + d.JobSatisfaction, 0) / totalEmployees).toFixed(1);
        const highRiskEmployees = data.filter(d => d.Attrition === 'No' && d.RiskScore > 60).length;

        res.json({ success: true, data: { totalEmployees, attritionRate, averagePerformance, averageIncome, averageJobSatisfaction, highRiskEmployees }});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Department Analysis
exports.getDepartments = async (req, res) => {
    try {
        const query = buildQuery(req);
        const data = await Employee.find(query);
        const depts = [...new Set(data.map(d => d.Department))];
        
        const result = depts.map(dept => {
            const dData = data.filter(d => d.Department === dept);
            const count = dData.length;
            return {
                department: dept,
                employeeCount: count,
                attritionRate: ((dData.filter(d => d.Attrition === 'Yes').length / count) * 100).toFixed(1),
                averagePerformance: (dData.reduce((s,d) => s + d.PerformanceRating, 0) / count).toFixed(1),
                averageIncome: Math.round(dData.reduce((s,d) => s + d.MonthlyIncome, 0) / count),
                averageSatisfaction: (dData.reduce((s,d) => s + d.JobSatisfaction, 0) / count).toFixed(1),
                highRiskEmployees: dData.filter(d => d.RiskScore > 60).length
            };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// High Risk Employees
exports.getRisk = async (req, res) => {
    try {
        const query = buildQuery(req);
        query.Attrition = 'No'; // Only look at active employees for risk
        const data = await Employee.find(query).sort({ RiskScore: -1 });

        const lowRiskCount = data.filter(d => d.RiskScore <= 30).length;
        const mediumRiskCount = data.filter(d => d.RiskScore > 30 && d.RiskScore <= 60).length;
        const highRiskCount = data.filter(d => d.RiskScore > 60).length;

        const topHighRiskEmployees = data.slice(0, 5);
        
        res.json({ success: true, data: { lowRiskCount, mediumRiskCount, highRiskCount, topHighRiskEmployees }});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Insights
exports.getInsights = async (req, res) => {
    try {
        const query = buildQuery(req);
        const data = await Employee.find(query);
        const insights = generateInsights(data);
        res.json({ success: true, data: insights });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Unified Data Endpoint for Frontend Charts (to avoid making 15 separate calls)
exports.getChartData = async (req, res) => {
    try {
        const query = buildQuery(req);
        const data = await Employee.find(query);
        res.json({ success: true, data }); // Send the filtered dataset to the frontend for charting
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDataQuality = async (req, res) => {
    try {
        const totalRecords = await Employee.countDocuments();
        const depts = await Employee.distinct('Department');
        const roles = await Employee.distinct('JobRole');
        
        res.json({ success: true, data: {
            totalRecords,
            missingValues: 0,
            duplicateRecords: 0,
            departmentCount: depts.length,
            jobRoleCount: roles.length,
            attritionClasses: 2
        }});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
