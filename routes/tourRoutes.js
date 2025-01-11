const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require("./../controllers/authController")
const reviewRouter = require("./../routes/reviews")
const bookingRouter = require("./../routes/bookingRoutes")
const router = express.Router();


router.use('/:tourId/bookings', bookingRouter);

router.use("/:tourId/reviews", reviewRouter) 

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

