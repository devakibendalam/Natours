const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // Parent referencing: Bcz we don't want potentially huge arrays in any parent element. Here tour, user models are parents to review model.
    // Establishes references between the Review model and other models (Tour and User models) using mongoose.Schema.ObjectId.
    //tour: Reference to the tour the review belongs to.
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    // user: Reference to the user who wrote the review.
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    // virtual properties (fields not stored in the database but calculated) show up in JSON and object outputs.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Preventing Duplicate Reviews: The aim is to prevent users from submitting multiple reviews for the same tour, avoiding duplicate reviews in the database.
//A unique compound index is created to enforce uniqueness in combinations of user and tour IDs, ensuring each user can only review a tour once.The 1 represents ascending order for indexing.
//  The second argument is an options object specifies that the combination of the tour and user fields must be unique in the database.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Populate the reviews with both the user and the tour data
// When you want to populate two fields then you need to call populate twice. So once for each of the fields.
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //     path: 'tour',
  //     select: 'name'  // it selects & shows only name of the tour
  // }).populate({
  //     path:'user',
  //     select: 'name photo'
  // });

  //problem of excessive populating causing chain populates, which might impact performance.
  //Do not need the tour data on each review so disable populating on tour data
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// Calculating Average Rating on Tours:
// Needs to calculate and store average ratings and the number of ratings for each tour document.
// Calculate average ratings and the number of ratings each time a new review is added to a tour or when a review is updated or deleted.
// Implement a static method on the schema called calcAverageRatings that takes a tour ID and calculates these statistics for the corresponding tour.
// Use middleware (post save hook) to call the calcAverageRatings method each time a new review is added or updated.
// A static method in Mongoose is a method associated with the model itself, not with the instances of that model (documents). Instance method associates with documents.
//We can also define static method on direct model directly rather than defining them within the schema. like Review.calcAverageRatings.
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // Use MongoDB's aggregation framework to calculate statistics for a specific tour
  const stats = await this.aggregate([
    // In static method this points to current model. Here aggrigarte need to call on Review model.
    {
      $match: { tour: tourId }, // Match reviews for the specified tourId
    },
    {
      $group: {
        _id: '$tour', // Group reviews by the tour ID
        nRating: { $sum: 1 }, // Calculate the total number of ratings
        avgRating: { $avg: '$rating' }, // Calculate the average rating
      },
    },
  ]);
  // console.log(stats); //returns stats as an array that contains tourid at 0 index

  if (stats.length > 0) {
    // Update the Tour model with the aggregated statistics
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating, // Update the ratings quantity field in the Tour model
      ratingsAverage: stats[0].avgRating, // Update the ratings average field in the Tour model
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// To call calcAverage Ratings we need to use post hook.
// Execute the 'calcAverageRatings' function after a new review is saved
reviewSchema.post('save', function () {
  // 'this' refers to the current review document
  // 'this.constructor' refers to the model that created this document (Review model)
  // Call the 'calcAverageRatings' function with the tour ID associated with the current review
  this.constructor.calcAverageRatings(this.tour);
});

// Need to access the document in middleware when a review is updated or deleted using findByIdAndUpdate or findByIdAndDelete.
// for this implement middleware for update and delete operations on reviews because MongoDB doesn't provide direct access to the document in query middleware.
// Using findOne to access the current review document  to execute a query and obtain the current document being processed in the pre-middleware and then pass the data to the post-middleware by saving it as a property (this.r).

// This middleware intercepts queries that start with 'findOneAnd' (e.g., findByIdAndUpdate, findByIdAndDelete).BCZ javascript behind the sences findByIdAndUpdate only shorthand for findOneAndUpdate with current id.
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Inside the pre-middleware function, 'this' refers to the current query being executed
  // 'this.findOne()' fetches the current document and to  pass the data to the post-middleware assigns it to 'this.r'
  this.r = await this.findOne().clone();

  // console.log(this.r);
  next();
});
//Then need to calculate statistics in post-middleware since in pre-hook data is not updated at that time. So  the data is  updated in the database at post hook.
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed.
  //'this.r' holds the document fetched in the pre-middleware
  //call ('calcAverageRatings') to calculate statistics or perform actions based on 'this.r.tour'
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
