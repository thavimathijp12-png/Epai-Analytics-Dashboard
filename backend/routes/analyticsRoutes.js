const express = require('express');
const { getOverview, getDepartments, getRisk, getInsights, getChartData, getDataQuality } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/overview', protect, getOverview);
router.get('/departments', protect, getDepartments);
router.get('/risk', protect, getRisk);
router.get('/insights', protect, getInsights);
router.get('/charts', protect, getChartData); // Unified endpoint for charting
router.get('/data-quality', protect, getDataQuality);

module.exports = router;
