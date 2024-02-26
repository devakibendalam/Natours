// Define a class called AppError that extends the built-in Error class
class AppError extends Error {
    // Constructor function that takes in 'message' and 'statusCode' parameters
    constructor(message, statusCode) {
        // Call the parent constructor (Error class) with the 'message' parameter
        super(message); // Error class takes only message parameter  

        // Set the 'statusCode' property of the AppError instance to the provided 'statusCode'
        this.statusCode = statusCode;

        // Set the 'status' property based on the 'statusCode' value
        // If 'statusCode' starts with '404 or 400', set 'status' to 'fail'; otherwise 500 means, set it to 'error'
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        // Specifying that errors created using this class will be operational errors, 
        // indicates an operational error
        this.isOperational = true;

        // used to capture the stack trace, allowing easier debugging by excluding the current constructor function call from the stack trace to avoid clutter.
        Error.captureStackTrace(this, this.constructor);
    }
}

// Export the AppError class to be used in other modules
module.exports = AppError;
