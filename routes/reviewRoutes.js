const express = require('express');
const reviewModel = require('./../models/reviewModel');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
// const router = express.Router(); вот так было
const router = express.Router({ mergeParams: true }); //без merge params не бдует работать маршрут перенаправленый из tour routes

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
