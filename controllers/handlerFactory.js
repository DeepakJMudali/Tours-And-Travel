const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

  exports.updateOne = Model =>
    catchAsync(async (req, res, next) => {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
  
      if (!doc) {
        return next(new AppError('No document found with that ID', 404));
      }
  
      res.status(200).json({
        status: 'success',
        data: {
          data: doc
        }
      });
    });
  
  exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
      const doc = await Model.create(req.body);
  
      res.status(201).json({
        status: 'success',
        data: {
          data: doc
        }
      });
    });
      
    exports.getOne = (Model, popOptions, excludeVirtuals = []) =>
      catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        

        if (popOptions) {
          if (Array.isArray(popOptions)) {
            popOptions.forEach(option => {
              query = query.populate(option);
            });
          } else {
            query = query.populate(popOptions);
          }
        }
    
        const doc = await query.exec();
    
        // If document is not found
        if (!doc) {
          return next(new AppError('No document found with that ID', 404));
        }
    
        // Convert to plain object with virtuals
        const docObject = doc.toObject({ virtuals: true });
    
        // Remove specified virtual fields
        const removeVirtuals = (obj) => {
          excludeVirtuals.forEach((virtualField) => {
            console.log(`Checking for virtual field: ${virtualField}`);
            if (obj[virtualField] !== undefined) {
              console.log(`Removing virtual field: ${virtualField}`);
              delete obj[virtualField];
            } else {
              console.log(`Virtual field not found: ${virtualField}`);
            }
          });
        };
    
        // Remove virtual fields from the main document
        removeVirtuals(docObject);
    
        // Remove virtual fields from populated fields
        if (docObject.bookings && docObject.bookings.length > 0) {
          docObject.bookings.forEach((booking) => {
            if (booking.tour) {
              removeVirtuals(booking.tour);
            }
          });
        }
    
        // Send the response
        res.status(200).json({
          status: 'success',
          data: {
            data: docObject,
          },
        });
      });
    
    



    exports.getAll = Model =>
      catchAsync(async (req, res, next) => {
        // To allow for nested GET reviews on a specific tour
        let filter = {};
        let doc ;
        if (req.params.tourId) filter = { tour: req.params.tourId };
    
        // Build the query with APIFeatures
        if(Model.modelName === "Booking")
        {
        const features = new APIFeatures(
          Model.find(filter).populate({
            path: 'tour', 
            select: 'name price summary imageCover',
          }),
          req.query
        )
          .filter()
          .sort()
          .limitFields()
          .paginate();

           doc = await features.query;
       }else{
        const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
       //const doc = await features.query.explain();
         doc = await features.query;
       }
        // Execute the query
     
    
        // Send response
        res.status(200).json({
          status: 'success',
          results: doc.length,
          data: {
            data: doc,
          },
        });
      });
    