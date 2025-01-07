const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const router = express.Router();


router.get('/my-tours',authController.isLoggedIn, authController.protectedRoutes, viewsController.getMyTours);
router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn,viewsController.getTour);
router.get('/login',  authController.isLoggedIn, viewsController.getLoginForm);
router.get('/signup',  authController.isLoggedIn, viewsController.getSignUpForm);
router.get('/me', authController.isLoggedIn,authController.protectedRoutes, viewsController.getAccount);


router.post(
  '/submit-user-data',
   authController.protectedRoutes,
   viewsController.updateUserData
);

module.exports = router;



