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

const passSchema = new mongoose.Schema({
  pass_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PassType',
    required: true
  },
  pass_type_name: {
    type: String,
    required: true
  },
  pass_type_price: {
    type: Number,
    required: true
  },
  people_count: {
    type: Number,
    required: true
  },
  pass_holders: [passHolderSchema],
  people_entered: {
    type: Number,
    default: 0
  }
});

const bookingSchema = new mongoose.Schema({
  // Old structure fields for backward compatibility
  pass_type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PassType',
    required: false
  },
  pass_holders: [passHolderSchema],
  people_entered: {
    type: Number,
    default: 0
  },
  
  // New structure fields
  buyer_name: {
    type: String,
    required: true
  },
  buyer_phone: {
    type: String,
    required: false
  },
  passes: [passSchema],
  total_passes: {
    type: Number,
    required: false
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
  total_people_entered: {
    type: Number,
    default: 0
  },
  scanned_by: {
    type: String
  }
}, {
  timestamps: true,
  strictPopulate: false
});

// Generate booking ID in format NY2025-000123
bookingSchema.virtual('booking_id').get(function() {
  const year = new Date().getFullYear();
  const paddedId = this._id.toString().slice(-6).padStart(6, '0');
  return `NY${year}-${paddedId}`;
});

// Remove all validation on total_people
bookingSchema.pre('save', function(next) {
  // Allow any number of people
  next();
});

bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Remove any unique index on buyer_phone if it exists
bookingSchema.post('init', async function() {
  try {
    await this.collection.dropIndex('buyer_phone_1');
  } catch (error) {
    // Index doesn't exist, ignore error
  }
});

module.exports = mongoose.model('Booking', bookingSchema);