const express = require('express');
const { searchPass, markEntry, getEntryLogs, getGateBookings } = require('../controllers/gateController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/bookings', auth, authorize('Gate Staff', 'Admin', 'Sales Staff', 'Frontdesk'), getGateBookings);
router.post('/search', auth, authorize('Gate Staff', 'Admin', 'Sales Staff', 'Frontdesk'), searchPass);
router.post('/checkin', auth, authorize('Gate Staff', 'Admin', 'Sales Staff', 'Frontdesk'), markEntry);
router.get('/logs', auth, authorize('Admin'), getEntryLogs);

module.exports = router;