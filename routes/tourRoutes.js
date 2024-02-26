const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRouter');
// we can also destruct all functions with same name also
// const {getAllTours, createTour} = require('./../controllers/tourController');

const router = express.Router(); //Creating a new router and saveit in a variable and then use

// Nested routes with mergeparams
// Utilize router.use to instruct the tour router to use the review router for certain routes.
router.use('/:tourId/reviews', reviewRouter);

// Param middleware : param middleware is middleware that only runs for certain parameters when we have a certain parameter in our URL.
// router.param() function is used to define param middleware.
// When a URL with the 'id' parameter is matched, this middleware is triggered.
// The callback function takes four parameters: req,res,next and val
// val: Represents the value of the 'id' parameter extracted from the URL.
// router.param('id', (req, res, next, val) => {
//     next();
// });
// router.param('id', tourController.checkID );

// Separate Handlers from Routes:
// app.get('/api/v1/tours/', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours/', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// 3) ROUTES
// Chaining Routes:
// Express.js' app.route() method is utilized to streamline route definition for common URLs (/api/v1/tours/ and /api/v1/tours/:id).
// The HTTP methods (GET, POST, PATCH, DELETE) for these URLs are chained together using app.route() for better code readability and organization.
// Chaning the http methods by using common route
// app
// .route('/api/v1/tours/')
// .get(getAllTours)
// .post(createTour);

// app
// .route('/api/v1/tours/:id')
// .get(getTour)
// .patch(updateTour)
// .delete(deleteTour);
// INsted of using app object on all resourses create one router for each of the resourses.

//  alias routes : To simplify and provide easy-to-remember endpoints for commonly requested data.
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Creating route for Aggregation Pipeline
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

//Geospatial Queries Finding Tours Within Radius:
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// we can also define this url like this also
// /tours-within?distance=223&center=-40,45&unit=mi
// /tours-within/223/center/-40,45/unit/mi

//Calculating distances
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );
// .post(tourController.checkBody, tourController.createTour);
// Chaining multiple middleware functions for same route. Here chcekBody and createTour are 2 middleware function chain them by using comma.

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );
// Two middleware functions are used - protect (for checking if a user is logged in) and restrictTo (for restricting access based on user roles) to limit access to authorized users only.

// Nested routes:
//Nested routes are used to handle resources that have a parent-child relationship, such as tours having multiple reviews.
//The nested route structure allows access to reviews associated with a specific tour.
// the user ID and tour ID should ideally come from the currently logged-in user and the specific tour.
// POST /tour/234fad4/reviews -> /tours/:tourId/reviews, indicating a review related to a particular tour.
// GET /tour/324fad4/reviews
// GET /tour/324fad4/reviews/945765fd
//nested route for handling reviews of a tour,
// router
//  .route('/:tourId/reviews')
//  .post(authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//     );
//Nested route implementation is messy and confusing due to code duplication.
//this is messy because we put a route for creating a review in the tour router. BCZ this starts with /tour. So fix this Use an advanced Express feature called mergeParams to improve the nested route implementation.

module.exports = router;
