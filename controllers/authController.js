const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Cookies are small pieces of text sent by a server to clients and stored by browsers. They are automatically sent back with future requests to the same server.
//Storing a JSON web token (JWT) in a secure HTTP-only cookie for improved security.

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // cookie options like expires to set expiration time, secure to enforce transmission over encrypted connections (HTTPS), and httpOnly to prevent browser access(modifying by browser), crucial for preventing cross-site scripting attacks.
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    // secure:false
  };
  // secure only works for https so https available in production mode.
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Sending a cookie in the response object using res.cookie,  by specifying cookie name, token, and cookie options.
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output when creating new document(signup).
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Singingup Users
exports.signup = catchAsync(async (req, res, next) => {
  // Creating New User
  // const newUser = await User.create(req.body);
  // security flaw in the above signup functionality where anyone could register as an admin role by manipulating the data being sent.
  // So Restricting the data that's allowed to be used when creating a new user, specifically allowing only necessary fields like name, email, and password, excluding manual input of roles or other irrelevant data.

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  //JWT Token Generation:
  // jwt.sign: Used to create a new JWT token.
  // The first argument is an object containing the payload data that will be stored in the token. In this case, it includes the user's ID retrieved from newUser._id.
  // The second argument is the secret key used for signing the token. It's obtained from the environment variable process.env.JWT_SECRET, which should be securely stored on the server-side.
  // The third argument is an options object, where expiresIn is used to specify the expiration time for the token. The value is obtained from the environment variable process.env.JWT_EXPIRES_IN.
  // const token = jwt.sign({ id: newUser._id}, process.env.JWT_SECRET, {
  //     expiresIn: process.env.JWT_EXPIRES_IN
  // });

  // Sending Welcome Emails:
  //http://localhost:3000/me
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //     status: 'success',
  //     token, //The generated JWT token.
  //     data: {
  //         user: newUser
  //     }
  // });
});

// Logging in Users: Login authentication process which verifies a user's login credentials and generates a token upon successful authentication.
exports.login = catchAsync(async (req, res, next) => {
  // By using ES6 destructing get email,password from body
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  //  Explicitly selects the password field from the user document. This is because, by default, the password field might be configured to not show in the output, but by using +password, it's included.

  //accessing the correctPassword instace method on user model using user document BCZ instace method is available on all the user documents.user is a result of querying the user model so it is an user document.
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

// HTTP-only cookies cannot be manipulated or deleted in the browse, Traditional JWT logout involves deleting the token from local storage. But with http only cookie its not possible.
//A secure log-out mechanism in a web application where JWT tokens are used for authentication. Instead of directly deleting the HTTP-only cookie from the browser, Suggests that creating a new cookie with same name('jwt') but with a dummy text but without the token and a short expiration time to effectively log out the user.
exports.logout = (req, res) => {
  // This creates a simple logout route that sends back a new cookie with the same name but no token, effectively overriding the existing cookie. With an empty token, the subsequent request won't identify the user as logged in, achieving a logout. Additionally, the cookie has a short expiration time, macking deletion with a clever workaround.
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), //10 sec
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// The 'Authorization' header is commonly used in HTTP requests to send credentials or tokens to authenticate the client making the request. The 'Bearer' token is a type of access token used in OAuth 2.0 authentication.
// Ex: Authorization: Bearer your_access_token_here
// The server receiving the request can then validate the token to authorize the client to access protected resources or perform certain actions.

// Protecting Tour Routes: middleware to verify user authentication before allowing access to certain routes.
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it exists
  // checks if there's an authorization header in the incoming request and if it starts with 'Bearer'. If so, it extracts the token from the authorization header.
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // Read jwt from cookie
    // authenticate users based on tokens sent via cookies.
    token = req.cookies.jwt;
  }
  console.log(token);
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access!', 401),
    );
  }

  //jwt.verify(token, secretKey, callback): The jwt.verify method takes three parameters, callback function that will be called with either an error (if the verification fails) or the decoded token payload.Upon successful verification, the decoded object will contain the decoded payload information from the JWT.

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // promisify is available on utils package. need to require from it.
  //Promisify(jwt.verify) transforms the jwt.verify function into a version that returns a promise instead of using a callback for handling the result. These values (token, process.env.JWT_SECRET) are specified as arguments to jwt.verify through the Promisify function,
  //Once the promise returned is resolved,  the result (decoded payload of the JWT) is stored in the decoded variable.

  // 3) Check if user still exists -> means after a token has been issued, the corresponding user account has been deleted from the system
  const currentUser = await User.findById(decoded.id);
  //the middleware tries to find a user based on the ID extracted from the decoded token
  if (!currentUser) {
    return next(
      new AppError('The user belonging this token does no longer exists!', 401),
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    //"issued at" timestamp
    return next(
      new AppError('User recently changed password! please login again!', 401),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  // If all the previous checks pass without any issues, it means that the token is valid
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// This middleware function checks if a user is logged in by verifying the presence of a JWT token in the request cookies.
//Applied to all routes for rendered pages. no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verify token -> check if token present in the cookies to verify the user's login status.
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        //"issued at" timestamp
        return next();
      }

      // THERE IS A LOGGED IN USER
      //   req.locals = req.locals || {};
      //req.locals is properly initialized before attempting to set properties on it. If req.locals is undefined or null, trying to set req.locals.user will result in this error.
      res.locals.user = currentUser; // Stores the user's information in response.locals.user to make it accessible in Pug templates to conditionally render UI components based on the user's login status.
      console.log(res.locals.user);
      return next();
    } catch (err) {
      // Fixing JSON Web Token Error at logout implementation:
      // A JSON Web Token error occurs due to a malformed token during the logout attempt. Because its jwt is not in correct format like algorithm.
      // A local catch block is implemented to prevent global error handling, ensuring a smoother logout experience.
      return next();
    }
  }
  next();
};

// Authorization user roles.
// The authorization process involves defining middleware functions that check whether a user has the necessary permissions (based on their role) to access or perform certain actions within the application.

exports.restrictTo = (...roles) => {
  // middleware function uses a closure to access the roles passed as arguments. It checks if the role of the current user matches any of the allowed roles. If not, it generates a 403 Forbidden error, denying access.
  return (req, res, next) => {
    // roles ['admin', 'lead-guide]. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this job!', 403),
      );
    }
    next();
  };
};

// Forgot Password:
// Users send a POST request to a 'forgot password' route with their email address.
// A reset token is generated and sent to the provided email address.

// Reset Password:
// Users, after receiving the token in their email, send that token along with a new password to update their password.

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address!', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // After modifying user data, to save the changes to the database.
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you did't forget your password, please ignore this email`;

    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    // In case of an error during email sending,clearing the user's passwordResetToken and passwordResetExpires
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error send the email! Try again later!', 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex'); // // The original reset token sent in the URL is encrypted and compared with the encrypted token stored in the database.

  //  find a user with a matching passwordResetToken and a passwordResetExpires timestamp greater than the current time
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, then set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  // Update the user's password and remove the expired token from the user data.
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user at user model

  // 4) Log the user in, send JWT
  // Finalize the password reset by sending a new JSON Web Token to log in the user.
  createSendToken(user, 200, res);
});

// logged-in users to update their passwords without resetting them.
exports.updatePassword = catchAsync(async (req, res) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // User.findById to retrieve the user based on the logged-in user's ID

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended! BCZ Mongoose does not really keep the current object(this) in memory. [In usermodel this is not work for update method it only works for save & create]. Don't use update for anything related to passwords.

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
