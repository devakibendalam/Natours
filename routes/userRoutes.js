const express = require('express');
const multer = require('multer');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// Multer Middleware Creation:
// A middleware function named "Upload" is created using Multer settings.
// const upload = multer({ dest: 'public/img/users' });
// Multer is configured with a destination folder for storing uploaded images.

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//PROTECT ALL ROUTES AFTER THIS MIDDLEWARE
// protect all of the routes at the same time by using middleware that comes before all these other routes.
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);

// The Multer middleware is integrated into the "Update Me" route to handle single-file uploads with the field name "photo."
// Users will be able to upload their photos in addition to updating email and other details.
// router.patch('/updateMe', upload.single('photo'), userController.updateMe);
//The single('photo') parameter specifies that we're expecting a single file named photo in the request. If the upload is successful, the req.file object will contain information about the uploaded file (userController.js). Actually this middleware will take care of taking the file and copying it to the destination that we specified, and then after that it will call the next middleware in the stack which is updateMe.
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);

router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

//route() method particularly suitable when you want to chain multiple HTTP methods to the same route.
router
  .route('/')
  .get(userController.getAllusers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
