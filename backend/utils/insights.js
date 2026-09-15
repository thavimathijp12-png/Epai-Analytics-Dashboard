/**
 * Insights Engine
 * Generates automated plain-text insights based on data distributions
 */

const generateInsights = (data) => {
    if (!data || data.length === 0) return { insights: [], drivers: [], actions: [] };

    const insights = [];
    const drivers = [];
    const actions = [];
    
    // Overall Stats
    const attrRate = (data.filter(d => d.Attrition === 'Yes').length / data.length) * 100;
    
    // Overtime
    const otYes = data.filter(d => d.Overtime === 'Yes');
    const otAttr = otYes.length ? (otYes.filter(d => d.Attrition === 'Yes').length / otYes.length) * 100 : 0;
    
    // Dept Analysis
    const depts = [...new Set(data.map(d => d.Department))];
    let worstDept = {name: '', rate: 0};
    let bestPerfDept = {name: '', score: 0};
    
    depts.forEach(dept => {
        const dData = data.filter(d => d.Department === dept);
        if (dData.length === 0) return;
        const rate = (dData.filter(d => d.Attrition === 'Yes').length / dData.length) * 100;
        const perf = dData.reduce((s,d) => s + d.PerformanceRating, 0) / dData.length;
        if (rate > worstDept.rate) worstDept = { name: dept, rate };
        if (perf > bestPerfDept.score) bestPerfDept = { name: dept, score: perf };
    });

    // Generate Insights
    if (attrRate > 15) {
        insights.push(`Overall workforce attrition is elevated at ${attrRate.toFixed(1)}%. Immediate retention strategies are recommended.`);
    } else {
        insights.push(`Overall workforce health is stable with an attrition rate of ${attrRate.toFixed(1)}%.`);
    }

    if (otAttr > attrRate * 1.5 && otAttr > 0) {
        insights.push(`Employees working overtime show a significantly higher attrition risk (${otAttr.toFixed(1)}%).`);
        drivers.push(`Overtime Workload (Correlation: Strong)`);
        actions.push(`Review overtime distribution and assess workload allocation in high-stress roles.`);
    }
    
    const lowSatAttr = data.filter(d => d.JobSatisfaction <= 2);
    if (lowSatAttr.length && (lowSatAttr.filter(d => d.Attrition === 'Yes').length / lowSatAttr.length) * 100 > attrRate * 1.3) {
        insights.push(`Low job satisfaction is a leading indicator of turnover within the current filtered group.`);
        drivers.push(`Job Satisfaction (Correlation: Moderate-Strong)`);
        actions.push(`Conduct targeted employee engagement surveys to identify specific pain points.`);
    }

    if (worstDept.rate > attrRate + 5) {
        insights.push(`The ${worstDept.name} department has the highest attrition rate (${worstDept.rate.toFixed(1)}%) requiring focused attention.`);
        actions.push(`Initiate a department-level retention analysis for ${worstDept.name}.`);
    }
    
    if (bestPerfDept.name) {
        insights.push(`${bestPerfDept.name} demonstrates the strongest average performance score across the organization.`);
    }

    const promoGap = data.filter(d => d.YearsSinceLastPromotion > 4);
    if (promoGap.length && (promoGap.filter(d => d.Attrition === 'Yes').length / promoGap.length) * 100 > attrRate * 1.2) {
        drivers.push('Career Growth / Promotion Gaps');
        actions.push('Review career progression opportunities and establish clear promotion pathways.');
    }

    if(drivers.length === 0) drivers.push('No dominant statistical drivers identified in this slice.');
    if(actions.length === 0) actions.push('Continue monitoring baseline metrics.');

    return { insights, drivers, actions };
};

module.exports = { generateInsights };
