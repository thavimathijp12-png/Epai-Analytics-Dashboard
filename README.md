# EPAI - Employee Performance & Attrition Intelligence

**Turn Employee Data Into Actionable Intelligence.**

A complete Full-Stack Data Analytics Application designed to empower HR teams with deep insights into workforce performance, attrition drivers, and organizational health.

---

## 📖 Project Overview

Employee turnover and suboptimal performance are critical challenges for modern enterprises. **EPAI** (Employee Performance & Attrition Intelligence) is a robust full-stack solution that ingests workforce data, performs automated statistical analytics, evaluates attrition risk, and presents actionable intelligence through a dynamic, professional dashboard. 

This project demonstrates an end-to-end data pipeline from raw storage (MongoDB) to a RESTful API layer (Node.js/Express) and finally to a data-rich presentation layer (Vanilla JS, Chart.js, HTML/CSS).

---

## 🎯 Business Problem & Objectives

**Problem:** HR professionals often have data scattered across spreadsheets and lack the analytical capability to identify underlying trends causing attrition or hindering performance. 

**Objectives:**
- Centralize workforce data into a secure NoSQL database.
- Provide a responsive, accessible dashboard to visualize key performance indicators (KPIs).
- Dynamically analyze data slices to uncover statistical correlations (e.g., overtime vs. attrition).
- Algorithmically flag high-risk employees before they leave.
- Generate automated business insights and recommended HR actions.

---

## 🏗️ Architecture

```
User
  ↓
Frontend (HTML + CSS + JavaScript + Chart.js)
  ↓
REST API Layer (JWT Secured)
  ↓
Backend (Node.js + Express)
  ↓
Analytics Engine (Data Aggregation & Risk Scoring)
  ↓
Database (MongoDB)
```

1. **Frontend:** A Single Page Application (SPA) that acts as the presentation layer. It dynamically requests data from the backend APIs based on global filter states.
2. **Backend Engine:** Processes complex data slicing, calculates heuristic risk scores, and generates automated insights.
3. **Database:** Stores 1,200+ employee records and authenticates admin users.

---

## 🛠️ Technology Stack

**Frontend:**
- HTML5 (Semantic & Accessible)
- CSS3 (Vanilla, CSS Variables, Dark Mode, Print Media Queries)
- Vanilla JavaScript (ES6+ Fetch API, DOM Manipulation)
- Chart.js (Data Visualization)

**Backend:**
- Node.js & Express.js
- Mongoose (MongoDB Object Modeling)

**Security & Utilities:**
- JSON Web Tokens (JWT) for secure routing
- bcryptjs for password hashing
- cors & dotenv

---

## 🚀 Key Features

- **Global Filtering System:** Slice data across 6 dimensions instantly across all charts.
- **Analytical Risk Scoring:** A heuristic engine evaluating 10+ factors to flag "High Risk" employees.
- **Automated Insights:** Textual business intelligence automatically generated based on the statistical distribution of the active filter slice.
- **Executive Reporting:** CSS `@media print` layout instantly converts the dashboard into a clean, PDF-ready executive summary.
- **Dark/Light Mode:** Persistent theme toggling tailored for long viewing sessions.
- **Secure Authentication:** JWT-protected endpoints and a secure Admin login gateway.

---

## 📚 API Documentation

The backend exposes a secure RESTful API under `/api`. All endpoints (except login) require a Bearer token.

### Authentication
- `POST /api/auth/login` - Authenticate admin and return JWT.

### Employees
- `GET /api/employees` - Retrieve paginated, sortable, and filterable employee records.
- `GET /api/employees/:id` - Retrieve complete profile for a single employee.
- `POST /api/employees` - Add a new employee (auto-calculates risk score).
- `PUT /api/employees/:id` - Update an employee record.
- `DELETE /api/employees/:id` - Remove an employee.

