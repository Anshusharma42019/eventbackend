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
    booking = await Booking.findOne({ buyer_phone: search_value }).populate('passes.pass_type_id');
    
    // If not found, try Pass ID
    if (!booking) {
      const allBookings = await Booking.find().populate('passes.pass_type_id');
      booking = allBookings.find(b => b.booking_id === search_value);
    }

    if (!booking) {
      return res.status(404).json({ message: 'Pass not found for this Pass ID or mobile number' });
    }

    if (booking.payment_status !== 'Paid') {
      const passTypes = booking.passes ? booking.passes.map(p => p.pass_type_name).join(', ') : (booking.pass_type_id?.name || 'Unknown');
      const totalPrice = booking.passes ? booking.passes.reduce((sum, p) => sum + p.pass_type_price, 0) : (booking.pass_type_id?.price || 0);
      
      return res.status(400).json({ 
        message: 'Pass not paid', 
        booking: {
          booking_id: booking.booking_id,
          buyer_name: booking.buyer_name,
          payment_status: booking.payment_status,
          pass_type: passTypes,
          price: totalPrice
        }
      });
    }

    // Calculate totals from passes if new structure, fallback to old structure
    const totalPeople = booking.passes ? booking.passes.reduce((sum, pass) => sum + pass.people_count, 0) : booking.total_people;
    const totalEntered = booking.passes ? booking.passes.reduce((sum, pass) => sum + (pass.people_entered || 0), 0) : (booking.people_entered || 0);
    const passTypes = booking.passes ? booking.passes.map(p => p.pass_type_name).join(', ') : (booking.pass_type_id?.name || 'Unknown');

    res.json({
      message: 'Pass found',
      booking: {
        id: booking._id,
        booking_id: booking.booking_id,
        buyer_name: booking.buyer_name,
        buyer_phone: booking.buyer_phone,
        pass_type_id: booking.passes && booking.passes.length > 0 ? { name: passTypes } : booking.pass_type_id,
        total_people: totalPeople,
        checked_in: booking.checked_in,
        checked_in_at: booking.checked_in_at,
        total_people_entered: totalEntered,
        people_entered: totalEntered, // For backward compatibility
        scanned_by: booking.scanned_by,
        notes: booking.notes,
        canEnter: totalEntered < totalPeople
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
    
    const booking = await Booking.findById(booking_id).populate('passes.pass_type_id');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const entryCount = people_entered || 1;
    
    // Calculate current totals based on structure
    const totalPeople = booking.passes ? booking.passes.reduce((sum, pass) => sum + pass.people_count, 0) : booking.total_people;
    const currentEntered = booking.passes ? booking.passes.reduce((sum, pass) => sum + (pass.people_entered || 0), 0) : (booking.people_entered || 0);
    const newTotal = currentEntered + entryCount;

    // Check if fully used and no override
    if (currentEntered >= totalPeople && !admin_override) {
      return res.status(400).json({ 
        message: 'Pass fully utilized',
        alreadyCheckedIn: true,
        details: {
          total_allowed: totalPeople,
          already_entered: currentEntered,
          remaining: 0
        }
      });
    }

    // Validate total doesn't exceed limit
    if (newTotal > totalPeople && !admin_override) {
      return res.status(400).json({ 
        message: `Cannot enter ${entryCount} people. Only ${totalPeople - currentEntered} remaining.`,
        remaining: totalPeople - currentEntered
      });
    }

    // Update booking with accumulation
    if (booking.passes && booking.passes.length > 0) {
      // New structure - distribute entry across passes
      let remainingToEnter = entryCount;
      for (let pass of booking.passes) {
        if (remainingToEnter <= 0) break;
        const passRemaining = pass.people_count - (pass.people_entered || 0);
        const toEnterThisPass = Math.min(remainingToEnter, passRemaining);
        pass.people_entered = (pass.people_entered || 0) + toEnterThisPass;
        remainingToEnter -= toEnterThisPass;
      }
      booking.total_people_entered = newTotal;
    } else {
      // Old structure
      booking.people_entered = newTotal;
    }
    
    booking.checked_in = newTotal > 0;
    booking.checked_in_at = booking.checked_in_at || new Date();
    booking.scanned_by = scanned_by;
    await booking.save();

    // Create entry log for this specific entry
    const status = newTotal >= totalPeople ? 'Checked-in' : 
                  newTotal > 0 ? 'Partially Checked-in' : 'Denied';
    
    await EntryLog.create({
      booking_id: booking._id,
      scanned_by,
      people_entered: entryCount, // This entry count
      status
    });

    const passTypes = booking.passes ? booking.passes.map(p => p.pass_type_name).join(', ') : (booking.pass_type_id?.name || 'Unknown');

    res.json({
      message: 'Entry marked successfully',
      booking: {
        booking_id: booking.booking_id,
        buyer_name: booking.buyer_name,
        pass_type: passTypes,
        total_allowed: totalPeople,
        total_entered: newTotal,
        remaining: totalPeople - newTotal,
        this_entry: entryCount,
        status,
        fully_utilized: newTotal >= totalPeople
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