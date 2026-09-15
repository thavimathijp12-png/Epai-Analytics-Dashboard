const Employee = require('../models/Employee');
const { calculateRiskScore } = require('../utils/riskScore');

const buildQuery = (req) => {
    const query = {};
    if (req.query.department && req.query.department !== 'All') query.Department = req.query.department;
    if (req.query.jobRole && req.query.jobRole !== 'All' && req.query.jobRole !== 'All Roles') query.JobRole = req.query.jobRole;
    if (req.query.gender && req.query.gender !== 'All') query.Gender = req.query.gender;
    if (req.query.attrition && req.query.attrition !== 'All') query.Attrition = req.query.attrition;
    if (req.query.overtime && req.query.overtime !== 'All') query.Overtime = req.query.overtime;
    if (req.query.search) {
        query.$or = [
            { EmployeeID: { $regex: req.query.search, $options: 'i' } },
            { JobRole: { $regex: req.query.search, $options: 'i' } },
            { Department: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    if (req.query.ageGroup && req.query.ageGroup !== 'All') {
        if (req.query.ageGroup === '55+') query.Age = { $gte: 55 };
        else {
            const [min, max] = req.query.ageGroup.split('-');
            query.Age = { $gte: Number(min), $lte: Number(max) };
        }
    }
    return query;
};

exports.getEmployees = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 15;
        const startIndex = (page - 1) * limit;

        const query = buildQuery(req);
        
        let sortCol = req.query.sortCol || 'EmployeeID';
        const sortAsc = req.query.sortAsc === 'false' ? -1 : 1;
        const sortObj = {};
        sortObj[sortCol] = sortAsc;

        const total = await Employee.countDocuments(query);
        const employees = await Employee.find(query).sort(sortObj).skip(startIndex).limit(limit);

        res.json({
            success: true,
            data: employees,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getEmployee = async (req, res) => {
    try {
        const employee = await Employee.findOne({ EmployeeID: req.params.id });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
        res.json({ success: true, data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        const empData = { ...req.body };
        const riskData = calculateRiskScore(empData);
        empData.RiskScore = riskData.RiskScore;
        empData.RiskLevel = riskData.RiskLevel;
        empData.RiskFactors = riskData.RiskFactors;
        empData.RecommendedAction = riskData.RecommendedAction;

        const employee = await Employee.create(empData);
        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const empId = req.params.id;
        // Merge updates with existing to calculate risk properly
        const existing = await Employee.findOne({ EmployeeID: empId });
        if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

        const updatedData = { ...existing.toObject(), ...req.body };
        const riskData = calculateRiskScore(updatedData);
        
        updatedData.RiskScore = riskData.RiskScore;
        updatedData.RiskLevel = riskData.RiskLevel;
        updatedData.RiskFactors = riskData.RiskFactors;
        updatedData.RecommendedAction = riskData.RecommendedAction;

        const employee = await Employee.findOneAndUpdate({ EmployeeID: empId }, updatedData, { new: true, runValidators: true });
        res.json({ success: true, data: employee });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findOneAndDelete({ EmployeeID: req.params.id });
        if (!employee) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Employee deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
