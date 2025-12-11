const Booking = require('../models/Booking');
const EntryLog = require('../models/EntryLog');

// Search by Pass ID or mobile number (Gate Staff)
exports.searchPass = async (req, res) => {
  try {
    const { search_value } = req.body;
    
    if (!search_value) {
      return res.status(400).json({ message: 'Pass ID or mobile number required' });
    }

    // Search by mobile number or Pass ID
    let booking;
    
    // First try mobile number
    booking = await Booking.findOne({ buyer_phone: search_value }).populate('pass_type_id');
    
    // If not found, try Pass ID
    if (!booking) {
      const allBookings = await Booking.find().populate('pass_type_id');
      booking = allBookings.find(b => b.booking_id === search_value);
    }

    if (!booking) {
      return res.status(404).json({ message: 'Pass not found for this Pass ID or mobile number' });
    }

    if (booking.payment_status !== 'Paid') {
      return res.status(400).json({ 
        message: 'Pass not paid', 
        booking: {
          booking_id: booking.booking_id,
          buyer_name: booking.buyer_name,
          payment_status: booking.payment_status,
          pass_type: booking.pass_type_id.name,
          price: booking.pass_type_id.price
        }
      });
    }

    res.json({
      message: 'Pass found',
      booking: {
        id: booking._id,
        booking_id: booking.booking_id,
        buyer_name: booking.buyer_name,
        buyer_phone: booking.buyer_phone,
        pass_type: booking.pass_type_id.name,
        max_people: booking.pass_type_id.max_people,
        total_people: booking.total_people,
        checked_in: booking.checked_in,
        checked_in_at: booking.checked_in_at,
        people_entered: booking.people_entered,
        scanned_by: booking.scanned_by,
        notes: booking.notes,
        canEnter: !booking.checked_in
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark entry (check-in) - Gate Staff with accumulation logic
exports.markEntry = async (req, res) => {
  try {
    const { booking_id, people_entered, scanned_by, admin_override, admin_pin } = req.body;
    
    // Validate admin override PIN
    if (admin_override && admin_pin !== process.env.ADMIN_PIN) {
      return res.status(403).json({ message: 'Invalid admin PIN' });
    }
    
    const booking = await Booking.findById(booking_id).populate('pass_type_id');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const entryCount = people_entered || 1;
    const currentEntered = booking.people_entered || 0;
    const newTotal = currentEntered + entryCount;

    // Check if fully used and no override
    if (currentEntered >= booking.total_people && !admin_override) {
      return res.status(400).json({ 
        message: 'Pass fully utilized',
        alreadyCheckedIn: true,
        details: {
          total_allowed: booking.total_people,
          already_entered: currentEntered,
          remaining: 0
        }
      });
    }

    // Validate total doesn't exceed limit
    if (newTotal > booking.total_people && !admin_override) {
      return res.status(400).json({ 
        message: `Cannot enter ${entryCount} people. Only ${booking.total_people - currentEntered} remaining.`,
        remaining: booking.total_people - currentEntered
      });
    }

    // Update booking with accumulation
    booking.people_entered = newTotal;
    booking.checked_in = newTotal > 0;
    booking.checked_in_at = booking.checked_in_at || new Date();
    booking.scanned_by = scanned_by;
    await booking.save();

    // Create entry log for this specific entry
    const status = newTotal >= booking.total_people ? 'Checked-in' : 
                  newTotal > 0 ? 'Partially Checked-in' : 'Denied';
    
    await EntryLog.create({
      booking_id: booking._id,
      scanned_by,
      people_entered: entryCount, // This entry count
      status
    });

    res.json({
      message: 'Entry marked successfully',
      booking: {
        booking_id: booking.booking_id,
        buyer_name: booking.buyer_name,
        pass_type: booking.pass_type_id.name,
        total_allowed: booking.total_people,
        total_entered: newTotal,
        remaining: booking.total_people - newTotal,
        this_entry: entryCount,
        status,
        fully_utilized: newTotal >= booking.total_people
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get entry logs (Admin)
exports.getEntryLogs = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const logs = await EntryLog.find()
      .populate({
        path: 'booking_id',
        populate: { path: 'pass_type_id' }
      })
      .sort({ scanned_at: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};