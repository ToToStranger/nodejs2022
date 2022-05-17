const Review = require('./../models/reviewModel')
const APIFeatures = require('./../utils/apiFieatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');



exports.getAllReviews = catchAsync(async (req, res, next) =>{

    const reviews = await Review.find()

res.status(200).json({
    status: 'success',
    results:reviews.length,
    data: {
        reviews: reviews
    } 
})
})


exports.createReview = (req, res, next) => {

const newReview = await Review.create(req.body)


res.send(201).json({
    status: 'success',
    data: {
        review: newReview
    }
})


}