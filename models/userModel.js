const mongoose =require("mongoose");
//const  slugify  = require("slugify");
const validator = require("validator");
const bcrypt = require("bcrypt")
const crypto =require("crypto")

const userSchema = new mongoose.Schema({
    name: {
    type:String, 
    required:[true, "A User must have a name"],
    unique: true,
    // maxLength:[40, "User name must have less than or equal to 40 characters"],
    //   minLength:[10, "User name must have greater than or equal to 10 characters"],
      validate:{
        validator:function(val)
        {
          return /^[a-zA-Z ]*$/.test(val)
        },
        message : "User name should be only alphabetical"
      }    
    },
    email: {
        type: String, 
        required:[true, "A User must have a email"],
        unique: true,    
        lowercase:true,
        validate:[validator.isEmail, "Please provide a valid email."],
        },
        photo: {
          type: String,
          default: 'default.jpg'
        },
    role:{
            type :String,
            default : 'user',
            enum: {
                values: ['user','guide','lead-guide','admin'],
                message: '{VALUE} is not supported'
              },
        },
    password: {
        type:String,
        required:[true, "Please provide  password"] , 
        minLength : 8,
        select:false  // to hide password field
        },
    passwordConfirm:{
        type:String,
        required: [true, "Please provide confirm password"],
        //This will work on save and create.
        validate:{
            validator: function(el)
            {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt:{
        type: Date
    },
    bookings: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Booking'
      }
    ],
    passwordResetToken: String,
   passwordResetExpires: Date,
   isloggedInUser:{
    type: Boolean,
      default: false
   },
     active: {
      type: Boolean,
      default: true,
      select: false
    }
    

})

// Before save or create the password will becrypt encrypted hash
userSchema.pre("save", async function(next)
{
    //If password not hashed then it will go for next

    if(!this.isModified("password")) return next()
    
    this.password = await bcrypt.hash(this.password,13);

    this.passwordConfirm = undefined;

    next();
})

 //To update changeAt property before save
 userSchema.pre("save", async function(next)
 {
     if(!this.isModified("password") || this.isNew) return next()
 
       this.passwordChangedAt = Date.now()-1000
     next();
 })

// //query middleware filtered out the data based on property value

// userSchema.pre(/^find/, function(next) {
//   // this points to the current query
//   this.find({ active: { $ne: false } });
//   next();
// });



// verify password
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Password changed after token issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
  
      return JWTTimestamp < changedTimestamp;  // true means password got changed
    }
  
    return false;
  }

  userSchema.methods.createPasswordResetToken = async function()
  {
    const resetToken = crypto.randomBytes(32).toString('hex')
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest('hex')
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000  // resetpassword link will get expire after 10 min
    return resetToken;
  }



const Users = mongoose.model('User',userSchema)

module.exports = Users;