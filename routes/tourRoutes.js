const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes')



const router = express.Router();

// router.param('id', tourController.checkID);

  // router.route('/:tourId/review')
  // .post(authController.protect, authController.restrictTo('user'), reviewController.createReview)
  // .get()
  //post /tour/213234/reviews
  //GET /tour/213234/reviews
  //GET /tour/213234/reviews/32jlksdf

router.use('/:tourId/reviews', reviewRouter) // вот так мы говорим этому роутеру использовать другой роутер если маршрут подходит


router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

router
  .route('/')
  .get( tourController.getAllTours) //protect защищает. Если будет ошибка, следующая функция не сработает
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour); // первая функция это middleware, вторая сам маршрут

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );




module.exports = router;
