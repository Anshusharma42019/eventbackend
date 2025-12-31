const Booking = require('../models/Booking');
const PassType = require('../models/PassType');

exports.createBooking = async (req, res) => {
  try {
    const passType = await PassType.findById(req.body.pass_type_id);
    if (!passType) {
      return res.status(400).json({ message: 'Invalid pass type' });
    }

    const totalPasses = req.body.total_passes || 1;
    const customPrice = req.body.custom_price ? parseInt(req.body.custom_price) : null;
    const isOwnerPass = req.body.is_owner_pass || false;
    
    // Use custom price as-is, or calculate from pass type price
    let calculatedAmount;
    if (isOwnerPass) {
      calculatedAmount = 0; // Owner pass is always free
    } else if (customPrice !== null && customPrice > 0) {
      calculatedAmount = customPrice; // Use custom price directly
    } else {
      calculatedAmount = passType.price * totalPasses; // Use default calculation
    }
    
    console.log('Creating booking:', {
      default_price: passType.price,
      custom_price: customPrice,
      total_passes: totalPasses,
      is_owner_pass: isOwnerPass,
      calculated_amount: calculatedAmount
    });
    
    const bookingData = {
      pass_type_id: req.body.pass_type_id,
      buyer_name: req.body.buyer_name,
      buyer_phone: req.body.buyer_phone,
      pass_holders: req.body.pass_holders || [],
      people_entered: 0,
      total_people: parseInt(req.body.total_people) || passType.max_people,
      total_amount: calculatedAmount,
      custom_price: customPrice,
      payment_status: req.body.payment_status || (req.body.mark_as_paid ? 'Paid' : 'Pending'),
      payment_mode: req.body.payment_mode || 'Cash',
      notes: req.body.notes || '',
      payment_notes: req.body.payment_notes || '',
      payment_screenshot: req.body.payment_screenshot || null,
      is_owner_pass: req.body.is_owner_pass || false,
      created_by: req.user ? req.user.id : null
    };
    
    console.log('Booking data before save:', bookingData);
    const booking = new Booking(bookingData);

    const savedBooking = await booking.save();
    console.log('Saved booking total_amount:', savedBooking.total_amount);
    
    // Ensure total_amount is properly saved
    if (savedBooking.total_amount !== calculatedAmount) {
      await Booking.findByIdAndUpdate(savedBooking._id, { 
        total_amount: calculatedAmount,
        custom_price: customPrice 
      });
    }
    
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
      .populate('created_by', 'name role')
      .sort({ createdAt: -1 })
      .lean();
    
    const bookingsWithDefaults = bookings.map(booking => ({
      ...booking,
      pass_holders: booking.pass_holders || [],
      people_entered: booking.people_entered || 0,
      total_amount: booking.total_amount || 0,
      payment_screenshot: booking.payment_screenshot || null,
      notes: booking.notes || '',
      payment_notes: booking.payment_notes || '',
      is_owner_pass: booking.is_owner_pass || false
    }));
    
    res.json(bookingsWithDefaults);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get bookings excluding admin role for revenue calculation
exports.getStaffBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('pass_type_id')
      .populate('created_by', 'name role')
      .sort({ createdAt: -1 })
      .lean();
    
    // Filter out bookings created by Admin role
    const staffBookings = bookings.filter(booking => 
      !booking.created_by || booking.created_by.role !== 'Admin'
    );
    
    const bookingsWithDefaults = staffBookings.map(booking => ({
      ...booking,
      pass_holders: booking.pass_holders || [],
      people_entered: booking.people_entered || 0,
      total_amount: booking.total_amount || 0,
      payment_screenshot: booking.payment_screenshot || null,
      notes: booking.notes || '',
      payment_notes: booking.payment_notes || '',
      is_owner_pass: booking.is_owner_pass || false
    }));
    
    res.json(bookingsWithDefaults);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('pass_type_id').lean();
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const bookingWithDefaults = {
      ...booking,
      pass_holders: booking.pass_holders || [],
      people_entered: booking.people_entered || 0,
      total_amount: booking.total_amount || 0,
      payment_screenshot: booking.payment_screenshot || null,
      notes: booking.notes || '',
      payment_notes: booking.payment_notes || '',
      is_owner_pass: booking.is_owner_pass || false
    };
    
    res.json(bookingWithDefaults);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(404).json({ message: 'Booking not found' });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle custom price logic
    if (req.body.custom_price !== undefined) {
      updateData.custom_price = req.body.custom_price;
      if (req.body.custom_price) {
        updateData.total_amount = parseInt(req.body.custom_price);
      }
    }
    
    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('pass_type_id').lean();
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const bookingWithDefaults = {
      ...booking,
      pass_holders: booking.pass_holders || [],
      people_entered: booking.people_entered || 0,
      total_amount: booking.total_amount || 0,
      payment_screenshot: booking.payment_screenshot || null,
      notes: booking.notes || '',
      payment_notes: booking.payment_notes || '',
      is_owner_pass: booking.is_owner_pass || false
    };
    res.json(bookingWithDefaults);
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

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
