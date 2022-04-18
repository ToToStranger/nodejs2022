const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFieatures');
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

exports.getAllTours = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    //тоже самое что Tour.findOne({_id: req.params.id})
    res.status(200).json({
      status: 'success',
      data: {
        tours: tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  // const newTour = new Tour({});
  // newTour.save()
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'invalid dataset',
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};
exports.getTourStats = async (req,res)=>{
  try {
const stats = Tour.aggregate([{
  $match: {ratingsAverage: {$gte: 4.5}}
},
{
  $group: {
    _id: {$toUpper: '$difficulty'},// можно прям тут применять изменения
    numTours: {$sum: 1}, //для того чтобы посчитать количество документов
    numRatings: {$sum: '$ratingsQuantity'},
    avgRating: { $avg: '$ratingsAverage'},
    avgPrice: {$avg: '$price'}, 
    minPrice: {$min: '$price'},
    maxPrice: {$max: '$price'},
  }
},
{
  $sort:{
    //теперь используем то что уже указано выше!
    avgPrice: 1 //1 значит по увеличению -1 по уменьшению
  }
},
// {
//   $match: {_id: {$ne: 'EASY'}} //это уберет лишние результаты!
// }
])
res.status(204).json({
  status: 'success',
  data: stats,
});

  } catch(err){
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
}

exports.getMonthlyPlan = async (req,res) => {
  try{
const year = req.params.year *1
const plan = await Tour.aggregate([
  {
    $unwind: '$startDates'
  },
  {
    $match: {
      startDates: {$gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`), },
    }
  },
  {
    $group: {
      _id: {$month: '$startDates'}, //выбираем туры по стартовой дате
      numTourStarts:{sum:1}, // за каждый тур присваиваем +1 
      tours: {$push: '$name' }
    }
  },
  {
    $addFields: { month: '$_id'} // добавляет поле month со значением $_id
  },
  {
    $project: {
      _id: 0 //не будет показывать это поле! это тоже фильтра
    }
  },
  {
    $sort: {numTouStarts: -1}
  },
  {
    $limit: 12 // покажет только первые 12 результатов
  }

])
res.status(204).json({
  status: 'success',
  data: plan,
});
  }catch(err){
    res.status(404).json({
      status: 'failed',
      message: err,
    });  
  }
}