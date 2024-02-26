const express = require('express'); //import express
// Third party middleware
const path = require('path');
const morgan = require('morgan'); // Morgan which is a very popular logging middleware. a middleware that's gonna allow us to see request data right in the console.
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRouter');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
// const cors = require('cors');

// Create an instance of Express
//Assign result of calling express -> express is the function here which upon calling will add a bunch of methods to our app variable here
const app = express();

// const corsOption = {
//   origin: true,
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE"],
// };
// app.use(cors(corsOption));
// app.options("*", cors());

// Setting Up Pug in Express: configure the view engine in Express to use Pug
app.set('view engine', 'pug');
//Defining the location of the views folder
app.set('views', path.join(__dirname, 'views'));
// behind the scences path module will create a path joining the dirname/views

// 1) GLOBAL MIDDLEWARES
// Serving static files
// express.static is a built-in middleware function in Express. It's responsible for serving static files, such as HTML, images, CSS, JavaScript, etc., to the client.
app.use(express.static(path.join(__dirname, 'public'))); //Once this middleware is set up, any files present in the 'public' directory (such as HTML, images, CSS, or JavaScript files) can be accessed directly via the browser without the need to define specific routes for each file. like this (http://localhost:3000/overview.html)

// Set security HTTP headers
// 'Helmet' is a widely used npm package for setting essential security headers.
// Place 'helmet' early in the middleware stack for proper header setup(add begining).
app.use(helmet()); // app.use takes function as a parameter not function call but helemt() function call returns a middleware function.
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'", 'blob:', 'https://*.mapbox.com'],
//       scriptSrc: [
//         "'self'",
//         'https://*.mapbox.com',
//         "'unsafe-inline'",
//         'blob:',
//         'https://cdnjs.cloudflare.com',
//       ],
//     },
//   }),
// );

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'", "blob:", "https://*.mapbox.com"],
//       scriptSrc: [
//         "'self'",
//         "https://*.mapbox.com",
//         "'unsafe-inline'",
//         "blob:",
//         "https://cdnjs.cloudflare.com",
//       ],
//     },
//   })
// );

// Set security HTTP Headers
// app.use(
//   helmet({
//     crossOriginEmbedderPolicy: false,
//   })
// );

// // Further HELMET configuration for Security Policy (CSP)
// const scriptSrcUrls = [
//   "https://api.tiles.mapbox.com/",
//   "https://api.mapbox.com/",
//   "https://*.cloudflare.com",
//   "https://js.stripe.com/v3/",
//   "https://checkout.stripe.com",
// ];
// const styleSrcUrls = [
//   "https://api.mapbox.com/",
//   "https://api.tiles.mapbox.com/",
//   "https://fonts.googleapis.com/",
//   "https://www.myfonts.com/fonts/radomir-tinkov/gilroy/*",
//   " checkout.stripe.com",
// ];
// const connectSrcUrls = [
//   "https://*.mapbox.com/",
//   "https://*.cloudflare.com",
//   "http://127.0.0.1:3000",
//   "http://127.0.0.1:52191",
//   "*.stripe.com",
// ];

// const fontSrcUrls = ["fonts.googleapis.com", "fonts.gstatic.com"];

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: [],
//       connectSrc: ["'self'", ...connectSrcUrls],
//       scriptSrc: ["'self'", ...scriptSrcUrls],
//       workerSrc: ["'self'", "blob:"],
//       styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//       objectSrc: [],
//       imgSrc: ["'self'", "blob:", "data:"],
//       fontSrc: ["'self'", ...fontSrcUrls],
//       frameSrc: ["*.stripe.com", "*.stripe.network"],
//     },
//   })
// );

// Development logging
//Morgan helps view request data in the console, making development easier.
//'dev' & 'tiny' is a predefined formats in Morgan that configures the way the logging output appears in the console.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} //accessing env variables: these are available in project in every single file.
// app.use(morgan('tiny'));  //Morgan logs information about HTTP requests in the terminal, showing details like HTTP method, URL, status code, response time, etc.

// Limit requests from same API
//Rate limiting -> defines as global middleware
//Rate limiting is to restrict the number of requests an IP can make to the API within a specified time frame.
//npm i express-rate-limit to install Rate limit package
//rateLimit function it takes the object of options such as the maximum number of requests per IP (max) and the time window (windowms) for those requests in milliseconds.
//error responses (429 Too Many Requests) when the limit is reached.
const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
//limiter middleware to limit access to specific routes (in this case, the API routes).
app.use('/api', limiter);

