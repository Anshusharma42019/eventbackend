const mongoose = require('mongoose');

const passTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Teens', 'Couple', 'Family']
  },
  price: {
    type: Number,
    required: true
  },
  max_people: {
    type: Number,
    required: true
  },
  valid_for_event: {
    type: String,
    default: 'New Year 2025'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PassType', passTypeSchema);