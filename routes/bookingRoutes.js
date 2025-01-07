// routes/bookingRoutes.js
const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const Router = express.Router({ mergeParams: true })
Router.use(authController.protectedRoutes); // Authentication middleware

// Ensure that this function is correctly imported and defined
Router.route('/checkout-session/:tourId').get(bookingController.getCheckoutSession);

Router.use(authController.restrictTo('admin', 'lead-guide'));

Router
  .route('/')
  .get(authController.protectedRoutes, bookingController.getAllBookings) 
  .post(authController.protectedRoutes, bookingController.createBooking);

  Router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = Router;
