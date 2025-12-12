const Booking = require('../models/Booking');
const PassType = require('../models/PassType');

exports.createBooking = async (req, res) => {
  try {
    const bookingData = {
      buyer_name: req.body.buyer_name,
      buyer_phone: req.body.buyer_phone,
      passes: [{
        pass_type_id: req.body.pass_type_id || new require('mongoose').Types.ObjectId(),
        pass_type_name: 'Pass',
        pass_type_price: 100,
        people_count: parseInt(req.body.total_people) || 1,
        pass_holders: req.body.pass_holders || [],
        people_entered: 0
      }],
      total_passes: 1,
      total_people: parseInt(req.body.total_people) || 1,
      payment_mode: req.body.payment_mode || 'Cash',
      payment_status: req.body.mark_as_paid ? 'Paid' : 'Pending',
      notes: req.body.notes || ''
    };

    const booking = await Booking.create(bookingData);
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const bookings = await mongoose.connection.db.collection('bookings').find({}).sort({ createdAt: -1 }).toArray();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
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

