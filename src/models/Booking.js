const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  pass_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PassType',
    required: true
  },
  buyer_name: {
    type: String,
    required: true
  },
  buyer_phone: {
    type: String,
    required: true
  },
  total_people: {
    type: Number,
    required: true
  },
  payment_status: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded'],
    default: 'Pending'
  },
  payment_mode: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Online']
  },
  notes: {
    type: String,
    default: ''
  },
  checked_in: {
    type: Boolean,
    default: false
  },
  checked_in_at: {
    type: Date
  },
  people_entered: {
    type: Number,
    default: 0
  },
  scanned_by: {
    type: String
  }
}, {
  timestamps: true
});

// Generate booking ID in format NY2025-000123
bookingSchema.virtual('booking_id').get(function() {
  const year = new Date().getFullYear();
  const paddedId = this._id.toString().slice(-6).padStart(6, '0');
  return `NY${year}-${paddedId}`;
});

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);