const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    EmployeeID: { type: String, required: true, unique: true },
    Age: { type: Number, required: true },
    Gender: { type: String, required: true },
    Department: { type: String, required: true },
    JobRole: { type: String, required: true },
    JobLevel: { type: Number, required: true },
    MonthlyIncome: { type: Number, required: true },
    HourlyRate: { type: Number },
    DailyRate: { type: Number },
    MonthlyRate: { type: Number },
    YearsAtCompany: { type: Number, required: true },
    YearsInCurrentRole: { type: Number, required: true },
    YearsSinceLastPromotion: { type: Number, required: true },
    YearsWithCurrManager: { type: Number },
    TotalWorkingYears: { type: Number, required: true },
    NumCompaniesWorked: { type: Number },
    Overtime: { type: String, required: true },
    JobSatisfaction: { type: Number, required: true },
    EnvironmentSatisfaction: { type: Number },
    RelationshipSatisfaction: { type: Number },
    WorkLifeBalance: { type: Number, required: true },
    JobInvolvement: { type: Number },
    PerformanceRating: { type: Number, required: true },
    TrainingTimesLastYear: { type: Number },
    StockOptionLevel: { type: Number },
    DistanceFromHome: { type: Number, required: true },
    Education: { type: Number },
    EducationField: { type: String },
    MaritalStatus: { type: String },
    BusinessTravel: { type: String },
    Attrition: { type: String, required: true },
    
    // Calculated fields
    RiskScore: { type: Number, default: 0 },
    RiskLevel: { type: String, default: 'LOW RISK' },
    RiskFactors: [{ type: String }],
    RecommendedAction: { type: String }
}, { timestamps: true });

// Create indexes for common filtering fields
employeeSchema.index({ Department: 1 });
employeeSchema.index({ JobRole: 1 });
employeeSchema.index({ Attrition: 1 });
employeeSchema.index({ RiskLevel: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
