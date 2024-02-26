const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

// A schema in Mongoose is a blueprint that defines the structure of documents within a collection in MongoDB.
// Schemas define the fields, their types, default values, validators, and other constraints for documents in the collection.
// "model" refers to a constructor function that provides an interface to interact with a specific MongoDB collection. Models in Mongoose are created from schemas and allow developers to perform CRUD (Create, Read, Update, Delete) operations on the associated collection.
// Creating a schema for a "tour"
const tourSchema = new mongoose.Schema(
  {
    // Takes fiels with schema type options. like type required,default,unique min and max,enum etc
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // Custom error message for the 'name' field should be mention in array.
      unique: true,
      trim: true, //trim only works for string schema type and trime removes whitespaces begining & ending.
      maxlength: [40, 'A tour must have less or equals to 40 chars'],
      minlength: [10, 'A tour must have greater or equals to 10 chars'],
      // validate: [validator.isAlpha, 'Tour name must only contains chars']  //custom validator by using 3rd party module
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: ['easy', 'medium', 'difficult'],
      message: 'Difficulty must be one of: easy, medium, difficult', // Error message (Note: This isn't a valid option in Mongoose)
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // Mongoose setter function takes callback function as a parameter to set rounded average rating values.
      set: (val) => Math.round(val * 10) / 10, // 4.66666,  46.66666,  47,  4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom validator to check if the priceDiscount is less than the price
      validate: {
        // this only points to current doc on NEW DOCUMENT CREATION.
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price.',
        //{VALUE} is the mongoose feature to access value
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, //Name of the img and a reference will be stored in the database. // Its a comman practice to store image names and just put the images in the filesystem.
      required: [true, 'A tour must have a cover image'],
    },
    // Rest of the images are stored as array of strings.
    images: [String], //an array in which we have number of strings.
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //permenantly hides from output
    },
    // Start dates are dates at which a tour starts
    startDates: [Date], //array of start dates
    // Mongo automatically parse the given datestring to date

    secretTour: {
      type: Boolean,
      default: false,
    },
    // starting location for the tour and multiple locations embedded within the tour document, each with their own coordinates, address, description, and day information.
    // Storing geospatial data in MongoDB using GeoJSON.
    startLocation: {
      // GeoJSON -> Mongodb uses special data fromat called geojson in order to specify geo spatial data.
      // This is embedded object and in this we can specify couple of properties. In order to recognize this as geospatial JSON, we need type & coordinates. and each of these sub fields gets its own schema type options
      // Creating schema types for geospatial data, including coordinates and type (point, polygon, etc.).
      type: {
        type: String, // Declares the type of the geospatial data as a string.
        default: 'Point',
        enum: ['Point'], // Restricts the possible values for the type to only 'Point'.
      },
      coordinates: [Number], // An array of numbers representing coordinates (longitude, latitude) order matters!.
      address: String,
      description: String,
    },
    // In order to really create a document and then embed them into another document need to create an array
    // Embedding documents for locations within a tour document.
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //   guides: Array  // embedding Tour Guides

    // Establish connections between tours and users through references, not embedding.
    // Only storing user IDs as references for tour guides in a specific tour document.
    guides: [
      {
        type: mongoose.Schema.ObjectId, //mongodb id type for each element
        ref: 'User', // Establishes references b/w different data sets in mongoose
        //reference to the 'User' model and there's no need to import the 'user' model dirrectly into the document
        //Population used to replace referenced fields in a document with actual data when querying from MongoDB,using Mongoose. populate process always happen on query.
        // populate() method replaces the referenced field (guides) with actual related data from the referenced collection (User model).
      },
    ],
  },
  {
    // Mongoose needs explicit instructions to include virtual properties in output data.
    //add these schema option to include virtuals in JSON output.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Improving Read Performance with Indexes
// The .index() method is used in  Mongoose in JavaScript, to create indexes on one or more fields within a collection's schema
// Accepts an object where keys represent fields and values specify the index type (e.g., ascending, descending).
// used to Enhance query performance by organizing and optimizing data storage.
// Types:
// Single Field Index: Indexes a single field, speeding up queries on that field.
// Compound Index: Combines multiple fields into one index, beneficial for queries involving those fields together or individually.
// Impact: Improves query speed but increases storage space and affects write performance.
// Consideration: Should be applied based on the most frequent and performance-critical queries in your application.
// tourSchema.index({ price:1 }); //Single field indexing
tourSchema.index({ price: 1, ratingsAverage: -1 }); //compound indexing
// 1 here specifies an ascending index and -1 descending index.
// compound index allows the database to efficiently handle queries that involve both price and ratingsAverage fields, as well as queries that involve either field independently. It can significantly improve the performance of read operations that rely on these fields within the tourSchema.
tourSchema.index({ slug: 1 });
// This index is specifically created as a 2dsphere index type, which is suitable for geospatial data representing real points on the Earth's surface.  It enables efficient querying of geospatial data associated with the startLocation field, allowing geospatial queries such as finding locations within a certain radius or along specific coordinates. This type of index is designed to handle and optimize geospatial queries on a spherical surface like the Earth.
//Or instead, we can also use a 2D index if we're using just fictional points on a simple two dimensional plane but we are working on real points on the Earth's surface ,so we're going to use a 2D sphere index here.
tourSchema.index({ startLocation: '2dsphere' });

// Virtual properties :
// Virtual properties are schema fields that are not persisted in the database but defined for modeling convenience.
// Useful for fields that can be derived or calculated from existing data without requiring separate storage.
tourSchema.virtual('durationWeeks').get(function () {
  // get() method calculates the virtual property when data is fetched from the database.
  return this.duration / 7;
});
// Noted that virtual properties cannot be used directly in queries since they don't exist in the database.
// Understanding virtual properties as a means to keep business logic within the model and reduce dependency on controllers for such operations.

// Virtual populate
// The problem related to data referencing between models.
// The problem here is how to efficiently access related data between 'tours' and 'reviews' in a MongoDB database using Mongoose.
// First way is  Child referencing, involvs to storing an array of review IDs in each tour document,  easier access to reviews for a particular tour. But, this method has drawbacks like potentially indefinite growth of the review ID array.
// Second way is Parent referencing, this allows tours to link to reviews, but retrieving reviews for a specific tour becomes challenging.
// Best solution for this problem is 'Virtual Populate,' a feature provided by Mongoose to address these issues. 'Virtual Populate' helps fetch related data without actually storing it in the database.
//By using virtual populate we can get access to all the reviews for a certain tour but without keeping this array of ids on the tour.
//  Virtual fields in Mongoose allow you to define properties on your documents that are not stored directly in the database but can be retrieved as if they were.
tourSchema.virtual('reviews', {
  // virtual field named 'reviews' within the 'tourSchema'.
  ref: 'Review', // specifies the referenced model
  //establishes a connection between the 'Tour' model and the 'Review' model, indicating that the 'reviews' field in 'Tour' will be populated with data from the 'Review' model.
  foreignField: 'tour', //specifies the field in the 'Review' model, that stores the reference to the current 'Tour' model.
  localField: '_id', //specfies where that id is actually stored in the current Tour model that is _id.
});

// Middlewares in Mongoose
// Similar to Express, Mongoose also implements middleware. Middleware in Mongoose is referred to as hooks and can be executed before or after certain events.
// There are four types: document, query, aggregate, and model middleware.
// Document Middleware: It operates on the currently processed document, allowing modification before saving it to the database. Examples include running functions before or after saving a document.
// pre-save middleware, allowing modifications to the document before saving.
// post-save middleware executes after the document has been successfully saved to the database
// post middleware, which operates after all pre middleware has completed,example is showcasing logging the finished document after it's saved.
// we can also use multiple middleware functions for the same hook/event(like save event)
// pre/post middileware also calls pre/post hooks
// runs only for .save() and .create() . This is not work on insertMany & update..

// Document Middleware: pre-save hook
tourSchema.pre('save', function (next) {
  // 'this' refers to the current document being processed
  // to generate a slug from the document name before saving
  this.slug = slugify(this.name, { lower: true });
  next();
});

// embedding tour guide documents into a tour document.
// tourSchema.pre('save', async function(next) {
//       // Mapping over the guide IDs to fetch corresponding user documents.
//       const guidesPromises = this.guides.map(async id => await User.findById(id));

//       // Resolving all the promises concurrently to get user documents.effectively replacing the array of guide IDs (this.guides) with an array of user documents.
//       this.guides = await Promise.all(guidesPromises);
//     next();
// });
//limitations of embedding data is specifically regarding updates. the issue is needing to manually update embedded data if any referenced information changes, such as a guide's email address or role.
//So use referencing users instead of embedding for this  tour guide documents

// Another pre-save middleware to perform other operations if needed
// tourSchema.pre('save', function (next) {
//   // Perform additional operations if required
//   // This middleware will be executed before saving the document
//   next();
// });

// Post-save middleware: execute after the document is saved
// tourSchema.post('save', function (doc, next) {
//   // 'doc' represents the saved document
// //   console.log('Document saved:', doc);
//   next();
// });

// QUERY MIDDLEWARE:
// Query middleware allows functions to run before or after a specific query executes in Mongoose.
// Query middleware differs from document middleware in query hook it operates on queries rather than individual documents.

// Pre-find Hook
// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function (next) {
  // pre-find middleware function for any query starting with 'find'.
  // Using a regular expression /^find/ ensures it matches any command starting with 'find'.

  // Within the middleware function, 'this' refers to the current query object.
  // modifies the query by adding a condition to filter.
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();

  next();
});

