    // using try-catch blocks in multiple asynchronous functions makes the code messy and repetitive.
    // To address the issue, create a catchAsync function to handle asynchronous errors.
    // catchAsync is designed to be used as middleware in an Express.js application. 
    // Input: catchAsync takes fn, which is expected to be an asynchronous function (returns a Promise or makes use of async/await).
    // Function Logic:
    // The returned function ((req, res, next) => {...}) wraps the original asynchronous function fn.
    // it returns an anonymous function that Express will call when the associated route is matched.
    // When this wrapped function is invoked (usually in an Express route handler), it calls the original fn function with the provided req, res, and next parameters.
    // It then uses .catch() to catch any errors that might occur during the execution of fn.
    // If an error occurs, instead of handling it directly in the fn function, it passes the error to the next function. This effectively delegates the error to the Express error handling middleware, allowing a centralized way to handle errors throughout the application.

    // const catchAsync = fn =>{
       module.exports = fn =>{
        return (req, res, next) => {
          fn(req, res, next).catch(next);
        };
      };