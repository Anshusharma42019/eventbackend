const express = require('express');
const { getDashboardStats, getDetailedReport, exportData } = require('../controllers/reportsController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', auth, authorize('Admin'), getDashboardStats);
router.get('/detailed', auth, authorize('Admin'), getDetailedReport);
router.get('/export', auth, authorize('Admin'), exportData);

module.exports = router;