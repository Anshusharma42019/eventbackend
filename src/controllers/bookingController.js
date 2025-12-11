const Booking = require('../models/Booking');
const PassType = require('../models/PassType');

// Create new booking (Sales Staff)
exports.createBooking = async (req, res) => {
  try {
    const { pass_type_id, buyer_name, buyer_phone, payment_mode, notes, total_people, mark_as_paid } = req.body;
    
    // Check for duplicate phone number
    const existingBooking = await Booking.findOne({ buyer_phone });
    if (existingBooking) {
      return res.status(400).json({ 
        message: 'Phone number already has a booking',
        existingBooking: {
          booking_id: existingBooking.booking_id,
          buyer_name: existingBooking.buyer_name,
          payment_status: existingBooking.payment_status
        }
      });
    }
    
    const passType = await PassType.findById(pass_type_id);
    if (!passType) {
      return res.status(404).json({ message: 'Pass type not found' });
    }

    const peopleCount = total_people || passType.max_people;

    if (peopleCount > passType.max_people) {
      return res.status(400).json({ 
        message: `Cannot exceed maximum ${passType.max_people} people for ${passType.name} pass` 
      });
    }

    const booking = await Booking.create({
      pass_type_id,
      buyer_name,
      buyer_phone,
      total_people: peopleCount,
      payment_mode,
      payment_status: mark_as_paid ? 'Paid' : 'Pending',
      notes: notes || ''
    });

    const populatedBooking = await Booking.findById(booking._id).populate('pass_type_id');

    res.status(201).json({
      message: 'Booking created successfully',
      booking: populatedBooking,
      passDetails: {
        passId: populatedBooking.booking_id,
        buyerName: populatedBooking.buyer_name,
        buyerPhone: populatedBooking.buyer_phone,
        passType: populatedBooking.pass_type_id.name,
        allowedPeople: populatedBooking.total_people,
        price: populatedBooking.pass_type_id.price,
        paymentStatus: populatedBooking.payment_status
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all bookings with filters
exports.getBookings = async (req, res) => {
  try {
    const { search, pass_type, payment_status, check_in_status } = req.query;
    let query = {};

    // Search by name, phone, or pass ID
    if (search) {
      const bookings = await Booking.find().populate('pass_type_id');
      const filteredByPassId = bookings.filter(booking => 
        booking.booking_id.toLowerCase().includes(search.toLowerCase()) ||
        booking.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
        booking.buyer_phone.includes(search)
      );
      
      if (filteredByPassId.length > 0) {
        query._id = { $in: filteredByPassId.map(b => b._id) };
      } else {
        return res.json([]);
      }
    }

    if (payment_status) query.payment_status = payment_status;
    if (check_in_status === 'checked_in') query.checked_in = true;
    if (check_in_status === 'not_checked_in') query.checked_in = false;

    let bookings = await Booking.find(query).populate('pass_type_id').sort({ createdAt: -1 });

    if (pass_type && !search) {
      bookings = bookings.filter(booking => booking.pass_type_id.name === pass_type);
    }

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('pass_type_id');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking (Admin only)
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndUpdate(id, req.body, { new: true }).populate('pass_type_id');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update payment status (Sales Staff)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { payment_status },
      { new: true }
    ).populate('pass_type_id');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ message: 'Payment status updated', booking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Resend pass details
exports.resendPass = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('pass_type_id');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({
      message: 'Pass details retrieved',
      passDetails: {
        passId: booking.booking_id,
        buyerName: booking.buyer_name,
        buyerPhone: booking.buyer_phone,
        passType: booking.pass_type_id.name,
        allowedPeople: booking.total_people,
        price: booking.pass_type_id.price,
        paymentStatus: booking.payment_status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};