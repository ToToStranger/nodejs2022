const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: [true, 'name should be uniq'],
    trim: true, //убирает пробелы спереди и сзади
  },
  duration: {
    type:Number,
    required: [true, 'A tour must have a duraction']
  },
  maxGroupSize: {
    type:Number,
    required: [true, 'a group must have a group size']
  },
  difficulty: {
    type:String,
    required: [true, 'a tour must have difficulty']
  },
  ratingAverage: { type: Number, default: 4.5 },
  ratingQuantity: { type: Number, default: 0 },
  price: {
    type: Number,
    required: [true, 'A tour must have a name'],
  },
  priceDiscount:Number,
  summary: {
    type: String,
    trim: true, //убирает пробелы спереди и сзади
    required: [true, `a tour must have a summary`]
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now()
  },
  startDates: [Date]
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
