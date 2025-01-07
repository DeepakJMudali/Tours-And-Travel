// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');


// Review Model is parent refertencing of Tour modal.

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
//Review is child of Tour model

    tour: {                                                             // Foreign key for tour model to do child referencing
      type: mongoose.Schema.ObjectId,                                   // review - tour (many to one) and tour - review is (1 - many)
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //to avoid duplicate review from a user for same tour

reviewSchema.pre(/^find/, function(next) {
   this.populate({path:"user",
  select:"name photo"
 })
next();
})


// we used statics method  to get access to aggregate in model level.

reviewSchema.statics.calcAverageRatings = async function(tourId) { // tourId will be get by tour from review model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId } // to target current review based on tour id
    },
    {
      $group: {
        _id: '$tour',    // it will target to model properties
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  // this points to current review

  //// after get saved into the document
  console.log("conss",this.constructor)
  this.constructor.calcAverageRatings(this.tour); // this.tour will refer to tour property of review model.
});

console.log("constructor",this.constructor.locations)

// findByIdAndUpdate
// findByIdAndDelete

//before findByIdAndUpdate by pre, it will not give the updated review .....data. 
reviewSchema.pre(/^findOneAnd/, async function(next) { // in query middleware, we don't have direct acces to the review documents

  //To bind r with this and to access this.r from pre to post middleware.

  //Query middleware can not access to the direct document. So we used this.findOne) to get all documents in query middleware scope.
  this.r = await this.findOne();  // so we used one varriable to get all the documents from DB.
   console.log("errr",this.r.constructor);
  next();
});
 

// Now it will give the updated dreview data
reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed

  //So here we are getting documents from varriable due to dont have access to model directly.
  await this.r.constructor.calcAverageRatings(this.r.tour); //this.r is equivalent to this
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
