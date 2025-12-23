const mongoose = require('mongoose');

const passHolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  },
  phone: {
    type: String
  }
});

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
    required: false
  },
  total_people: {
    type: Number,
    required: true
  },
  total_amount: {
    type: Number,
    required: false,
    default: 0
  },
  pass_holders: [passHolderSchema],
  people_entered: {
    type: Number,
    default: 0
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
  payment_notes: {
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
  scanned_by: {
    type: String
  },
  payment_screenshot: {
    type: String
  },
  is_owner_pass: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

bookingSchema.set('toJSON', { virtuals: true, transform: function(doc, ret) {
  if (ret.total_amount === undefined || ret.total_amount === null) {
    ret.total_amount = 0;
  }
  return ret;
}});
bookingSchema.set('toObject', { virtuals: true });

// Clear any existing model to force schema reload
if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}

module.exports = mongoose.model('Booking', bookingSchema);