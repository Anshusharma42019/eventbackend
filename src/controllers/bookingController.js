const Booking = require('../models/Booking');
const PassType = require('../models/PassType');

exports.createBooking = async (req, res) => {
  try {
    const passType = await PassType.findById(req.body.pass_type_id);
    if (!passType) {
      return res.status(400).json({ message: 'Invalid pass type' });
    }

    const totalPasses = req.body.total_passes || 1;
    const calculatedAmount = passType.price * totalPasses;
    
    console.log('Creating booking with total_amount:', calculatedAmount);
    
    const bookingData = {
      pass_type_id: req.body.pass_type_id,
      buyer_name: req.body.buyer_name,
      buyer_phone: req.body.buyer_phone,
      pass_holders: req.body.pass_holders || [],
      people_entered: 0,
      total_people: parseInt(req.body.total_people) || passType.max_people,
      total_amount: calculatedAmount,
      payment_status: req.body.payment_status || (req.body.mark_as_paid ? 'Paid' : 'Pending'),
      payment_mode: req.body.payment_mode || 'Cash',
      notes: req.body.notes || '',
      payment_screenshot: req.body.payment_screenshot || null
    };
    
    console.log('Booking data before save:', bookingData);
    const booking = new Booking(bookingData);

    const savedBooking = await booking.save();
    console.log('Saved booking total_amount:', savedBooking.total_amount);
    
    // Force update total_amount if not saved
    await Booking.findByIdAndUpdate(savedBooking._id, { total_amount: calculatedAmount });
    
    const response = savedBooking.toJSON();
    response.pass_type_name = passType.name;
    response.pass_type_price = passType.price;
    response.total_amount = calculatedAmount;
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Booking creation error:', error);
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

