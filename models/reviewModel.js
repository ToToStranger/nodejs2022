const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Please fill the review field'],
      minlength: [10, 'Give us some more info please'],
      maxlength: [200, 'Sorry, to much info for me'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must have a tour name'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to someone'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: 'rating' },
      },
    },
  ]);
  console.log(stats);
  if (stats.lenght > 0) {
    await Tour.findbyIdAndUpdate(tourId, {
      ratingQuantity: stats[0].nRating,
      ratingAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findbyIdAndUpdate(tourId, {
      ratingQuantity: 0,
      ratingAverage: 4.5,
    });
  }
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // rour: 1 значит что сортировка по возрастанию, -1 по убыв. unique опция не позволит создать две одинаковые связи user и tour

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findeOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findeOne(); does not work here, query already been executed
  // в этот момент мы до сих пор имеем доступ к this
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

reviewSchema.post('save', function () {
  // /this points to current review
  this.constructor.calcAverageRatings(this.tour); // делаем так потому что Review еще вообще не создан и надо использовать сам конструктор
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
