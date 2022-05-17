const express =require('express')
const reviewModel = require('./../models/reviewModel')
const reviewController = require('./../controllers/reviewController')
const authController = require('./../controllers/authController')
const router = express.Router()



router.Route('/')
.get(reviewController.getAllReviews)
.post(authController.protect, authController.restrictTo('user'), reviewController.createReview)


module.exports = router