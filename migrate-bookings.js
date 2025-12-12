const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Booking = require('./src/models/Booking');
const PassType = require('./src/models/PassType');

async function migrateBookings() {
  try {
    console.log('Starting booking migration...');
    
    // Find all bookings that don't have the new structure
    const oldBookings = await Booking.find({ 
      $or: [
        { passes: { $exists: false } },
        { passes: { $size: 0 } }
      ]
    }).populate('pass_type_id');
    
    console.log(`Found ${oldBookings.length} bookings to migrate`);
    
    for (const booking of oldBookings) {
      if (booking.pass_type_id) {
        // Convert to new structure
        const newPass = {
          pass_type_id: booking.pass_type_id._id,
          pass_type_name: booking.pass_type_id.name,
          pass_type_price: booking.pass_type_id.price,
          people_count: booking.total_people || 1,
          pass_holders: booking.pass_holders || [],
          people_entered: booking.people_entered || 0
        };
        
        // Update booking
        await Booking.findByIdAndUpdate(booking._id, {
          $set: {
            passes: [newPass],
            total_passes: 1,
            total_people_entered: booking.people_entered || 0
          },
          $unset: {
            pass_type_id: 1,
            pass_holders: 1,
            people_entered: 1
          }
        });
        
        console.log(`Migrated booking ${booking.booking_id}`);
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateBookings();