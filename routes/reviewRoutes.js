const express = require('express');
const reviewModel = require('./../models/reviewModel');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
// const router = express.Router(); вот так было
const router = express.Router({ mergeParams: true }); //без merge params не бдует работать маршрут перенаправленый из tour routes

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );
router.route('/:id').patch(reviewController.updateReview).delete(
  // authController.protect,
  // authController.restrictTo('admin')
  reviewController.deleteReview
);

module.exports = router;
