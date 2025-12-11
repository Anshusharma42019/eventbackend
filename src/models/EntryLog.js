const mongoose = require('mongoose');

const entryLogSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  scanned_at: {
    type: Date,
    default: Date.now 
  },
  scanned_by: {
    type: String,
    required: true
  },
  people_entered: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Checked-in', 'Partially Checked-in', 'Denied'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EntryLog', entryLogSchema);