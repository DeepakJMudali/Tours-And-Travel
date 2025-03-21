const multer = require("multer")
const AppError = require("../utils/appError") // for custom error
const catchAsync =require("./../utils/catchAsync") // it will handle try catch block
const sharp = require('sharp');
const Users = require('../models/userModel')

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.originalname}`);

  next();
});

const filterBody =(reqBodyObj, ...fieldsName)=>
  {
    const newFieldsObj={}
    Object.keys(reqBodyObj).forEach((el)=>{
      if(fieldsName.includes(el)) newFieldsObj[el] = reqBodyObj[el]
      
    })
    return newFieldsObj;
  }



exports.getAllUsers = catchAsync(async (req, res,next) => {     
  

  const users = await Users.find({})
   // Send Response

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});




exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};




exports.deleteMe = catchAsync(async(req,res,next)=>{ // It will not get deleted from Database
  await Users.findByIdAndUpdate(req.user.id,{active:false},{new:true});
  
  res.status(204).json({
    status:"success",
    message: "deleted successfully"
  })
})


exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; 
  next();
};

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await Users.findById(req.params.id)
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  console.log('User data:', user);  // Add this to inspect the user data

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});


exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterBody(req.body, 'name', 'email','photo');
  //if (req.file) filteredBody.photo = req.file.originalname;
  // 3) Update user document
  const updatedUser = await Users.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