// Body parser, reading data from body into req.body
//Middleware to parse incoming requests with JSON payloads
app.use(express.json({ limit: '10kb' })); // body larger than 10kb not accepted
//cookie-parser middleware used to parse cookies from the incoming HTTP requests and  access parsed cookies using req.cookies in their route handlers, gaining access to the data stored in those cookies.

app.use(express.urlencoded({ extended: true, limit: '10kb' })); // This line of code utilizes Express's built-in middleware to parse URL-encoded data when submitted from forms. Since forms often send data in this format, this middleware is essential for accessing the submitted information within our application. Setting extended: true allows for processing more complex data types beyond simple strings.

app.use(cookieParser()); // parses data from cookies
// middleware in Express that parses incoming requests with JSON payloads and makes the parsed data available on req.body.
// the use method is used in order to add middleware to our middleware stack, okay? so express.json here calling this json method basically returns a function And so that function is then added to the middleware stack.

//Data sanitization means cleaning All the data that comes into application to protect against malicious code and attacks.
//Data sanitization against NoSQL query injection
// NoSQL query injection :
// "email": { "$gt": "" } -> the MongoDB greater than operator, when set to nothing with the password allowing login without requiring the correct email address.
//This is  NoSQL query injection  attack can bypass authentication by manipulating MongoDB operators.
// middleware packages like express-mongo-sanitize and XSS_clean
//  this middleware's function used to removing MongoDB operators from user input.
app.use(mongoSanitize());

// Data sanitization against XSS:
// Cross-Site Scripting (XSS) attacks:
// XSS attacks allows an attacker to insert harmful HTML or JavaScript code into user input fields, which can then be executed when other users access the affected page, to performing harmful actions.
// XSS_clean' middleware to sanitize user input from malicious HTML code and prevents HTML symbols or JavaScript injection into the application & XSS it converts HTML symbols to entities.
app.use(xss());

// Prevent parameter pollution:
//Parameter Pollution is by making requests with duplicate parameters in the query string, an error occurs due to Express interpreting the parameters as an array instead of a string, leading to an inability to split the values.
//HPP (HTTP Parameter Pollution)  middleware to resolve parameter pollution issues and to remove duplicate query string parameters.
//whitelist specific parameters to permit certain duplicates in the query string while preventing others.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  console.log(req.cookies);
  next();
}); //to add a requestTime property to the req object, showing the current time in ISO string format.
// Middleware Execution Order:
// The middleware functions are executed in the order they are added using app.use().
// the order of middleware can impact their execution on specific routes. Middleware defined after a route handler might not be invoked if the route handler ends the request-response cycle prematurely.

// 3) ROUTES
//Route for Rendering the Pug Template:
app.use('/', viewRouter);

//Middleware Registration:- mounting our routes
// app.use() to mount the routers on specific URLs
//Here tourRouter is a real middleware and use that middleware on this specific url
app.use('/api/v1/tours', tourRouter); //Mounts the tourRouter middleware at the specified URL (/api/v1/tours).
app.use('/api/v1/users', userRouter); //Mounts the userRouter middleware at the specified URL (/api/v1/users).
//We cannot use the routers before we actually declare them
app.use('/api/v1/reviews', reviewRouter);

app.use('/api/v1/bookings', bookingRouter);

// Handling Undefined Routes:
// When user hits a url that does not exist like misspelling routes, or adding additional parameters then need tho handle it.
// app.all('*'...): This sets up a middleware function that will be executed for all HTTP methods (*) and any route ('*'). The asterisk * is a wildcard representing all routes.
// This route should be place at last level of the code. Bcz this need to execute last.
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //     status: 'fail',
  //     message: `Can't find ${req.originalUrl} on this server!`
  //});
  /*
// Creating an error
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    //creating an error object using JavaScript's Error constructor
    //req.originalUrl represents the original URL requested by the client.
    err.status = 'fail',
    err.statusCode = 404;

    next(err);  //to pass the created error to the error handling middleware.
    */

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Implementing a Global Error Handling Middleware :
// An error middleware function with four parameters (error, request, response, next). The first parameter, err, represents the error object. When Express detects an error during the request-response cycle, it skips regular middleware and routes and directly passes control to the error middleware by calling next() with an error parameter, triggering the error-handling logic defined within this specific middleware. this is designed to handle operational errors.
// Implementing a Global Error Handling Middleware:
app.use(globalErrorHandler);

module.exports = app;
