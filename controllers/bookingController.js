const Razorpay = require('razorpay');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const crypto = require('crypto');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const mongoose = require('mongoose');


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(new Error('Tour not found.'));
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`;
  
  // Assuming `req.user.id` is the user making the booking
  const userId = req.user.id;

  const options = {
    amount: tour.price * 100, 
    currency: 'INR',
    receipt: `receipt_${new Date().getTime()}`,
    payment_capture: 1, 
    notes: {
      tour_id: tour.id,   // Ensure tour_id is here
      user_id: userId,    // Ensure user_id is here
      product_name: tour.name,
      product_description: tour.summary,
      image_url: imageUrl
    }
  };

  const order = await razorpay.orders.create(options);

  res.status(200).json({
    status: 'success',
    order
  });
});








exports.createBooking = catchAsync(async (req, res, next) => {
  // Extract necessary data from the request body or params
  const { price, paymentId, orderId } = req.body;
  const user = req.body.user || req.user.id; // Get user from the body or from the session
  const tour = req.body.tour || req.params.id; // Get tour from body or from params
  
  console.log("Request Body:", req.body);

  try {
    // Validate required fields
    if (!user || !tour || !price || !paymentId || !orderId) {
      return next(new Error('All fields (user, tour, price, paymentId, orderId) are required.'));
    }

    // Check if the user exists in the database
    const existingUser = await User.findById(user);
    if (!existingUser) {
      return next(new Error('User not found.'));
    }

    // Validate if the tour ID is valid
    if (!mongoose.Types.ObjectId.isValid(tour)) {
      return next(new Error('Invalid tour ID format.'));
    }

    // Check if the tour exists in the database
    const existingTour = await Tour.findById(tour);
    if (!existingTour) {
      return next(new Error('Tour not found.'));
    }

    // Fetch payment details from Razorpay API
    const payment = await razorpay.payments.fetch(paymentId);
    console.log("Payment Status:", payment.status);

    // If payment status is not 'captured', return an error
    if (payment.status !== 'captured') {
      return next(new Error('Payment failed or was not captured.'));
    }

    // If payment is captured, create a new booking
    const newBooking = await Booking.create({
      user,
      tour,
      price,
      paymentId,
      orderId,
    });

    // Populate booking with user and tour details
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('user', 'name email')
      .populate('tour', 'name');

    console.log("New Booking Created:", populatedBooking);

    // Send success response with the booking details
    res.status(201).json({
      status: 'success',
      data: {
        booking: populatedBooking,
      },
    });
  } catch (error) {
    // Log and send error response
    console.error("Error during booking creation:", error);
    res.status(400).json({
      status: 'fail',
      message: error.message || 'Error during booking creation.',
    });
  }
});






exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);