// Populating Tour Guides:
// populate() in Mongoose to fetch related data from referenced collections and replace references in the original document.
// populate() method in queries to retrieve referenced data.
// query middleware in Mongoose to automatically populate fields in all queries using a regular expression that targets queries starting with "find".
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides', // used to populate the 'guides' field in a document with data from another collection.
    select: '-__v -passwordChangedAt', // it is an option that specifies which fields to exclude from the populated data. - sign hides from data.
  });
  next();
});

// // Post-find Hook
// This middleware executes after the find query is completed.
tourSchema.post(/^find/, function (docs, next) {
  // Outputs the time taken by the query by subtracting the start time recorded earlier from the current time.
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);

  // console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE :
// allows modification of aggregation pipelines before or after executing aggregation operations.
// tourSchema.pre('aggregate', function(next) {
//     // this keyword references the current aggregation object within middleware functions.
//     // unshift() adds a new stage at the beginning of the pipeline array.
//     this.pipeline().unshift({ $match: { secretTour:{ $ne:true }} });
//     //  adding a $match stage at the beginning to exclude documents where secretTour is true.

//     // console.log(this.pipeline());
//     next();
// });

// Creating a model named 'Tour' based on the defined schema
// Model names should be capitalized names.
const Tour = mongoose.model('Tour', tourSchema);

/*
// Creating Document:
// testTour is an instance of the Tour model and represents a new document.
const testTour = new Tour({
    name: 'The Forest Hiker',
    rating: 4.7,
    price: 497
});

//.save() Method: Saves the created document to the MongoDB database and returns a promise.
// instance methods, like .save(), are available on the testTour object.
testTour.save()  //The resolved value of the promise is here the final document as it is in the database.
.then(doc => {
    console.log(doc);
})
.catch(err => {
    console.log('ERROR 💥', err);
}); 
*/

// Data Validation in Mongoose :
// Mongoose provides powerful ways of validating data entering the model.
// Validation involves checking if entered values adhere to the defined schema and ensuring required fields have values.

// Data Sanitization involves removing unwanted characters or potentially harmful code from input data.

// Fat Model, Thin Controller:
// The validation process occurs on the model due to the "fat model, thin controller" philosophy, allowing models to be the ideal place for validation.

// Builtin validators:
// Mongoose offers various built-in validation tools:
// required: Validates that a field has a value.
// unique: Checks for duplicate values (not a strict validator but produces errors).
// minlength and maxlength: Validate string length.
// min and max: Validate numeric ranges.
// enum: used for fields where the value should be one of a predefined set of options (such as selecting from a list of choices).
// For enum dissplay error like this
// {
//   type: String,
//   enum: {
//     values: ['easy', 'medium', 'difficult'],
//     message: 'Difficulty must be one of: easy, medium, difficult'
//   }
// }

// Custom validators:
// Built-in validators may not cover all validation needs. Custom validators can be created.
// A custom validator in Mongoose is essentially a function that returns true or false based on validation success.
// The validator is defined within the validate property of a SchemaType options object.
// Noted that this inside a validator only points to the current document when creating a new document, not on update operations.
// "validator" library available on npm for string validation.
// various methods available in the validator library for different validations (e.g., checking if a string contains only letters, numbers, specific formats like ISBN, credit card numbers, etc.).

module.exports = Tour;
