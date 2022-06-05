const Tour = require('./../models/tourModel');

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

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

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

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, plan } = req.params;
  const { lat, lng } = latlng.split(',');
  const raduis = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //радианты считаются делением на радиус земли(6378.1)

  if (!lat || !lng) {
    next(new AppError('Please provide lat and lng', 400));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.send(200).json({
    status: 'success',
    results: tour.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, plan } = req.params;
  const { lat, lng } = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError('Please provide lat and lng', 400));
  }

  const distances = Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1, // говорим какие поля оставить
        name: 1,
      },
    },
  ]);

  res.send(200).json({
    status: 'success',

    data: {
      data: distances,
    },
  });
});
