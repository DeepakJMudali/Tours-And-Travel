const Razorpay = require('razorpay');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const factory = require('./handlerFactory');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(new Error('Tour not found.'));
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`;

  // 2) Create Razorpay order
  const options = {
    amount: tour.price * 100, // Convert price to paise
    currency: 'INR',
    receipt: `receipt_${new Date().getTime()}`,
    payment_capture: 1, // Automatically capture payment
    notes: {
      product_name: tour.name,
      product_description: tour.summary,
      image_url: imageUrl
    }
  };

  // Create the Razorpay order
  const order = await razorpay.orders.create(options);

  // 3) Send the order details to the frontend
  res.status(200).json({
    status: 'success',
    order
  });
});


exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const crypto = require('crypto');
  
  // Verify the webhook signature
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(req.rawBody);
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    return res.status(400).send('Invalid signature');
  }

  // Webhook event
  const event = req.body;

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const razorpayPaymentId = payment.id;

 

    // Get the corresponding order
    const order = await razorpay.orders.fetch(orderId);
  

    const tourId = order.notes.tour_id;  // Retrieve `tourId` from notes
 

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return next(new Error('Tour not found.'));
    }

    const userId = order.notes.user_id;  // Retrieve `userId` from notes
    const user = await User.findById(userId);
    if (!user) {
      return next(new Error('User not found.'));
    }

    // Create booking after successful payment
    const newBooking = await Booking.create({
      tour: tourId,
      user: user.id,
      price: order.amount / 100, // Convert back to INR
      paymentId: razorpayPaymentId,
      orderId: orderId
    });

  }

  res.status(200).json({ received: true });
});

const mongoose = require('mongoose'); // Import mongoose to use ObjectId validation

exports.createBooking = catchAsync(async (req, res, next) => {
  const { user, tour, price, paymentId, orderId } = req.body;

  // Log the incoming request body

  try {
    // Check if `user` is provided
    if (!user) {
      return next(new Error('User ID is required.'));
    }

    // Check if `tour` is provided
    if (!tour) {
      return next(new Error('Tour ID is required.'));
    }

    // Ensure the user exists
    const existingUser = await User.findById(user);
    if (!existingUser) {
      return next(new Error('User not found.'));
    }

    // Ensure the tour ID format is valid
    if (!mongoose.Types.ObjectId.isValid(tour)) {
      return next(new Error('Invalid tour ID format.'));
    }

    // Ensure the tour exists
    const existingTour = await Tour.findById(tour);
    if (!existingTour) {
      return next(new Error('Tour not found.'));
    }

    // Create the new booking
    const newBooking = await Booking.create({
      user,
      tour,
      price,
      paymentId,
      orderId,
    });

    

    const populatedBooking = await Booking.findById(newBooking._id)
  .populate('user', 'name email')
  .populate('tour', 'name');

    res.status(201).json({
      status: 'success',
      data: {
        booking: populatedBooking,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
});





//exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);