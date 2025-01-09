const Razorpay = require('razorpay');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
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

  
  const options = {
    amount: tour.price * 100, 
    currency: 'INR',
    receipt: `receipt_${new Date().getTime()}`,
    payment_capture: 1, 
    notes: {
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


exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const crypto = require('crypto');
  
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(req.rawBody);
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const razorpayPaymentId = payment.id;

   
    if (payment.status !== 'captured') {
      return res.status(200).json({ received: true, message: 'Payment not captured. No booking will be created.' });
    }


    const order = await razorpay.orders.fetch(orderId);

    const tourId = order.notes.tour_id;  // Retrieve `tourId` from notes
    const userId = order.notes.user_id;  // Retrieve `userId` from notes


    const tour = await Tour.findById(tourId);
    if (!tour) {
      return next(new Error('Tour not found.'));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new Error('User not found.'));
    }

    const newBooking = await Booking.create({
      tour: tourId,
      user: user.id,
      price: order.amount / 100, 
      paymentId: razorpayPaymentId,
      orderId: orderId
    });

    res.status(200).json({ received: true, message: 'Payment successful, booking created.' });
  }

  else if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity;
    const razorpayPaymentId = payment.id;

    console.log(`Payment failed: ${razorpayPaymentId}`);


    res.status(200).json({ received: true, message: 'Payment failed.' });
  }

  else if (event.event === 'payment.canceled') {
    const payment = event.payload.payment.entity;
    const razorpayPaymentId = payment.id;

    console.log(`Payment canceled: ${razorpayPaymentId}`);


    res.status(200).json({ received: true, message: 'Payment canceled.' });
  }
  else {
    res.status(200).json({ received: true });
  }
});




exports.createBooking = catchAsync(async (req, res, next) => {
  const { user, tour, price, paymentId, orderId } = req.body;



  try {

    if (!user) {
      return next(new Error('User ID is required.'));
    }


    if (!tour) {
      return next(new Error('Tour ID is required.'));
    }


    const existingUser = await User.findById(user);
    if (!existingUser) {
      return next(new Error('User not found.'));
    }


    if (!mongoose.Types.ObjectId.isValid(tour)) {
      return next(new Error('Invalid tour ID format.'));
    }


    const existingTour = await Tour.findById(tour);
    if (!existingTour) {
      return next(new Error('Tour not found.'));
    }

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





exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);