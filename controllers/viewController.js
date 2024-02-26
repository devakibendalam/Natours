const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build template
  // 3) Render that template using tour data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    //guides are alredy populated. so here populate reviews
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
    // If there is no tour, then return and go to the next middleware with a new AppError.
  }

  // 2) Build template

  // 3) Render template using data from 1)
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com/v3/ 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;",
    )
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', "connect-src 'self' http://127.0.0.1:3000/")
    .render('login', {
      title: 'Log into your account',
    });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

// Rendering a Users Booked Tours
exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings for the currently logged-in user.
  const bookings = await Booking.find({ user: req.user.id }); //gives an array of booking documents

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour); //Using a map function, an array of tour IDs is created  from the bookings.

  // virtual populate could be used, but the manual process is used to show the use of the in operator.
  const tours = await Tour.find({ _id: { $in: tourIDs } }); // fetches tours from the Tour model whose IDs are present in the tourIDs array, using the $in operator for efficient querying.

  // Render the 'overview' template with the retrieved tours
  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  console.log('UPDATING USER ', req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      // We can never ever update passwords using findByIdAndUpdate, because that is not going to run the save middleware which will take care of encrypting our passwords. So that is why we have a separate route for that in our API, and also we have a separate form for that in our user interface.
      name: req.body.name,
      email: req.body.email, // These are the names of the fields because we gave them the name attribute in the HTML form.
    },
    {
      new: true, // Here get the updated document as a result.
      runValidators: true,
    },
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
