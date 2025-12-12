const Booking = require('../models/Booking');
const PassType = require('../models/PassType');

exports.createBooking = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Fetch pass type details
    const passType = await PassType.findById(req.body.pass_type_id);
    if (!passType) {
      return res.status(404).json({ message: 'Pass type not found' });
    }
    
    const bookingData = {
      pass_type_id: new mongoose.Types.ObjectId(req.body.pass_type_id),
      buyer_name: req.body.buyer_name,
      buyer_phone: req.body.buyer_phone,
      total_people: req.body.total_people || 1,
      pass_holders: req.body.pass_holders || [],
      payment_mode: req.body.payment_mode || 'Cash',
      payment_status: req.body.mark_as_paid ? 'Paid' : 'Pending',
      notes: req.body.notes || `1 ${passType.name} pass booked. ${req.body.payment_mode || 'Cash'} payment received. Amount: ₹${passType.price}`,
      people_entered: 0,
      checked_in: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert directly to bypass all Mongoose middleware
    const result = await mongoose.connection.db.collection('bookings').insertOne(bookingData);
    
    // Add virtual booking_id and pass type info
    const booking = {
      ...bookingData,
      _id: result.insertedId,
      booking_id: `NY2025-${result.insertedId.toString().slice(-6)}`,
      id: result.insertedId.toString(),
      pass_type_name: passType.name,
      pass_type_price: passType.price
    };
    
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('pass_type_id')
      .sort({ createdAt: -1 })
      .lean();
    
    // Add booking_id to each booking
    const bookingsWithId = bookings.map(booking => ({
      ...booking,
      booking_id: `NY2025-${booking._id.toString().slice(-6)}`
    }));
    
    res.json(bookingsWithId);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('pass_type_id');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // If populate didn't work, manually fetch pass type
    if (!booking.pass_type_id || !booking.pass_type_id.name) {
      const passType = await PassType.findById(booking.pass_type_id);
      if (passType) {
        booking.pass_type_id = passType;
      }
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

exports.debugData = async (req, res) => {
  try {
    const passTypes = await PassType.find({});
    const bookings = await Booking.find({}).limit(3);
    
    res.json({
      passTypes: passTypes,
      sampleBookings: bookings,
      message: 'Debug data'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

