const Booking = require('../models/Booking');
const PassType = require('../models/PassType');

exports.createBooking = async (req, res) => {
  try {
    console.log('=== BOOKING REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Body keys:', Object.keys(req.body));
    console.log('========================');

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'No data received' });
    }

    if (!req.body.buyer_name) {
      return res.status(400).json({ message: 'Buyer name required' });
    }

    const bookingData = {
      buyer_name: req.body.buyer_name || 'Test User',
      buyer_phone: req.body.buyer_phone || '1234567890',
      passes: [{
        pass_type_id: new require('mongoose').Types.ObjectId(),
        pass_type_name: 'Test Pass',
        pass_type_price: 100,
        people_count: parseInt(req.body.total_people) || 1,
        pass_holders: [],
        people_entered: 0
      }],
      total_passes: 1,
      total_people: parseInt(req.body.total_people) || 1,
      payment_mode: req.body.payment_mode || 'Cash',
      payment_status: req.body.mark_as_paid ? 'Paid' : 'Pending',
      notes: req.body.notes || 'Test booking'
    };

    console.log('Creating booking with:', bookingData);
    const booking = await Booking.create(bookingData);
    console.log('Booking created successfully:', booking._id);
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Booking creation failed:', error);
    res.status(500).json({ 
      message: 'Booking creation failed', 
      error: error.message,
      stack: error.stack
    });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('passes.pass_type_id')
      .populate('pass_type_id') // For backward compatibility
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('passes.pass_type_id')
      .populate('pass_type_id'); // For backward compatibility
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(404).json({ message: 'Booking not found' });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { payment_status: req.body.payment_status }, { new: true });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.resendPass = async (req, res) => {
  res.json({ message: 'Pass resent' });
};