const express = require('express');
const { 
  createBooking, 
  getBookings, 
  getBooking,
  updateBooking,
  updatePaymentStatus,
  resendPass,
  debugData
} = require('../controllers/bookingController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, authorize('Admin', 'Sales Staff'), createBooking);

router.get('/', auth, getBookings);
router.get('/:id/public', getBooking); // Public route for pass viewing
router.get('/:id', auth, getBooking);
router.put('/:id', auth, authorize('Admin'), updateBooking);
router.put('/:id/payment', auth, authorize('Admin', 'Sales Staff'), updatePaymentStatus);
router.post('/:id/resend', auth, authorize('Admin', 'Sales Staff'), resendPass);
router.get('/debug/data', debugData);

module.exports = router;