// npm i multer
const multer = require('multer');
// npm i sharp
const sharp = require('sharp'); // sharp is a really nice and easy to use image processing library for Node.js. Very efficient for resizing images in a very simple way.
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// implementing image uploads for user photos
// Multer package will be used as a middleware to handle multi-part form data for file uploads.
// Multer is a middleware for handling multi-part form data, commonly used for uploading files from a form.

/*
const multerStorage = multer.diskStorage({
  // Creating disk storage using multer to store files in the file system. We could alternatively store files in memory as buffers for later use, but currently, we opt to store them as is in the file system.
  destination: (req, file, cb) => {
    // Define the destination directory using a callback function. This function receives the current request, the uploaded file, and a callback function. The callback function is akin to the 'next' function in Express but is named 'cb' here for clarity. It allows passing errors and other parameters.
    cb(null, 'public/img/users'); // Call the callback with null for no error, and the desired destination directory.
  },
  filename: (req, file, cb) => {
    // Generate unique filenames for uploaded files. The filename format is "user-user-id-current-timestamp.file-extension". This prevents filename clashes and ensures uniqueness.
    const ext = file.mimetype.split('/')[1]; // Extract the file extension from the MIME type.
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); // Call the callback with null for no error and the generated filename.
  },
});
*/ // If we do not need image processing then we can keep using it this way.
// When performing image processing immediately after uploading a file, preferable to avoid saving the file to disk and instead store it in memory. This is way more efficient, so instead of having to write the file to the disk and then read it again, we simply keep the image in memory. Then, we can perform operations on it directly. So that store image in memory first and then store it in disk.
const multerStorage = multer.memoryStorage(); // This way the image will be stored as a buffer, and that buffer is then available at req.file.buffer.

const multerFilter = (req, file, cb) => {
  // Multer filter function to ensure uploaded files are only images. The function receives the request, the uploaded file, and a callback function.
  if (file.mimetype.startsWith('image')) {
    // If the uploaded file is an image, pass true to the callback with no error.
    cb(null, true);
  } // If the uploaded file is not an image, pass false to the callback along with an error.
  else cb(new AppError('Not an image! Please upload only images.', 400), false);
};

// const upload = multer({dest: 'public/img/users'});
/* Image Upload Handling: multer is a powerful Node.js middleware specifically designed to manage file uploads, including images. It simplifies the process by handling file parsing, storage, and validation.
Destination: The dest option specifies where to save uploaded images. In this case, it's set to public/img/users, indicating that images will be stored within a users subdirectory under the public/img directory.
Image Storage: By default, Multer saves uploaded files to the local disk. This approach is suitable for smaller applications with manageable storage needs. For larger applications or scaling considerations, we might explore alternative storage solutions like cloud storage.
Database Integration: While images are stored in the specified directory, the database typically stores a reference or path to the image file, not the actual image data. This helps maintain database efficiency and clarity. */

// Multer is configured with a destination folder for storing uploaded images and defined file filter.
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo'); // Expose middleware for handling single file uploads with the field name 'photo'. This middleware is then included in the router.

// Resizing Images && after that store imgs in disk:
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // Only perform image processing if there is a file. else go to next.
  if (!req.file) return next();

  // This middleware function is going to be running right after the photo is actually uploaded, and that upload is actually happening to a buffer and no longer directly to the file system, so that is why we use this memoryStorage().
  // Setting the file name
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  // we can perform operations on image that stores in memory(memory storage) and after that save that into disk. Calling the sharp function like this creates an object on which we can chain multiple methods to process the image.
  // The first method we use is resize, where we specify the width and height. Here, we want square images, so the height needs to be the same as the width. This will crop the image to cover the entire 500x500 square.
  //Next, we convert the image to JPEG format and define the quality (compression level) using the jpeg method, setting the quality to 90%.
  //Finally, we write the processed image to a file on disk using toFile(). This method requires the entire path to the file.

  next();
});

// Function to filter an object and only allow specified fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    // Check if the current key is included in the allowed fields
    if (allowedFields.includes(el)) {
      // If included, add the key-value pair to the new object
      newObj[el] = obj[el];
    }
  });
  // Return the new object containing only allowed fields
  return newObj;
};

//me endpoint is designed for a user to retrieve their own data without explicitly passing their ID in the URL parameters.
exports.getMe = (req, res, next) => {
  // This middleware is introduced to handle the retrieval of the user's data without explicitly passing the user ID in the URL parameters.
  req.params.id = req.user.id;
  next();
};

// exports.getAllusers = catchAsync(async (req, res, next) => {
//     const users = await User.find();

//     // SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         results: users.length,
//         data: {
//            users
//         }
//      });
// });

// Updating the currently authenticated user data -> updateMe function is an asynchronous middleware used to update the authenticated user's non-sensitive data (name, email).
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body); // Our body parser is not able to handle files, and so that is why the file is not showing up in the body at all in the console.

  // 1) Create error if user POSTs password data
  // restrictions for updating sensitive information like passwords.
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      AppError(
        'This route is not for password updates. please use /updateMy Pasword',
        400,
      ),
    );
  }

  // 2) Filtered out unwanted field names that are not allowed to be updated
  // restrictions on fields that can be updated to prevent unintended changes (e.g., filtering out sensitive fields like role or resetToken).
  const filteredBody = filterObj(req.body, 'name', 'email');
  // Saving image name to database
  if (req.file) {
    // If a file is uploaded (req.file exists), set the photo field in filteredBody to the uploaded file's filename. We only store the filename, not the full path, in the document.
    filteredBody.photo = req.file.filename;
  }

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // updated document is returned
    runValidators: true, //validation rules are applied
  });
  // we are not dealing with passwords but only with non-sensitive data like name, email so we can now use findByIdAndUpdate().
  // findByIdAndUpdate method in Mongoose is used to find a document by its ID and update it. takes object containing the fields to be updated.

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// When a user requests to delete their account, the active field for that specific user is set to false.
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

exports.getAllusers = factory.getAll(User);
// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
