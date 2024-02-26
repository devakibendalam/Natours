//Loads the data from json file to database:
// This file completely independent from express application and run only once at begining.

const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false
  })
  .then((con) => {
    console.log('DB connection successful!');
  });

// READ JSON FILE -> Convert from json to javascript object using json.parse()
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    // create method also accepts an array of objects. In this case it creates a new document for each object in the array.
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM THE COLLECTION
// deleteMany() & pass nothing in there will delete all the documents in that collection.
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit(); //aggressive way of stopiing application
};

// console.log(process.argv);
//run this file : node ./dev-data/data/import-dev-data.js
// process.argv to retrieve command-line arguments when a Node.js script is executed. The output of process.argv is an array containing the command line arguments provided.

// process.argv returns an array where the first element is the path to the Node.js executable and the second element is the path to the executed JavaScript file.

// The script checks the third argument (index 2) provided in the command line to determine which function to call: importData() if --import is passed or deleteData() if --delete is passed.

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
