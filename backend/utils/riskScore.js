/**
 * Analytical Risk Score Engine
 * Calculates a heuristic risk score based on employee data.
 * IMPORTANT: This is NOT a scientifically validated machine learning model.
 */

const calculateRiskScore = (emp) => {
    let score = 0;
    const reasons = [];
    const actions = [];

    // Negative factors
    if (emp.Overtime === 'Yes') {
        score += 25;
        reasons.push("Frequent overtime");
        actions.push("Review workload allocation");
    }
    if (emp.JobSatisfaction <= 2) {
        score += 20;
        reasons.push("Low job satisfaction");
        actions.push("Conduct 1-on-1 engagement meeting");
    }
    if (emp.WorkLifeBalance <= 2) {
        score += 15;
        reasons.push("Poor work-life balance");
        if(!actions.includes("Review workload allocation")) actions.push("Evaluate flexible working options");
    }
    if (emp.YearsSinceLastPromotion > 4) {
        score += 15;
        reasons.push("No recent promotion");
        actions.push("Review career progression pathway");
    }
    if (emp.MonthlyIncome < (emp.JobLevel * 2200)) { 
        score += 10;
        reasons.push("Income below level average");
        actions.push("Conduct compensation review");
    }
    if (emp.DistanceFromHome > 15) {
        score += 10;
        reasons.push("Long commute distance");
    }
    if (emp.JobInvolvement <= 2) {
        score += 10;
        reasons.push("Low job involvement");
    }

    // Mitigating factors
    if (emp.JobSatisfaction >= 3) score -= 10;
    if (emp.WorkLifeBalance >= 3) score -= 10;
    if (emp.PerformanceRating >= 4) score -= 10;
    if (emp.YearsSinceLastPromotion <= 2) score -= 10;

    score = Math.max(0, Math.min(100, score));

    let level = 'LOW RISK';
    if (score > 60) level = 'HIGH RISK';
    else if (score > 30) level = 'MEDIUM RISK';

    if (actions.length === 0) actions.push("Standard check-in");
    
    return { 
        RiskScore: score, 
        RiskLevel: level, 
        RiskFactors: reasons, 
        RecommendedAction: actions[0] 
    };
};

module.exports = { calculateRiskScore };
