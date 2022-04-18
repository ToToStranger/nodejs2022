const mongoose = require('mongoose');
const slugify = require('slugify')

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: [true, 'name should be uniq'],
    trim: true, //убирает пробелы спереди и сзади
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A tour must have a duraction'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'a group must have a group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'a tour must have difficulty'],
  },
  ratingAverage: { type: Number, default: 4.5 },
  ratingQuantity: { type: Number, default: 0 },
  price: {
    type: Number,
    required: [true, 'A tour must have a name'],
  },
  priceDiscount: Number,
  summary: {
    type: String,
    trim: true, //убирает пробелы спереди и сзади
    required: [true, `a tour must have a summary`],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false, //это значит не показывать никогда клиенту. отправляться не будет вообще!
  },
  startDates: [Date],
  secretTour:{
    type:Boolean,
    default: false
  }
},
  {
    toJSON: {virtuals:true},
    toObject: {virtuals:true},

  }
);

tourSchema.virtual('durationWeeks').get(function(){ //function использовал для того чтобы использовать this.
  return this.duration / 7
})

//DOCUMENT MIDDLEWARE: runs before .save() and create(). не работает на insertMany()
tourSchema.pre('save', function(next){
this.slug = slugify(this.name, {lower: true})
next()
})

// tourSchema.pre('save', function(next){
//   next()
// })

// tourSchema.post('save', function(doc, next){

//   next()
// })
//QUERY MIDDLEWARE  //find -- query
tourSchema.pre(/^find/, function(next){  //нифигасе! тут 
  this.find({secretTour: {$ne: true}}) 
  this.start = Date.now()
  next()
})
// tourSchema.pre('find', function(next){
//   this.find({secretTour: {$ne: true}}) 
//   next()
// })
tourSchema.post(/^find/, function(docs, next){
  console.log(`query took ${Date.now()- this.start} milliseconds`);
  console.log(docs);
    next()
})

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
