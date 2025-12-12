const express = require('express');
const { 
  createBooking, 
  getBookings, 
  getBooking,
  updateBooking,
  updatePaymentStatus,
  resendPass
} = require('../controllers/bookingController');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Log all requests
router.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

router.post('/', auth, authorize('Admin', 'Sales Staff'), createBooking);
router.post('/force', async (req, res) => {
  try {
    console.log('FORCE ROUTE - Creating booking:', req.body);
    
    const Booking = require('../models/Booking');
    const PassType = require('../models/PassType');
    
    // Get pass type info if provided
    let passTypeName = 'Pass';
    let passTypePrice = 100;
    
    if (req.body.pass_type_id) {
      try {
        const passType = await PassType.findById(req.body.pass_type_id);
        if (passType) {
          passTypeName = passType.name;
          passTypePrice = passType.price;
        }
      } catch (e) {
        console.log('PassType not found, using defaults');
      }
    }
    
    const bookingData = {
      buyer_name: req.body.buyer_name || 'Test User',
      buyer_phone: req.body.buyer_phone || '1234567890',
      passes: [{
        pass_type_id: req.body.pass_type_id || new require('mongoose').Types.ObjectId(),
        pass_type_name: passTypeName,
        pass_type_price: passTypePrice,
        people_count: parseInt(req.body.total_people) || 1,
        pass_holders: req.body.pass_holders || [],
        people_entered: 0
      }],
      total_passes: 1,
      total_people: parseInt(req.body.total_people) || 1,
      payment_mode: req.body.payment_mode || 'Cash',
      payment_status: req.body.mark_as_paid ? 'Paid' : 'Pending',
      notes: req.body.notes || 'Test booking'
    };
    
    const booking = await Booking.create(bookingData);
    console.log('Booking created:', booking._id);
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Force booking error:', error);
    res.status(500).json({ message: error.message });
  }
});
router.get('/', auth, getBookings);
router.get('/:id/public', getBooking); // Public route for pass viewing
router.get('/:id', auth, getBooking);
router.put('/:id', auth, authorize('Admin'), updateBooking);
router.put('/:id/payment', auth, authorize('Admin', 'Sales Staff'), updatePaymentStatus);
router.post('/:id/resend', auth, authorize('Admin', 'Sales Staff'), resendPass);

module.exports = router;