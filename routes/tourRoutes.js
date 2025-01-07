const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require("./../controllers/authController")
const reviewRouter = require("./../routes/reviews")
const bookingRouter = require("./../routes/bookingRoutes")
const router = express.Router();

// router.param('id', tourController.checkID);
// better api enhance with middleware for queryParam

router.use('/:id/bookings', bookingRouter);
//Tour is parent model of reviews, so we have to use parent route path(tour route).
//Nested Routes
router.use("/:tourId/reviews", reviewRouter) // nested routes to get review from tour(parent) routes.

//custom api routes
router.route("/top-5-cheap").get(tourController.aliasTopTours, tourController.getAllTours)
router.route("/tour-stats").get(tourController.getTourStats);


router.use(authController.protectedRoutes);
router
  .route('/:id')
  .get(tourController.getTour)

router.route("/monthly-plans/:year").get( 
   authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMonthlyPlans);

 router.route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)  
  .post( authController.restrictTo('admin', 'lead-guide'),
         tourController.createTour);
router
  .route('/:id')
  .patch(
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete( authController.restrictTo('admin', 'lead-guide'),
           tourController.deleteTour);


  

module.exports = router;

