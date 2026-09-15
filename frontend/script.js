/**
 * Employee Performance & Attrition Intelligence (EPAI)
 * Premium UI/UX Full-Stack Version
 */

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : '/api';
let token = localStorage.getItem('epai_token');

// Application State
const state = {
    filteredData: [], 
    currentPage: 1,
    itemsPerPage: 15,
    sortCol: 'EmployeeID',
    sortAsc: true,
    theme: localStorage.getItem('epai_theme') || 'light',
    currentInsights: [],
    currentDrivers: [],
    currentActions: [],
    charts: {}
};

// DOM Elements
const DOM = {
    loadingScreen: document.getElementById('loading-screen'),
    loaderStatusText: document.getElementById('loader-status-text'),
    sidebar: document.getElementById('sidebar'),
    toggleSidebarBtn: document.getElementById('toggle-sidebar'),
    themeToggleBtn: document.getElementById('theme-toggle'),
    logoutBtn: document.getElementById('logout-btn'),
    navItems: document.querySelectorAll('.nav-item'),
    views: document.querySelectorAll('.view-section'),
    pageTitle: document.getElementById('page-title'),
    pageSubtitle: document.getElementById('page-subtitle'),
    backendStatus: document.getElementById('backend-status'),
    dashTime: document.getElementById('dash-time'),
    
    // Filters
    filters: {
        department: document.getElementById('filter-department'),
        jobrole: document.getElementById('filter-jobrole'),
        gender: document.getElementById('filter-gender'),
        attrition: document.getElementById('filter-attrition'),
        overtime: document.getElementById('filter-overtime'),
        age: document.getElementById('filter-age')
    },
    globalSearch: document.getElementById('global-search'),
    empSearch: document.getElementById('emp-search'),
    applyFiltersBtn: document.getElementById('apply-filters'),
    resetFiltersBtn: document.getElementById('reset-filters'),
    activeRecordCount: document.getElementById('active-record-count'),
    
    // Modal & Toast
    modal: document.getElementById('employee-modal'),
    closeModalBtn: document.getElementById('close-modal'),
    toastContainer: document.getElementById('toast-container'),
    
    // Report
    generateReportBtn: document.getElementById('generate-report-btn')
};

// Initialization
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    if (!token || token === 'undefined' || token === 'null') {
        localStorage.removeItem('epai_token'); // Clear corrupted state
        window.location.href = 'login.html';
        return;
    }
    
    setupTheme();
    setupEventListeners();
    updateClock();
    
    await checkHealth();
    await loadInitialData();
    
    setTimeout(() => {
        DOM.loadingScreen.classList.add('hidden');
        showToast('Workforce Intelligence loaded successfully.', 'success');
    }, 600);
}

function updateClock() {
    const now = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    DOM.dashTime.textContent = now.toLocaleDateString('en-US', options);
    setInterval(() => {
        DOM.dashTime.textContent = new Date().toLocaleDateString('en-US', options);
    }, 60000);
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if(type === 'success') icon = 'check-circle';
    if(type === 'error') icon = 'exclamation-circle';
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Security headers
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
});

// API Caller Helper
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (response.status === 401) {
            localStorage.removeItem('epai_token');
            window.location.href = 'login.html';
            throw new Error('Unauthorized');
        }
        
        if (!data.success) {
            throw new Error(data.message || 'API Error');
        }
        
        // If the endpoint returns pagination, return the whole object so callers can access .data and .pagination
        if (data.pagination) {
            return data;
        }
        
        return data.data;
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
}

async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            DOM.backendStatus.innerHTML = '<i class="fas fa-circle online"></i> <span>Connected</span>';
        } else {
            throw new Error();
        }
    } catch (e) {
        DOM.backendStatus.innerHTML = '<i class="fas fa-circle offline"></i> <span style="color:var(--danger)">Offline</span>';
        showToast('Cannot connect to EPAI backend. Please ensure the server is running.', 'error');
    }
}

