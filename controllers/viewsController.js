const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

 
  
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {

  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }


 
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

exports.getSignUpForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'signup into your account'
  });
};


exports.getAccount = (req, res) => {

  if (!req.user) {
    return res.redirect('/login');
  }
  
  res.render('account', {
     title: 'Your account',
    user: req.user, 
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  });
});


exports.getMyTours = catchAsync(async (req, res, next) => {
  try {
    // Fetch the user's bookings
    const bookings = await Booking.find({ user: req.user.id }).populate('user', 'name email').populate('tour', 'name');
    
    // Log the bookings to check if they are fetched correctly
  
    
    if (!bookings.length) {
      return res.status(200).render('overview', {
        title: 'My Tours',
        message: 'You have no bookings yet.'
      });
    }

    // Fetch the tour details based on the tour IDs in the bookings
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    // Log the fetched tours to check if they are correct
    console.log('Tours Found: ', tours);

    res.status(200).render('overview', {
      title: 'My Tours',
      tours
    });
  } catch (err) {
    next(err); 
  }
});

 