### Analytics
- `GET /api/analytics/overview` - Core KPIs (Total, Attrition Rate, Avg Income).
- `GET /api/analytics/departments` - Aggregated metrics grouped by department.
- `GET /api/analytics/risk` - Distribution of risk levels and top high-risk employees.
- `GET /api/analytics/insights` - Automatically generated textual business insights.
- `GET /api/analytics/charts` - Unified endpoint delivering filtered slices for Chart.js rendering.
- `GET /api/analytics/data-quality` - Database health metrics.

---

## 🚀 Quick Start (Local Development)

Follow these instructions to run the full-stack application on your local machine.

### 1. Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (Running locally on `mongodb://127.0.0.1:27017` or via MongoDB Atlas)

### 2. Setup
Open a terminal in the `backend/` directory:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (Windows)
copy .env.example .env

# (Mac/Linux users: cp .env.example .env)

# 3. Seed the database (Creates demo admin and 1200 employees)
npm run seed

# 4. Start the Express server
npm start
```
*The backend will run on `http://localhost:5000` and automatically serve the frontend.*

Navigate to `http://localhost:5000/login.html` in your browser.

### 🔑 Demo Credentials
- **Email:** admin@epai.com
- **Password:** password123

---

## ☁️ Deployment Guide

The EPAI dashboard is completely deployment-ready for standard Node.js hosting providers (like Render, Heroku, or DigitalOcean). 

The backend has been configured to **serve the frontend static files automatically**, meaning you can deploy the entire application as a single unified service.

### 1. Environment Variables Required in Production

When deploying to a cloud host, ensure you set the following environment variables in your hosting provider's dashboard:

| Variable | Description |
|---|---|
| `MONGODB_URI` | Your production MongoDB connection string (e.g. from MongoDB Atlas). |
| `JWT_SECRET` | A secure, random string used to sign authentication tokens. |
| `PORT` | Most hosts (like Render) inject this automatically. Defaults to 5000. |
| `FRONTEND_URL` | *(Optional)* If deploying frontend and backend separately, set this to your frontend URL to configure CORS securely. |

### 2. Deploying as a Unified Service (Recommended)

This is the easiest method. Both frontend and backend are hosted together.

1. Create a new "Web Service" on Render or Heroku.
2. Connect your GitHub repository.
3. **Build Command:** `cd backend && npm install`
4. **Start Command:** `cd backend && npm start`
5. Add your `MONGODB_URI` and `JWT_SECRET` as environment variables.
6. Deploy! Your app will be live at `https://your-app-name.onrender.com`.

### 3. Deploying as Split Services (Advanced)

If you prefer to host the frontend on a static host (like Netlify or Vercel) and the backend on Render:

1. **Deploy Backend:** Follow the steps above, but add the `FRONTEND_URL` environment variable (e.g. `https://your-frontend.netlify.app`).
2. **Deploy Frontend:**
   - In your frontend code, edit `frontend/config.js`.
   - Set `window.ENV_API_URL = "https://your-backend.onrender.com/api";`.
   - Deploy the `frontend/` folder to Netlify/Vercel.

---

## 📊 Analytics Methodology (Disclaimer)

**Risk Score Engine:** The "Analytical Attrition Risk Score" is a heuristic algorithm developed using weighted HR assumptions (e.g., Low Satisfaction + High Overtime = Elevated Risk). **It is NOT a scientifically validated Machine Learning model.** It serves as a programmatic analytical flag to direct HR attention, rather than a predictive certainty.

## 🔮 Future Enhancements
- **Machine Learning Integration:** Replace the heuristic risk score with an actual trained predictive model (e.g., Random Forest or XGBoost).
- **CSV Bulk Import:** Implement a frontend UI to allow HR admins to upload new datasets directly.
- **Historical Tracking:** Track employee metrics over time rather than a single static snapshot.

---
*Created as a comprehensive Data Analytics portfolio project to demonstrate Full-Stack Engineering, Data Pipeline architecture, and Business Intelligence capabilities.*