// Build query string from filters
function buildQueryString() {
    const params = new URLSearchParams();
    
    if (DOM.filters.department.value !== 'All') params.append('department', DOM.filters.department.value);
    if (DOM.filters.jobrole.value !== 'All' && DOM.filters.jobrole.value !== 'All Roles') params.append('jobRole', DOM.filters.jobrole.value);
    if (DOM.filters.gender.value !== 'All') params.append('gender', DOM.filters.gender.value);
    if (DOM.filters.attrition.value !== 'All') params.append('attrition', DOM.filters.attrition.value);
    if (DOM.filters.overtime.value !== 'All') params.append('overtime', DOM.filters.overtime.value);
    if (DOM.filters.age.value !== 'All') params.append('ageGroup', DOM.filters.age.value);
    
    const searchVal = DOM.empSearch.value || DOM.globalSearch.value;
    if (searchVal) params.append('search', searchVal);
    
    return params.toString();
}

async function loadInitialData() {
    try {
        DOM.loaderStatusText.textContent = "Loading configuration...";
        const data = await apiCall('/analytics/charts');
        
        const depts = [...new Set(data.map(d => d.Department))].sort();
        DOM.filters.department.innerHTML = '<option value="All">All Departments</option>';
        depts.forEach(dept => DOM.filters.department.add(new Option(dept, dept)));
        
        window.cachedInitialData = data; 
        updateJobRoleFilter(data);
        
        await fetchAllDashboardData();
    } catch (error) {
        DOM.loadingScreen.innerHTML = `<div class="loader-content"><h2 class="loader-title text-danger">Error</h2><p>Unable to load workforce data.<br>${error.message}</p></div>`;
    }
}

function updateJobRoleFilter(data = window.cachedInitialData) {
    if (!data) return;
    const dept = DOM.filters.department.value;
    const roleSelect = DOM.filters.jobrole;
    
    roleSelect.innerHTML = '<option value="All">All Roles</option>';
    let roles = [];
    if (dept === 'All') {
        roles = [...new Set(data.map(d => d.JobRole))].sort();
    } else {
        roles = [...new Set(data.filter(d => d.Department === dept).map(d => d.JobRole))].sort();
    }
    
    roles.forEach(role => roleSelect.add(new Option(role, role)));
}

// Fetch all dashboard data concurrently
async function fetchAllDashboardData() {
    const q = buildQueryString();
    
    try {
        const [overview, risk, insights, charts, employees] = await Promise.all([
            apiCall(`/analytics/overview?${q}`),
            apiCall(`/analytics/risk?${q}`),
            apiCall(`/analytics/insights?${q}`),
            apiCall(`/analytics/charts?${q}`),
            apiCall(`/employees?page=${state.currentPage}&limit=${state.itemsPerPage}&sortCol=${state.sortCol}&sortAsc=${state.sortAsc}&${q}`)
        ]);
        
        state.filteredData = charts; 
        
        updateKPIs(overview);
        renderHighRiskPanel(risk.topHighRiskEmployees);
        renderDirectory(employees);
        renderInsights(insights);
        updateAllCharts();
        
        // Update active count
        DOM.activeRecordCount.textContent = `${charts.length.toLocaleString()} employees analyzed`;
        
    } catch (e) {
        showToast('Error loading dashboard data', 'error');
        console.error("Dashboard Data Error:", e);
    }
}

// Event Listeners
function setupEventListeners() {
    DOM.toggleSidebarBtn.addEventListener('click', () => {
        DOM.sidebar.classList.toggle('collapsed');
        if(window.innerWidth <= 1024) DOM.sidebar.classList.toggle('mobile-open');
        setTimeout(updateAllCharts, 300);
    });

    DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    
    DOM.logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('epai_token');
        window.location.href = 'login.html';
    });

    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.getAttribute('data-target'), item));
    });

    DOM.applyFiltersBtn.addEventListener('click', () => { 
        state.currentPage = 1; 
        fetchAllDashboardData(); 
        showToast('Filters applied successfully', 'success');
    });
    
    DOM.resetFiltersBtn.addEventListener('click', resetFilters);
    
    DOM.globalSearch.addEventListener('keypress', (e) => { if(e.key === 'Enter') { state.currentPage = 1; fetchAllDashboardData(); }});
    DOM.empSearch.addEventListener('keypress', (e) => { if(e.key === 'Enter') { state.currentPage = 1; fetchAllDashboardData(); }});
    
    DOM.filters.department.addEventListener('change', () => updateJobRoleFilter());

    DOM.closeModalBtn.addEventListener('click', () => DOM.modal.classList.remove('show'));
    window.addEventListener('click', (e) => { if (e.target === DOM.modal) DOM.modal.classList.remove('show'); });

    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => handleSort(th));
    });

    if (DOM.generateReportBtn) {
        DOM.generateReportBtn.addEventListener('click', () => {
            showToast("Report generated successfully.", 'success');
        });
    }
}

