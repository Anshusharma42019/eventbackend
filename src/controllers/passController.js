const PassType = require('../models/PassType');
const Booking = require('../models/Booking');

// Get all pass types
exports.getPassTypes = async (req, res) => {
  try {
    const passTypes = await PassType.find();
    res.json(passTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create pass type (Admin only)
exports.createPassType = async (req, res) => {
  try {
    const passType = await PassType.create(req.body);
    res.status(201).json(passType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update pass type (Admin only)
exports.updatePassType = async (req, res) => {
  try {
    const { id } = req.params;
    const passType = await PassType.findByIdAndUpdate(id, req.body, { new: true });
    if (!passType) {
      return res.status(404).json({ message: 'Pass type not found' });
    }
    res.json(passType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete pass type (Admin only)
exports.deletePassType = async (req, res) => {
  try {
    const { id } = req.params;
    const passType = await PassType.findByIdAndDelete(id);
    if (!passType) {
      return res.status(404).json({ message: 'Pass type not found' });
    }
    res.json({ message: 'Pass type deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const paidBookings = await Booking.find({ payment_status: 'Paid' }).populate('pass_type_id');
    const checkedInBookings = await Booking.countDocuments({ checked_in: true });
    
    const totalRevenue = paidBookings.reduce((sum, booking) => {
      return sum + (booking.pass_type_id?.price || 0);
    }, 0);

    const passTypeCounts = await Booking.aggregate([
      { $lookup: { from: 'passtypes', localField: 'pass_type_id', foreignField: '_id', as: 'passType' } },
      { $unwind: '$passType' },
      { $group: { _id: '$passType.name', count: { $sum: 1 } } }
    ]);

    res.json({
      totalBookings,
      totalRevenue,
      checkedInCount: checkedInBookings,
      notCheckedInCount: totalBookings - checkedInBookings,
      passTypeCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};