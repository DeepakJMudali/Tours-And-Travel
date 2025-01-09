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



exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  
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
    const tourId = order.notes.tour_id;  
    const userId = order.notes.user_id;  


    console.log("Order Notes:", order.notes);

 
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
      orderId: orderId,
    });


    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('user', 'name email')
      .populate('tour', 'name');

    res.status(200).json({
      received: true,
      message: 'Payment successful, booking created.',
      booking: populatedBooking,
    });
  } else if (event.event === 'payment.failed') {
    console.log(`Payment failed: ${event.payload.payment.entity.id}`);
    res.status(200).json({ received: true, message: 'Payment failed.' });
  } else if (event.event === 'payment.canceled') {
    console.log(`Payment canceled: ${event.payload.payment.entity.id}`);
    res.status(200).json({ received: true, message: 'Payment canceled.' });
  } else {
    res.status(200).json({ received: true });
  }
});



exports.createBooking = catchAsync(async (req, res, next) => {
 
  const { tour,price, paymentId, orderId } = req.body;
  const user = req.user.id
 
 console.log("reqqqq",req.body)
  try {
    if ( !user || !tour || !price || !paymentId || !orderId) {
      return next(new Error('All fields are required.'));
    }

    const existingUser = await User.findById(user);
    console.log("existingUser",existingUser)
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

    // Create booking
    const newBooking = await Booking.create({
      user,
      tour,
      price,
      paymentId,
      orderId,
    });
    console.log("newBooking",newBooking)
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('user', 'name email')
      .populate('tour', 'name');

      console.log("populatedBooking",populatedBooking)
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