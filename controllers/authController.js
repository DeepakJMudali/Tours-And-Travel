const catchAsync =require("./../utils/catchAsync") // it will handle try catch block
const User = require("../models/userModel")
const jwt = require("jsonwebtoken")
const AppError = require("../utils/appError")
const Email = require("../utils/email")
const {promisify} = require("util")
const crypto = require('crypto');

const signToken= (id,role)=>{
  return jwt.sign({id,role}, process.env.JWT_SECRET,{expiresIn: process.env.JWT_EXPIRES_IN})   
}

const createSendToken= (user,statusCode,res)=>
{
  const token = signToken(user._id,user.role );
  console.log("token",token)
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  // Remove password from output
  user.password = undefined
  if(process.env.NODE_ENV === "production") cookieOptions.secure = true

  res.cookie("jwt",token,cookieOptions)

  res.status(statusCode).json({
    status:"success",
    token,
    data:{
      user
    }
  })
}

exports.signupUser= catchAsync(async (req, res,next) => {
    const newUser= await User.create(req.body)
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser,url).sendWelcome();

     createSendToken(newUser,201,res)
  });

  exports.loginUser = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    console.log("email",email)
    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password +isloggedInUser');
    
  console.log("userrrrr",user)
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
  
       // Set 'isloggedInUser' to true for the authenticated user
    user.isloggedInUser = true;  // Set after user is found

    // Optionally save this status to the database
    await user.save({validateBeforeSave:false});
    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  });

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // Very short expiration time
    httpOnly: true, // Prevent access from client-side scripts
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // Cross-site cookie support
  });
  res.status(200).json({ status: 'success' });
};

exports.protectedRoutes = catchAsync(async (req, res, next) =>{
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});



exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      console.log("currentUser",currentUser)
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};


exports.restrictTo=(...roles)=>
  {
    return (req,res,next)=>
    {
     
      if(!roles.includes(req.user.role)) 
      {
        return next(new AppError("You do not have permission to perform this action", 403))
      }
      next();
    }
  }

  exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError("No user found with this email id", 404));
    }
  
    // 2) Generate the random reset token
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false }); // validateBeforeSave is false to skip validation during the save
  
    try {
      // Corrected the extra closing brace in the resetURL string
      const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
      
      // Send reset email
      await new Email(user, resetURL).sendPasswordReset();
  
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      // Clear the reset token and expiration if the email sending fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
  
      // Pass the error properly to the next middleware
      return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
  });
  


  exports.resetPassword = catchAsync(async (req, res, next) => { // this will get token by request.params from route of "/resetToken/:token at the time of hit by email"
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
  console.log("hashedToken",hashedToken)
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
  
    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;  //updating the password by reseting
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  
    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);

    // const token = signToken(user._id)

    // res.status(200).send({
    //   status:"success",
    //   token
    // })
  });

// To change password

exports.updatePassword = catchAsync(async (req, res, next) => {

  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});


