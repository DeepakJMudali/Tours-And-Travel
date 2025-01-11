const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour', // Refers to the Tour model
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to the User model
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true
  }
});


bookingSchema.pre(/^find/, function(next) {
  this.populate({path:"user",
 select:"name email"
})
next();
})


const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
