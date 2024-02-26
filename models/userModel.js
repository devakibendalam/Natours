const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); //builtin package no need to install

// Creating a schema for a user
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, //defaultly all chars are converted to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'], //custom validator for email
  },
  photo: {
    type: String,
    default: 'default.jpg',
  }, //stores path of the place in our file system where the image is actually uploaded
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, //to hide from output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide your password'],
    // validating if inputted passwords match using custom validator
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      Message: 'Passwords are not same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// when importing data into db need to comment these 2 middlewares(presave)
// Encrypt the password using very popular hashing algorithm called bcrypt.
//  pre-save middleware/hook : designed to execute before saving a user document to the database and performs password hashing.
userSchema.pre('save', async function (next) {
  // this points to current doc here means current user
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  //isModified() method is a function available in Mongoose, and used to determine whether a specific field in a Mongoose document has been modified && it takes a string representing the name of the field to check for modifications

  // Hash the password using the bcrypt library with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //bcrypt.hash() is an asynchronous function that returns a Promise. and it takes password and salted hash as parameter
  //The await keyword is used here to pause the execution of the code until the hash operation is completed

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

//Update changedPasswordAt property for the user
userSchema.pre('save', function (next) {
  // checks if the password field is modified or if it's a new user. If either condition is met, it updates the passwordChangedAt field.
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // token is created alwalys after the password has changed for this samll hack (-1 sec)
  next();
});

// Query middleware Here use regular expression before query to say that to apply to every query that starts with find. ex: finndUpdate, findDelete etc..
userSchema.pre(/^find/, function (next) {
  // this points to the curret query
  this.find({ active: { $ne: false } });
  // only select documents that are active .
  next();
});

// Comparing passwords for login
//Creating instance method: this is a method that is gonna be available on all documents of a certain collection.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  // bcrypt.compare is a method from the bcrypt library used to compare a plain-text password with a hashed password.
  //It takes two parameters: the plain-text password and the hashed password .
  //If the comparison is successful (both passwords match), it returns true; otherwise, it returns false.
  return await bcrypt.compare(candidatePassword, userPassword);
};

// checks if a user's password was changed after JWTTimestamp ( the issued-at time of a JWT)
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  //checks if the passwordChangedAt field exists in the user document. passwordChangedAt field in a user's data is updated to the current timestamp whenever the user changes their password.
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    ); //base 10 format
    // it extracts the timestamp and converts this to seconds (from milliseconds).

    // console.log(changedTimestamp, JWTTimestamp);

    //If JWT timestamp is less than the password change timestamp, it implies that the password was changed after the JWT was issued, then returns true in this case.
    return JWTTimestamp < changedTimestamp;
  }

  // FALSE means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // Generate a random 32-byte string encoded in hexadecimal
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Encrypt the generated token before storing it in the database.
  // Hash the generated resetToken using the SHA-256 algorithm
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  // Set the expiration time for the password reset token to 10 minutes from the current time
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
  // Returns the original, unhashed resetToken. This allows the unhashed token to be sent via email to the user for them to use during the password reset process. The hashed token (this.passwordResetToken) is stored in the database for comparison and validation during the password reset operation.
};

const User = mongoose.model('User', userSchema);

module.exports = User;
