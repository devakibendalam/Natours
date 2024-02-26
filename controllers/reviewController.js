const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async(req, res, next) => {
// // To implement a nested GET endpoint to retrieve reviews associated with a specific tour.
//     let filter = {}; //object will be used to create a filter condition for querying the database to fetch reviews.
//     if (req.params.tourId) filter = { tour:req.params.tourId };
//    // check if a tourId is present in the request parameters, If a tourId exists, it filters the reviews to only include those associated with that specific tourId.
//    // If req.params.tourId is not provided or is empty, it fetches all reviews.

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'success',
//         results: reviews.length,
//         data: {
//             reviews
//         }
//     });
// });

// exports.createReview = catchAsync(async(req, res, next) => {
//     // Aloow nested routes
//     // where tour and user IDs are not provided in the request body, defaulting to the IDs from the URL.
//     if(!req.body.tour) req.body.tour = req.params.tourId;
//     if(!req.body.user) req.body.user = req.user.id; //user id coming from protect middleware ensures that only logged-in users can create reviews.

//     const newReview = await Review.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             review: newReview
//         }
//     });
// });

exports.setTourUserIds = (req, res, next) => {
  // Aloow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.createReview = factory.createOne(Review);

exports.getReview = factory.getOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
