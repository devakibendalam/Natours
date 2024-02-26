const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
// By default, each router has access only to its specific route parameters.
// By setting mergeParams to true, the review router gains access to parameters defined in other routers, enhancing its functionality in handling nested routes.
// mergeParams allows the child router (review router) to access parameters from the parent router (tour router) for nested routes.
// mergeParams to allow access to parameters across routers.

//creating and retrieving reviews for a particular tour
// POST /tour/324fad4/reviews
// GET /tour/324fad4/reviews
// POST /reviews

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = router;
