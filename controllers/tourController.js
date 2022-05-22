const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFieatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// exports.checkBody = (req, res, next) => {
//   console.log(`body is ${req.body}`);

//   const { name, price } = req.body;
//   if (!name || !price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'please fill all fields',
//     });
//   }

//   next();
// };

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5'; //надо задавать строкой
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  //BUILD QUERY

  //EXECUTE QUERY

  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours: tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate('reviews');
  //тоже самое что Tour.findOne({_id: req.params.id})

  if (!tour) {
    return next(new AppError('no tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tours: tour,
    },
  });
});

exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   console.log('id', req.params.id);
//   const tour = await Tour.findOneAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('no tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // можно прям тут применять изменения
        numTours: { $sum: 1 }, //для того чтобы посчитать количество документов
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        //теперь используем то что уже указано выше!
        avgPrice: 1, //1 значит по увеличению -1 по уменьшению
      },
    },
    // {
    //   $match: {_id: {$ne: 'EASY'}} //это уберет лишние результаты!
    // }
  ]);
  res.status(204).json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //выбираем туры по стартовой дате
        numTourStarts: { sum: 1 }, // за каждый тур присваиваем +1
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' }, // добавляет поле month со значением $_id
    },
    {
      $project: {
        _id: 0, //не будет показывать это поле! это тоже фильтра
      },
    },
    {
      $sort: { numTouStarts: -1 },
    },
    {
      $limit: 12, // покажет только первые 12 результатов
    },
  ]);
  res.status(204).json({
    status: 'success',
    data: plan,
  });
};
