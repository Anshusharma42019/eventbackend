const Booking = require('../models/Booking');
const PassType = require('../models/PassType');
const EntryLog = require('../models/EntryLog');

// Dashboard stats (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    // Basic counts
    const totalBookings = await Booking.countDocuments();
    const paidBookings = await Booking.find({ payment_status: 'Paid' }).populate('pass_type_id');
    const checkedInBookings = await Booking.countDocuments({ checked_in: true });
    
    // Calculate total revenue
    const totalRevenue = paidBookings.reduce((sum, booking) => {
      return sum + (booking.pass_type_id?.price || 0);
    }, 0);

    // Pass type counts with people
    const passTypeCounts = await Booking.aggregate([
      { $lookup: { from: 'passtypes', localField: 'pass_type_id', foreignField: '_id', as: 'passType' } },
      { $unwind: '$passType' },
      { 
        $group: { 
          _id: '$passType.name', 
          sold: { $sum: 1 }, 
          expectedPeople: { $sum: '$total_people' },
          revenue: { $sum: { $cond: [{ $eq: ['$payment_status', 'Paid'] }, '$passType.price', 0] } }
        } 
      }
    ]);

    // Expected vs actual people
    const totalExpectedPeople = await Booking.aggregate([
      { $match: { payment_status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$total_people' } } }
    ]);

    const totalEnteredPeople = await Booking.aggregate([
      { $match: { checked_in: true } },
      { $group: { _id: null, total: { $sum: '$people_entered' } } }
    ]);

    const expectedPeople = totalExpectedPeople[0]?.total || 0;
    const enteredPeople = totalEnteredPeople[0]?.total || 0;

    res.json({
      totalPassesSold: totalBookings,
      totalRevenue,
      checkedInCount: checkedInBookings,
      notCheckedInCount: totalBookings - checkedInBookings,
      passTypeCounts,
      expectedPeople,
      enteredPeople,
      noShowCount: expectedPeople - enteredPeople,
      summary: {
        teens: passTypeCounts.find(p => p._id === 'Teens') || { sold: 0, expectedPeople: 0, revenue: 0 },
        couple: passTypeCounts.find(p => p._id === 'Couple') || { sold: 0, expectedPeople: 0, revenue: 0 },
        family: passTypeCounts.find(p => p._id === 'Family') || { sold: 0, expectedPeople: 0, revenue: 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Detailed reports with filters (Admin)
exports.getDetailedReport = async (req, res) => {
  try {
    const { start_date, end_date, pass_type, payment_status } = req.query;
    
    let query = {};
    if (start_date && end_date) {
      query.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }
    if (payment_status) query.payment_status = payment_status;

    let bookings = await Booking.find(query).populate('pass_type_id').sort({ createdAt: -1 });
    
    if (pass_type) {
      bookings = bookings.filter(booking => booking.pass_type_id.name === pass_type);
    }

    // Summary by pass type
    const summary = {};
    let totalRevenue = 0;
    let totalExpected = 0;
    let totalEntered = 0;

    bookings.forEach(booking => {
      const passTypeName = booking.pass_type_id.name;
      if (!summary[passTypeName]) {
        summary[passTypeName] = {
          sold: 0,
          revenue: 0,
          expectedPeople: 0,
          enteredPeople: 0,
          checkedIn: 0
        };
      }
      
      summary[passTypeName].sold += 1;
      if (booking.payment_status === 'Paid') {
        summary[passTypeName].revenue += booking.pass_type_id.price;
        totalRevenue += booking.pass_type_id.price;
        summary[passTypeName].expectedPeople += booking.total_people;
        totalExpected += booking.total_people;
      }
      
      if (booking.checked_in) {
        summary[passTypeName].checkedIn += 1;
        summary[passTypeName].enteredPeople += booking.people_entered;
        totalEntered += booking.people_entered;
      }
    });

    res.json({
      bookings,
      summary,
      totals: {
        totalBookings: bookings.length,
        totalRevenue,
        totalExpected,
        totalEntered,
        noShow: totalExpected - totalEntered
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export data for CSV/Excel (Admin)
exports.exportData = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('pass_type_id').sort({ createdAt: -1 });
    
    const exportData = bookings.map(booking => ({
      pass_id: booking.booking_id,
      buyer_name: booking.buyer_name,
      buyer_phone: booking.buyer_phone,
      pass_type: booking.pass_type_id.name,
      price: booking.pass_type_id.price,
      total_people: booking.total_people,
      payment_status: booking.payment_status,
      payment_mode: booking.payment_mode,
      checked_in: booking.checked_in ? 'Yes' : 'No',
      people_entered: booking.people_entered,
      checked_in_at: booking.checked_in_at,
      scanned_by: booking.scanned_by,
      created_at: booking.createdAt,
      notes: booking.notes
    }));

    res.json({
      message: 'Export data generated',
      data: exportData,
      count: exportData.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};