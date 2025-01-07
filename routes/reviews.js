const express = require('express');
const reviewController = require("../controllers/reviewsController")
const authController = require("./../controllers/authController")
 const router = express.Router({mergeParams : true}) // to get params from nested route
// router.route("/").get(reviewController.getAllReviews).post(authController.protectedRoutes, authController.restrictTo('user'),reviewController.createReviews);


router.use(authController.protectedRoutes);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;