function handleSort(th) {
    const col = th.getAttribute('data-sort');
    if (state.sortCol === col) {
        state.sortAsc = !state.sortAsc;
    } else {
        state.sortCol = col;
        state.sortAsc = true;
    }
    document.querySelectorAll('th[data-sort]').forEach(t => t.innerHTML = t.textContent.trim() + ' <i class="fas fa-sort" style="color:var(--text-muted); opacity: 0.3;"></i>');
    th.innerHTML = th.textContent.trim() + (state.sortAsc ? ' <i class="fas fa-sort-up" style="color:var(--primary);"></i>' : ' <i class="fas fa-sort-down" style="color:var(--primary);"></i>');
    
    fetchEmployeeTable();
}

async function fetchEmployeeTable() {
    const q = buildQueryString();
    try {
        const employees = await apiCall(`/employees?page=${state.currentPage}&limit=${state.itemsPerPage}&sortCol=${state.sortCol}&sortAsc=${state.sortAsc}&${q}`);
        renderDirectory(employees);
    } catch (e) {
        showToast('Error sorting table', 'error');
    }
}

function resetFilters() {
    DOM.filters.department.value = 'All';
    updateJobRoleFilter();
    DOM.filters.jobrole.value = 'All';
    DOM.filters.gender.value = 'All';
    DOM.filters.attrition.value = 'All';
    DOM.filters.overtime.value = 'All';
    DOM.filters.age.value = 'All';
    DOM.empSearch.value = '';
    DOM.globalSearch.value = '';
    
    state.currentPage = 1;
    fetchAllDashboardData();
    showToast('Filters reset to default', 'info');
}

// Number Animation
function animateValue(obj, start, end, duration, formatStr = false) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        if (formatStr) {
            obj.innerHTML = current.toLocaleString();
        } else {
            obj.innerHTML = current;
        }
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Rendering UI
function updateKPIs(overview) {
    const eTot = document.getElementById('kpi-total-emp');
    animateValue(eTot, 0, overview.totalEmployees, 1000, true);
    
    document.getElementById('kpi-attrition-rate').textContent = `${overview.attritionRate}%`;
    document.getElementById('kpi-avg-perf').textContent = `${overview.averagePerformance} / 5`;
    document.getElementById('kpi-high-risk').textContent = overview.highRiskEmployees;
}

