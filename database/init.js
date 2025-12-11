const mongoose = require('mongoose');
const PassType = require('../src/models/PassType');
const User = require('../src/models/User');

const initDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pass_management';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      bufferMaxEntries: 0
    });
    console.log('MongoDB connected to:', mongoUri.includes('mongodb.net') ? 'Atlas Cloud' : 'Local');

    // Drop old username index if exists
    try {
      await User.collection.dropIndex('username_1');
    } catch (e) {
      // Index doesn't exist, ignore
    }

    // Create indexes for performance
    const Booking = require('../src/models/Booking');
    const EntryLog = require('../src/models/EntryLog');
    
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ mobile: 1 }, { unique: true, sparse: true });
    await Booking.collection.createIndex({ buyer_phone: 1 });
    await Booking.collection.createIndex({ pass_type_id: 1 });
    await Booking.collection.createIndex({ payment_status: 1 });
    await Booking.collection.createIndex({ checked_in: 1 });
    await EntryLog.collection.createIndex({ booking_id: 1 });
    await EntryLog.collection.createIndex({ scanned_at: -1 });

    // Create default pass types
    const passTypes = [
      { name: 'Teens', price: 500, max_people: 1, valid_for_event: 'New Year 2025' },
      { name: 'Couple', price: 1200, max_people: 2, valid_for_event: 'New Year 2025' },
      { name: 'Family', price: 2000, max_people: 5, valid_for_event: 'New Year 2025' }
    ];

    for (const passType of passTypes) {
      const existing = await PassType.findOne({ name: passType.name });
      if (!existing) {
        await PassType.create(passType);
      }
    }

    console.log('Database initialized with indexes and default data');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = { initDatabase };