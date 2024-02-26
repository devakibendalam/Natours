const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  // to transform the error into an AppError with a friendly message means opeartional.
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // Extract the duplicate value from the error message using a regular expression match.
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please  use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message); //Object.values() to extract an array of error messages from the err object's errors property. It maps over each element (el) in the array of errors and retrieves the message property from each error object.

  // Combining the extracted error messages into a single string with a prefixed message
  const message = `Invalid input data. ${errors.join('. ')}`;

  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token. Please login again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please login again!', 401);

// Rendering Error pages :
//The error handling strategy that has been implemented for both development and production environments. In both includes two branches for handling errors, one for API responses and another for rendered web pages.  In production further categorization into operational and unknown errors. If the error is an operational error (known and trusted), the corresponding error message is sent. If the error is unknown or untrusted, a generic error message is sent.

// Sending detailed error messages for development environment.
const sendErrorDev = (err, req, res) => {
  // A) API
  // The original URL is the entire URL, excluding the host.
  // It looks like the route and is used for testing.
  if (req.originalUrl.startsWith('/api')) {
    // The URL is checked if it starts with "/API."
    // If it does, an error response is sent as JSON.
    // If not, an error template ("error.pug") is rendered with a specified title.
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) RENDERED WEBSITE
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

// Sending simplified error messages for the production environment.
const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Opeartional, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // B) Programming or other unknown error: don't leak error details
    // 1) Log Error
    console.error('ERROR💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE
  // A) Opeartional, trusted error: send message to client
  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  // B) Programming or other unknown error: don't leak error details
  // 1) Log Error
  console.error('ERROR💥', err);
  // 2) Send generic message
  return res.status(statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again localStorage.',
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);  // stack trace shows where the error happens

  // Setting a default status code of 500 (Internal Server Error) if not provided in the error object
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // three types of errors that need handling:
    // 1) Invalid ID error when an invalid MongoDB ID is queried.
    // 2) Duplicate field error when trying to create a document with a duplicate value.
    // 3) Validation error when updating a document with invalid data.

    // Mark these errors as operational to send meaningful responses to clients in production.

    // 1) Handling Invalid Database IDs-> CastError: Cast to ObjectId failed error
    // let error = {...err};  // insted od modifying the original error object (err); create a copy (error) and modify //for old mongoose
    // let error = Object.create(err); // for updated mongoose
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);

    // 2)Handling Duplicate Database Fields ->  "code": 11000 means Duplicate key error
    // The error (with code 11000) arises due to trying to create duplicate fields when its set to unique.
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // 3) Handling Mongoose Validation Errors : validation errors occur when trying to update a tour with invalid data.
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    // JSON Web token error
    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    // Jwt token expired error
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
