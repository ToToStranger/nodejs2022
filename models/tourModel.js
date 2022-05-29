const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User =require('./userModel')

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: [true, 'name should be uniq'],
      trim: true, //убирает пробелы спереди и сзади
      maxlength: [40, 'a tour name too long'],
      minlength: [10, 'a tour name too short'],
      // validate: [validator.isAlpha, `tour name must contain only charachters`] внешний валидатор
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
      enum: {
        // этот валидатор только для строк
        values: [`easy`, `medium`, `difficult`],
        message: 'difficulty is wrong!',
      },
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, `rating must be above 1.0`],
      max: [5, `rating must be below 5.0`],
    },
    ratingQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'A tour must have a name'],
    },
    //this is a price discount
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //validate должно ловить только true или афдыую
          return val < this.price; // это будет работать только при создании новой записи
        },
        message: 'discount price ({VALUE}) should be below regular', //({VALUE}) это переменная для мангуса
      },
    },
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
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON определяет гео данные
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'], //это делаем чтобы только такой тип можно было использовать. Типа безопасность
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: 'Point',
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({ price: 1 }); //вот так включаем индескирование 1 - вверх, -1 вниз
tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.virtual('durationWeeks').get(function () {
  //function использовал для того чтобы использовать this.
  return this.duration / 7;
});

// virtual populate
tourSchema.virtual('reviews', {
  // эта штука будет искать в базе все review которые содержат этот тур и будет добавлять их сюда
  ref: 'Review',
  foreignField: 'tour', // это поле в другой модели по которому мы будем искать,
  localField: '_id', //это поле прописано в поле в другой модели.
});

//DOCUMENT MIDDLEWARE: runs before .save() and create(). не работает на insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//----------------------------------------------------
//это как мы встраивали по ID агентов прямо в туры
// tourSchema.pre('save', async function(next){
// const guidesPromises = this.guieds.map(async id => await User.findById(id))
// this.guides = await Promise.all(guidesPromises) //выше мы получили дохрена promise и теперь ждём их все и когда получим назначим на guides и пойдём дальше
//   next()
// })
//----------------------------------------------------
// tourSchema.pre('save', function(next){
//   next()
// })

// tourSchema.post('save', function(doc, next){

//   next()
// })
//QUERY MIDDLEWARE  //find -- query
tourSchema.pre(/^find/, function (next) {
  //нифигасе! тут
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
// tourSchema.pre('find', function(next){
//   this.find({secretTour: {$ne: true}})
//   next()
// })

tourSchema.pre(/^find/, function (next) {
  //this. всегда указывает на текущий запрос
  this.populate({
    //populate значит что надо взять рефы которые находятся в этом объекте и заменить их на данные.
    path: 'guides',
    select: '-__v -passwordChangeAt', //вот так фильтруем те строки которые не хотим показывать.
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start} milliseconds`);

  next();
});
//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // unshift добавит в начало. pipeline
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
