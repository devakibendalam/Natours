const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else
    cb(new AppError('Not an image! Please upload only images.', 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  // When we have multiple file upload fields, and one field requires a single image while another can accept up to three images, upload.fields() is the ideal solution. Multer seamlessly handles this scenario. Here we construct an array where each element is an object specifying the field name. For example, {name: 'imageCover', maxCount: 1} limits the imageCover field to a single image, and {name: 'images', maxCount: 3} allows up to three images in the images field.
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// In summary, use upload.single for a single file upload field, upload.array for a single field accepting multiple files, and upload.fields for mixed scenarios like the one demonstrated above.
// upload.single('image')  // req.file
// upload.array('images',5) // req.files   // If there's only one file upload field (images) capable of accepting multiple files then use this.

//when we have multiple files it is actually on req.files, and not just file. This here "upload.single('images');" will produce req.file, while fields and the array will both produce req.files, so the plural.

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover Image - Processing the cover image.
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; // filename
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images - // Processing the other images in a loop.
  req.body.images = [];
  await Promise.all(
    // Since this is an async function, it will return a new promise. So, if we use a map function, we can save an array of all these promises. Then, with an array in hand, we can use Promise.all to await all of them. By doing so, we will await until all the image processing is complete, and only then proceed to the next line, which calls the next middleware to update the tour documents. Here forEach method is not worked thats why we use map method.
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );
  // console.log(req.body.images);
  next();
});

// Prefilling the Query Object for http://localhost:3000/api/v1/tours/top-5-cheap
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}; // aliasTopTours is a middleware function used created to set specific properties (limit, sort, fields) in the request's query object.

//  exports.getAllTours = catchAsync(async (req, res, next) => {
//   const features = new APIFeatures(Tour.find(), req.query)
//   .filter()
//   .sort()
//   .limitFields()
//   .paginate();

//   const tours = await features.query;

//       res.status(200).json({
//           status: 'success',
//           results: tours.length,
//           data: {
//              tours
//           }
//        });
//   });

// exports.getTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findById(req.params.id).populate('reviews');

//     if(!tour) {
//       return next(new AppError('No tour found with that ID', 404));
//     }

//         res.status(200).json({
//           status: 'success',
//           data: {
//             tour
//             }
//           });
//     });

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
//Need to pass populate options object to populate reviews

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);
//    exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id)

//     if(!tour) {
//       return next(new AppError('No tour found with that ID', 404));
//     }

//     // No need to send back any data while deletion
//     // Change status code to NO content which is 204.
//     res.status(204).json({
//         status: 'success',
//         data: null   //after deletion the data that we need to send back is null
//     });
// });

// Aggregation Pipeline:
// Allows the processing of documents in a collection through a sequence of stages.
// Each stage performs specific operations on the data and passes the output to the subsequent stage.
// Utilizes MongoDB's aggregation framework to present statistics by processing data.

// Aggregate Method:
// aggregate() method is employed to execute an aggregation pipeline on a collection.
// aggregate() method, the array it accepts contains objects, with each object representing a pipeline stage. Each stage/object defines a specific operation to be performed on the data as it moves through the aggregation pipeline.
// Returns an aggregate object that contains the processed data.
// Typically used in Node.js applications to perform statistical operations.

// Stages of the Aggregation Pipeline:
// $match: Filters documents in the collection based on specified conditions.

// $group: Groups documents by a specified field or expression.
// Accumulator Expressions: The $group stage utilizes accumulator expressions like $sum, $avg, $min, and $max to perform calculations and statistical operations on grouped data
// MongoDB's aggregation pipeline provides a wide range of field operators  like $toUpper to manipulate field values.

// $sort: Orders the resulting documents based on specified fields.