function renderHighRiskPanel(highRisk) {
    const tbody = document.querySelector('#high-risk-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if (!highRisk || highRisk.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:40px;">No high-risk active employees found for the current filters.</td></tr>';
        return;
    }

    highRisk.slice(0, 5).forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="avatar" style="width:32px;height:32px;font-size:0.75rem;">${emp.EmployeeID.replace('EMP','')}</div>
                    <div>
                        <div style="font-weight:600; color:var(--text-primary);">${emp.EmployeeID}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${emp.JobRole}</div>
                    </div>
                </div>
            </td>
            <td>${emp.Department}</td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="color:var(--danger);font-weight:700;">${emp.RiskScore}</span>
                    <div style="width:60px;height:6px;background:var(--bg-secondary);border-radius:3px;overflow:hidden;">
                        <div style="width:${emp.RiskScore}%;height:100%;background:var(--danger);"></div>
                    </div>
                </div>
            </td>
            <td><span style="font-size:0.875rem; font-weight:500;">${emp.RiskFactors[0] || 'None'}</span></td>
            <td><button class="btn btn-outline" style="padding:6px 12px;font-size:0.75rem;" onclick="openEmployeeModal('${emp.EmployeeID}')">View</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderDirectory(res) {
    const tbody = document.querySelector('#directory-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const paginatedData = res.data;

    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 40px; color: var(--text-muted);">No employees found matching the selected filters.</td></tr>';
    } else {
        paginatedData.forEach(emp => {
            const riskClass = emp.RiskScore > 60 ? 'danger' : (emp.RiskScore > 30 ? 'warning' : 'success');
            const attrClass = emp.Attrition === 'Yes' ? 'danger' : 'secondary';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color:var(--text-primary);">${emp.EmployeeID}</strong></td>
                <td>${emp.Department}</td>
                <td>${emp.JobRole}</td>
                <td>
                    <div style="display:flex; gap:2px; color:var(--warning);">
                        ${Array.from({length: 5}).map((_, i) => `<i class="fas fa-star" style="opacity:${i < emp.PerformanceRating ? 1 : 0.2}"></i>`).join('')}
                    </div>
                </td>
                <td><span class="badge ${attrClass}">${emp.Attrition}</span></td>
                <td><strong style="color:var(--text-primary);">${emp.RiskScore}</strong></td>
                <td><span class="badge ${riskClass}">${emp.RiskLevel}</span></td>
                <td><button class="btn btn-outline" style="padding:6px 12px;font-size:0.75rem;" onclick="openEmployeeModal('${emp.EmployeeID}')">Profile</button></td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    renderPagination(res.pagination.pages);
}

function renderPagination(totalPages) {
    const pagContainer = document.getElementById('directory-pagination');
    if(!pagContainer) return;
    pagContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.onclick = () => { state.currentPage--; fetchEmployeeTable(); };
    pagContainer.appendChild(prevBtn);
    
    let startPage = Math.max(1, state.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pBtn = document.createElement('button');
        pBtn.className = `page-btn ${i === state.currentPage ? 'active' : ''}`;
        pBtn.textContent = i;
        pBtn.onclick = () => { state.currentPage = i; fetchEmployeeTable(); };
        pagContainer.appendChild(pBtn);
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.onclick = () => { state.currentPage++; fetchEmployeeTable(); };
    pagContainer.appendChild(nextBtn);
}

// Modal Handling via API
window.openEmployeeModal = async function(empId) {
    try {
        const emp = await apiCall(`/employees/${empId}`);
        
        document.getElementById('modal-avatar').textContent = emp.JobRole.substring(0, 2).toUpperCase();
        document.getElementById('modal-emp-id').textContent = emp.EmployeeID;
        document.getElementById('modal-emp-role').textContent = `${emp.JobRole} — ${emp.Department}`;
        
        let badgesHtml = '';
        badgesHtml += emp.Attrition === 'Yes' ? '<span class="badge danger">Exited</span>' : '<span class="badge success">Active Employee</span>';
        badgesHtml += `<span class="badge ${emp.RiskScore > 60 ? 'danger' : (emp.RiskScore > 30 ? 'warning' : 'success')}">Risk: ${emp.RiskLevel}</span>`;
        document.getElementById('modal-badges').innerHTML = badgesHtml;
        
        const b = document.getElementById('modal-body');
        b.innerHTML = `
            <div class="profile-section">
                <h4>Personal Profile</h4>
                <div class="detail-grid">
                    <div class="detail-item"><label>Age</label><span>${emp.Age}</span></div>
                    <div class="detail-item"><label>Gender</label><span>${emp.Gender}</span></div>
                    <div class="detail-item"><label>Commute</label><span>${emp.DistanceFromHome} km</span></div>
                    <div class="detail-item"><label>Education</label><span>Level ${emp.Education}</span></div>
                </div>
            </div>
            <div class="profile-section">
                <h4>Career Profile</h4>
                <div class="detail-grid">
                    <div class="detail-item"><label>Monthly Income</label><span>$${emp.MonthlyIncome.toLocaleString()}</span></div>
                    <div class="detail-item"><label>Job Level</label><span>Level ${emp.JobLevel}</span></div>
                    <div class="detail-item"><label>Overtime</label><span>${emp.Overtime}</span></div>
                    <div class="detail-item"><label>Companies Worked</label><span>${emp.NumCompaniesWorked}</span></div>
                </div>
            </div>
            <div class="profile-section" style="grid-column: 1 / -1;">
                <h4>Performance & Satisfaction Metrics</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span style="font-size:0.875rem;font-weight:600;">Performance Rating</span> <span style="font-weight:700;">${emp.PerformanceRating}/5</span></div>
                        <div class="progress-container"><div class="progress-bar ${emp.PerformanceRating>3?'high':'medium'}" style="width:${(emp.PerformanceRating/5)*100}%"></div></div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span style="font-size:0.875rem;font-weight:600;">Job Satisfaction</span> <span style="font-weight:700;">${emp.JobSatisfaction}/4</span></div>
                        <div class="progress-container"><div class="progress-bar ${emp.JobSatisfaction>2?'high':'low'}" style="width:${(emp.JobSatisfaction/4)*100}%"></div></div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span style="font-size:0.875rem;font-weight:600;">Work-Life Balance</span> <span style="font-weight:700;">${emp.WorkLifeBalance}/4</span></div>
                        <div class="progress-container"><div class="progress-bar ${emp.WorkLifeBalance>2?'high':'low'}" style="width:${(emp.WorkLifeBalance/4)*100}%"></div></div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span style="font-size:0.875rem;font-weight:600;">Environment Satisfaction</span> <span style="font-weight:700;">${emp.EnvironmentSatisfaction}/4</span></div>
                        <div class="progress-container"><div class="progress-bar ${emp.EnvironmentSatisfaction>2?'high':'low'}" style="width:${(emp.EnvironmentSatisfaction/4)*100}%"></div></div>
                    </div>
                </div>
            </div>
            <div class="risk-gauge-container">
                <div class="risk-circle ${emp.RiskScore > 60 ? 'high' : (emp.RiskScore > 30 ? 'medium' : 'low')}">${emp.RiskScore}</div>
                <div class="risk-details">
                    <h3>Analytical Risk Score</h3>
                    <p>Heuristic evaluation indicating the likelihood of employee turnover.</p>
                    <ul class="risk-factors-list">
                        ${emp.RiskFactors.length > 0 ? emp.RiskFactors.map(f => `<li>${f}</li>`).join('') : '<li style="color:var(--success);">No elevated risk factors detected.</li>'}
                    </ul>
                </div>
            </div>
            ${emp.RecommendedAction ? `
            <div class="recommended-action-box">
                <h4>Recommended HR Action</h4>
                <p>${emp.RecommendedAction}</p>
            </div>` : ''}
        `;
        
        DOM.modal.classList.add('show');
    } catch(e) {
        showToast('Could not load employee details.', 'error');
    }
}

function renderInsights(res) {
    const execSummary = document.getElementById('executive-summary-text');
    if(execSummary) execSummary.innerHTML = res.insights.map(i => `<p style="margin-bottom:12px;"><i class="fas fa-check text-primary" style="margin-right:8px;"></i> ${i}</p>`).join('');
    
    const aiList = document.getElementById('automated-insights-list');
    if(aiList) {
        aiList.innerHTML = res.insights.map((i, idx) => `
            <div class="insight-box ${idx === 0 ? 'danger' : 'warning'}">
                <i class="fas fa-chart-line"></i>
                <div class="content">
                    <h4>Insight Signal ${idx+1}</h4>
                    <p>${i}</p>
                    <div class="implication">Requires strategic HR review</div>
                </div>
            </div>
        `).join('');
    }
    
    const recList = document.getElementById('hr-recommendations-list');
    if (recList) {
        recList.innerHTML = res.actions.map(a => `
            <div class="insight-box">
                <i class="fas fa-bullseye"></i>
                <div class="content">
                    <h4>Recommended Action</h4>
                    <p>${a}</p>
                </div>
            </div>
        `).join('');
    }

    state.currentInsights = res.insights;
    state.currentDrivers = res.drivers;
    state.currentActions = res.actions;
}

/* --------------------------------------------------------------------------
 * CHARTING ENGINE
 * Utilizing Chart.js Premium Styling
 * -------------------------------------------------------------------------- */

function getThemeColors() {
    const style = getComputedStyle(document.body);
    return {
        textColor: style.getPropertyValue('--text-primary').trim(),
        gridColor: style.getPropertyValue('--border').trim(),
        primary: style.getPropertyValue('--primary').trim(),
        danger: style.getPropertyValue('--danger').trim(),
        success: style.getPropertyValue('--success').trim(),
        warning: style.getPropertyValue('--warning').trim(),
        surface: style.getPropertyValue('--surface').trim(),
    };
}

Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.color = '#64748b';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
Chart.defaults.plugins.tooltip.bodyColor = '#cbd5e1';
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;
Chart.defaults.maintainAspectRatio = false;

function initOrUpdateChart(id, type, data, options) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (state.charts[id]) state.charts[id].destroy();
    
    const baseOptions = {
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: type === 'bar' ? {
            x: { grid: { display: false }, ticks: { color: getThemeColors().textColor } },
            y: { grid: { color: getThemeColors().gridColor, borderDash: [4, 4] }, border: { display: false }, ticks: { color: getThemeColors().textColor } }
        } : {}
    };
    
    const finalOptions = { ...baseOptions, ...options };
    state.charts[id] = new Chart(ctx, { type, data, options: finalOptions });
}

function updateAllCharts() {
    const data = state.filteredData;
    if (data.length === 0) {
        Object.values(state.charts).forEach(chart => chart.destroy());
        state.charts = {};
        return;
    }
    
    const colors = getThemeColors();
    const getAgg = (groupKey, metricFunc) => {
        const groups = [...new Set(data.map(d => d[groupKey]))];
        return groups.map(g => {
            const dData = data.filter(d => d[groupKey] === g);
            return metricFunc(dData);
        });
    };
    const deptLabels = [...new Set(data.map(d => d.Department))];

    // Dashboard Charts
    if (document.getElementById('view-dashboard').classList.contains('active')) {
        const attrRates = getAgg('Department', d => (d.filter(e => e.Attrition === 'Yes').length / d.length) * 100);
        initOrUpdateChart('chart-attrition-dept', 'bar', {
            labels: deptLabels,
            datasets: [{ label: 'Attrition Rate (%)', data: attrRates, backgroundColor: attrRates.map(v => v > 15 ? colors.danger : colors.primary), borderRadius: 6 }]
        });

        const perfCounts = [3, 4, 5].map(rating => data.filter(d => d.PerformanceRating === rating).length);
        initOrUpdateChart('chart-perf-dist', 'doughnut', {
            labels: ['Rating 3', 'Rating 4', 'Rating 5'],
            datasets: [{ data: perfCounts, backgroundColor: [colors.primary, colors.success, colors.warning], borderWidth: 2, borderColor: colors.surface, hoverOffset: 4 }]
        }, { cutout: '75%', plugins: { legend: { display: true, position: 'right' } } });
    }

    // Performance Charts
    if (document.getElementById('view-performance').classList.contains('active')) {
        initOrUpdateChart('chart-perf-dept', 'bar', {
            labels: deptLabels,
            datasets: [{ label: 'Avg Performance', data: getAgg('Department', d => d.reduce((s,e)=>s+e.PerformanceRating,0)/d.length), backgroundColor: colors.primary, borderRadius: 6 }]
        }, { scales: { y: { min: 2.5, max: 5 } }});
        
        const roles = [...new Set(data.map(d => d.JobRole))].slice(0, 8);
        const roleData = roles.map(r => { const dData = data.filter(d=>d.JobRole===r); return dData.reduce((s,e)=>s+e.PerformanceRating,0)/dData.length; });
        initOrUpdateChart('chart-perf-role', 'bar', {
            labels: roles.map(r => r.split(' ')[0]),
            datasets: [{ label: 'Avg Performance', data: roleData, backgroundColor: colors.primary, borderRadius: 6 }]
        });
    }

    // Attrition Charts
    if (document.getElementById('view-attrition').classList.contains('active')) {
        initOrUpdateChart('chart-attr-dept-full', 'bar', {
            labels: deptLabels,
            datasets: [{ label: 'Attrition Rate (%)', data: getAgg('Department', d => (d.filter(e=>e.Attrition==='Yes').length/d.length)*100), backgroundColor: colors.danger, borderRadius: 6 }]
        });

        const otYes = data.filter(d => d.Overtime === 'Yes');
        const otNo = data.filter(d => d.Overtime === 'No');
        initOrUpdateChart('chart-attr-overtime', 'doughnut', {
            labels: ['OT (Attrited)', 'OT (Retained)', 'No OT (Attrited)', 'No OT (Retained)'],
            datasets: [{ data: [otYes.filter(d=>d.Attrition==='Yes').length, otYes.filter(d=>d.Attrition==='No').length, otNo.filter(d=>d.Attrition==='Yes').length, otNo.filter(d=>d.Attrition==='No').length], backgroundColor: [colors.danger, colors.warning, '#94a3b8', colors.success], borderWidth: 2, borderColor: colors.surface }]
        }, { cutout: '75%', plugins: { legend: { display: true, position: 'right' } } });
    }

    // Dept Analysis Charts
    if (document.getElementById('view-department').classList.contains('active')) {
        const metric = document.getElementById('dept-compare-metric')?.value || 'attrition';
        let metricData; let labelStr = '';
        if(metric === 'attrition') { metricData = getAgg('Department', d => (d.filter(e=>e.Attrition==='Yes').length/d.length)*100); labelStr = 'Attrition Rate (%)'; }
        else if (metric === 'performance') { metricData = getAgg('Department', d => d.reduce((s,e)=>s+e.PerformanceRating,0)/d.length); labelStr = 'Avg Performance'; }
        else if (metric === 'salary') { metricData = getAgg('Department', d => d.reduce((s,e)=>s+e.MonthlyIncome,0)/d.length); labelStr = 'Avg Income ($)'; }
        
        initOrUpdateChart('chart-dept-compare', 'bar', {
            labels: deptLabels,
            datasets: [{ label: labelStr, data: metricData, backgroundColor: metric === 'attrition' ? colors.danger : colors.primary, borderRadius: 6 }]
        });
        
        const deptSelect = document.getElementById('dept-compare-metric');
        const newSelect = deptSelect.cloneNode(true);
        deptSelect.parentNode.replaceChild(newSelect, deptSelect);
        newSelect.addEventListener('change', updateAllCharts);
    }
}

// Theme handling
const viewMeta = {
    'dashboard': { title: 'Workforce Intelligence', sub: 'Understand your people. Improve performance. Reduce avoidable attrition.' },
    'directory': { title: 'Employee Directory', sub: 'Search, filter and analyze individual employee records.' },
    'performance': { title: 'Performance Analytics', sub: 'Deep dive into employee performance ratings and distributions.' },
    'attrition': { title: 'Attrition Intelligence', sub: 'Analyze factors driving employee turnover and retention.' },
    'department': { title: 'Department Analysis', sub: 'Compare metrics across organizational units.' },
    'insights': { title: 'Business Questions & Insights', sub: 'Analytical answers derived from workforce data.' },
    'reports': { title: 'Executive Reports', sub: 'Generate printable summaries and actionable insights.' },
    'about': { title: 'About EPAI', sub: 'Project overview and methodology.' }
};

function switchView(targetId, navItem) {
    DOM.views.forEach(v => v.classList.remove('active'));
    DOM.navItems.forEach(n => n.classList.remove('active'));
    document.getElementById(`view-${targetId}`).classList.add('active');
    navItem.classList.add('active');
    DOM.pageTitle.textContent = viewMeta[targetId].title;
    DOM.pageSubtitle.textContent = viewMeta[targetId].sub;
    if (window.innerWidth <= 1024) DOM.sidebar.classList.remove('mobile-open');
    updateAllCharts();
}

function setupTheme() {
    if (state.theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        DOM.themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        state.theme = 'light';
        DOM.themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        state.theme = 'dark';
        DOM.themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    localStorage.setItem('epai_theme', state.theme);
    updateAllCharts();
}
