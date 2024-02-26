const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // imports the Stripe library, creates a Stripe object by passing the secret key obtained from the environment variable. This Stripe object, stored in the variable stripe, allows interaction with Stripe's services for payment-related actions throughout the code.
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    //This line initiates the creation of a Stripe checkout session, which is essential for handling payments securely. The session object encapsulates various details about the transaction. All field names used here are specified by Stripe and should not be changed.
    // Specifies payment method types (currently set to credit card).
    payment_method_types: ['card'],
    // Defines success and cancel URLs for redirection after payment.
    // success_url: `${req.protocol}://${req.get('host')}/`,
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    // Upon successful checkout, the browser is directed to the success URL, which is currently the homepage.
    // Due to current limitations and security concerns, we proposes a temporary solution.
    // the current approach is not secure, as anyone could potentially manipulate the URL to create a booking without payment.
    // Data needed for creating a new booking (tour, user, price) will be appended to the success URL as a query string.
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    // Prefills customer email with the user's email from the protected route.
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,

    /*
     //This is Old structure for line_items, which is no longer effective due to changes in the Stripe structure.
    line_items: [
      // This array specifies details about the product (tour) for purchase
      {
        name: `${tour.name} Tour`, // Name displayed in Stripe checkout.
        description: tour.summary, // Brief overview of the tour for customer context.
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], // Array of tour images for display during checkout.
        amount: tour.price * 100, // Tour price in cents for Stripe's currency expectation.
        currency: 'inr', // Currency code (e.g., 'inr' for Indian Rupees, 'eur' for Euros).
        quantity: 1, // Quantity of tours being purchased (usually 1 for a single booking).
      },
    ], 
    */

    // This updated structure sticks to the changes made by Stripe and provides the necessary details for the product (tour) in the line_items array, including quantity, price data, and product data. The mode is set to 'payment' to specify the purpose of the session.
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.description,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
    mode: 'payment',
  });

  // 3) Create session as response to client, providing the Stripe session object.
  res.status(200).json({
    status: 'success',
    session, // The session object is crucial for redirecting the user to Stripe's secure checkout page for payment processing.
  });
});

// Indian Card Number: 4000003560000008

// 214 - Creating New Bookings on Checkout Success
// creating a new booking document in a database whenever a user successfully purchases a tour.
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can take bookings without paying.
  // More secure solution using Stripe Webhooks will be implemented after deployment on a server. (secure access to the session object )

  // The server will extract data from the query string (tour ID, user ID, and price).
  const { tour, user, price } = req.query;

  // Checks if all required fields are present; if not, it skips to the next middleware.
  if (!tour && !user && !price) return next();

  // A new booking document will be created in the database with the extracted data.
  await Booking.create({ tour, user, price });

  // req.originalurl to obtain the entire URL from which the request originated.
  //This method helps capture the original route URL along with the query string.
  //  Use split to redirecte to the original route URL without the query string after the booking creation process.
  res.redirect(req.originalUrl.split('?')[0]); // The redirect function is used to create a new request to the original route URL, excluding the query string.
});

// CRUD OPEARTION ON BOOKINGS
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
