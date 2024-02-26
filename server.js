//Server.js is actually be our starting file where everything starts and its there when er listen to our server.
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// uncaught exceptions are in synchronous code - errors or bugs that occur but are not handled anywhere in the code.
// Catching Uncaugh Exceptions :
process.on('uncaughtException', (err) => {
  // uncaught exceptions using an event listener called uncaughtException.
  console.log('UNCAUGHT EXCEPTION!💥Shutting down...');
  console.log(err.name, err.message);
  process.exit(1); //compulsory to exit bcz to fix unclean state the process need to terminate
  // place this error handler before the execution of other code to ensure errors are caught properly. So place at top.
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// console.log(app.get('env'));  //development
// console.log(process.env);  // to access all environment variables in node.js; process.env gives all available env variables.

// MongoDB Connection :
//mongoose library, a tool that simplifies interactions with MongoDB databases in Node.js.
//mongoose.connect() function is used to connect to a MongoDB database using Mongoose. It takes two main parameters i.e are database connection string and object of options. These options are need to specify in order to deal with some deprecation warnings.
mongoose
  .connect(process.env.DATABASE_LOCAL, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false
  }) // connect method returns promise so need to handle that.
  .then(() => {
    // console.log(con.connections); //con is here connection object that is resolved promise here
    console.log('DB connection successful!');
  });

//Start the server by using app variable
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Global Handling Unhandled Promise Rejection:
// When dealing with Node.js applications, unhandled promise rejections can occur due to errors happening outside the Express application's primary error-handling middleware. This can include issues like failing database connections, such as problems encountered when connecting to a MongoDB database.
// process.on('unhandledRejection') refers to setting up an event listener for the 'unhandledRejection' event in the Node.js process object. This event is emitted when a Promise is rejected
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!💥Shutting down...');
  server.close(() => {
    // process of closing the server, allowing it time to finish handling pending requests before shutting down.
    //exit(1) signify an uncaught exception or error and exit(0) indicates success
    process.exit(1);
  });
});
