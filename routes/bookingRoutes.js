const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');
// const router = express.Router(); вот так было
const router = express.Router(); //без merge params не бдует работать маршрут перенаправленый из tour routes

router.get('/checkout-session/:tourId', authController.protect, bookingConroller.getCheckoutSession)

module.exports = router;
