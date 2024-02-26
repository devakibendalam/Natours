const express = require('express');
const viewsController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.use(authController.isLoggedIn);

// router.get('/', authController.isLoggedIn, viewsController.getOverview);
// When a GET request is made to the root URL, the middleware functions are executed in sequence. First, it creates a booking during checkout, then checks if the user is logged in, and finally, it retrieves data for and renders the overview page.
// if there's no booking-related action, the middleware will continue with other tasks, such as checking user login status and rendering the overview page. The specific impact depends on the internal logic of each middleware function.
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview,
);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours); //"My Bookings" page, displaying all tours a user has booked.

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData,
);

module.exports = router;
