const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');
// const router = express.Router(); вот так было
const router = express.Router(); //без merge params не бдует работать маршрут перенаправленый из tour routes

router.use(authController.protect); //так функция будет работать на все маршруты

router.get(
  '/checkout-session/:tourId',

  bookingController.getCheckoutSession
);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
