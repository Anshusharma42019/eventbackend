const mongoose = require('mongoose');

const passTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['Teens', 'Couple', 'Family']
  },
  price: {
    type: Number
  },
  max_people: {
    type: Number
  },
  no_of_people: {
    type: Number,
    default: 0
  },
  no_of_passes: {
    type: Number,
    default: 0
  },
  valid_for_event: {
    type: String,
    default: 'New Year 2025'
  },
  description: {
    type: String,
    default: ''
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PassType', passTypeSchema);