const Tour = require('./../models/tourModel');
const sharp = require('sharp'); //можно делать много всего, но сейчас используем для resize картинок
const multer = require('multer'); //используется для заливки файлов

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


const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  //filter нужен для того чтобы определять тип файла и если это не картинка то кидать ошибку
  // можно и CSV
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image file', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });



expots.uploadTourImages = upload.fields([
  {name:'imageCover', maxCount:1},
  {name: 'images', maxCount:3}
])

// upload.single('image') это когда одно фото
//upload.array('images',5) это когда много файлов

exports.resizeTourImages = catchAsync(async (req,res,next) => {
  console.log(req.files)
  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
if (!req.files.imageCover|| !req.files.images) return next()

await sharp(req.files.ImageCover[0].buffer)
  .resize(2000, 1333)
  .toFormat('jpeg')
  .jpeg({ quality: 90 })
  .toFile(`public/img/tours/${req.body.imageCover}`);
// 2) Images
req.body.images =[]
// req.files.images.foreach( async (file, i) => { //он взял откуда то индекс и добавил его сюда. просто так
  await Promise.all(req.files.images.map( async (file, i) => { //он взял откуда то индекс и добавил его сюда. просто так
  const filename = `tour-${req.params.id}-${Date.now()}-${i +1}.jpeg`

  await sharp(file.buffer)
  .resize(2000, 1333)
  .toFormat('jpeg')
  .jpeg({ quality: 90 })
  .toFile(`public/img/tours/${filename}`);
req.body.images.push(filename)
//сначала он хотел использовать foreach но async/await тогда будет внутри этой функции и код будет выполняться без ожидания.
// поэтому он перешел на .map метод и на нем сможет выполнить promise ALL потому что функция будет отправлять promise


}))


next()

})