// Aggregation Pipeline Matching & Grouping:
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, //primilinary stage
    },
    {
      $group: {
        // _id: null, // o grouping is applied.Every document would be considered as a single group.
        _id: { $toUpper: '$difficulty' }, //groups the documents based on the 'difficulty' field and converts the value to uppercase using $toUpper.
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //     $match: {_id: {$ne: 'EASY'}}
    // }  // Stages can be repeated in the pipeline for further filtering or processing.
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// 103 - Aggregation Pipeline Unwinding and Projecting
// constructing an aggregation pipeline to calculate the busiest month in a given year by counting the number of tours starting in each month.
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // Extracting the year from the request parameters

  const plan = await Tour.aggregate([
    // Using the aggregate method on the 'Tour' model
    {
      //unwind stage used to creating a new document for each element in the array in a document.
      $unwind: '$startDates', // Deconstructing the 'startDates' array field into separate documents for each date
    },
    {
      $match: {
        startDates: {
          // filters the tours for a specific year using the $match stage
          $gte: new Date(`${year}-01-01`), // Filtering tours that start on or after January 1st of the given year
          $lte: new Date(`${year}-12-31`), // Filtering tours that start on or before December 31st of the given year
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // Grouping tours by the month they start using the $month operator
        numTourStarts: { $sum: 1 }, // Counting the number of tours starting in each month
        tours: { $push: '$name' }, // Creating an array of tour names for each month
      },
    },
    {
      $addFields: { month: '$_id' }, // Adding a new field 'month' containing the extracted month value
    },
    {
      $project: {
        _id: 0, // Excluding the default _id field from the output
      },
    },
    {
      $sort: { numTourStarts: -1 }, // Sorting the result by the number of tour starts in descending order
    },
    {
      $limit: 12, // Limiting the output to the top 12 busiest months
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan, // Sending the aggregated data as a response
    },
  });
});

//Geospatial Queries Finding Tours Within Radius - find tours within a certain distance of a specified point.

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/223/center/34.1111745,-118.113491/unit/mi
//asynchronous function to handle fetching tours within a certain distance from a center point based on latitude and longitude
exports.getToursWithin = catchAsync(async (req, res, next) => {
  // Destructuring parameters from the request URL
  const { distance, latlng, unit } = req.params;

  // Splitting using array destruction
  const [lat, lng] = latlng.split(',');

  // Calculating the radius based on the unit of measurement (miles or kilometers).
  // Based on the unit  it divides the distance by the approximate Earth's radius (mi - 3963.2) or  (km - 6378.1). This calculation helps determine the search radius for finding tours within the specified distance from a center point.
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // Checking if latitude or longitude is missing and sending an error if so
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng.',
        400,
      ),
    );
  }

  // This query searches for startLocation values within a circular area defined by the center point [lng, lat] and the radius in radians.
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  // The query is based on the startLocation field within the Tour collection.
  // $geoWithin: This is a MongoDB geospatial operator used to query for documents whose geospatial data lies within a specified shape. In this case, it's used to find locations within a specified geographic area.

  // $centerSphere: This is a geospatial operator that specifies a circular area for the query. It expects an array containing two elements. That are [[lng, lat], radius]: This array defines the center and radius of the circular area.
  // [lng, lat]: Represents the longitude and latitude of the center point of the circular area.
  // radius: Represents the radius of the circular area measured in radians

  // Response
  res.status(200).json({
    status: 'Success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// Geospatial Aggregation: Calculating Distances
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  // Calculating the multiplier based on the unit provided (mi or km) to convert km divide by 1000.
  const multipler = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng.',
        400,
      ),
    );
  }

  //The $geoNear stage is powerful for location-based queries, allowing efficient searching and sorting based on proximity to a particular geographical location.
  // $geoNear is the only stage available for geospatial aggregation in MongoDB.
  // It's mandatory for the $geoNear stage to be the first one in the aggregation pipeline.
  // $geoNear requires at least one field with a geospatial index.
  // If there's only one field (Here is startLocation.) with a geospatial index, $geoNear automatically uses that index for calculations. If multiple fields have geospatial indexes, the keys parameter can be used to specify which field to use.
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        //The near property in $geoNear specifies the point from which distances will be calculated.
        //The near property expects a GeoJSON object with the type as 'Point' and the coordinates of the specified point.
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },

        //specifies the field where calculated distances will be stored in the output documents.
        distanceField: 'distance',
        // Applying the distance multiplier (miles or kilometers) optional field
        distanceMultiplier: multipler,
      },
    },
    {
      // $project stage to shape the output, including only the distance and name fields.
      $project: {
        distance: 1,
        name: 1,
      },
    },
    //Results: $geoNear returns a sorted list of documents based on their proximity to the specified point. The documents contain additional information like the distance from the specified point.
  ]);

  // Response
  res.status(200).json({
    status: 'Success',
    data: {
      data: distances,
    },
  });
});
