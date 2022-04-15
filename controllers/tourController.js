const Tour = require('./../models/tourModel');

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

exports.getAllTours = async (req, res) => {
try{
//BUILD QUERY
//1a) Filtering

const queryObj = {...req.query}
const excludedFields = [`page`, 'sort', "limit", 'fields']
//удаляем лишние поля
excludedFileds.forEach(el => { delete queryObj[el]});
//1b) advanced filtering
//{difficulty: 'easy', duration: {$gte:5}}
//будем менять gte,gt,lte,lt с добавлением $

let queryStr = JSON.stringify(queryObj)
queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)   //\b - это значит что ищем ТОЧНОе совпадене. /g -множество раз можем менять. 

let query = Tour.find(JSON.parse(queryObj))//это не данные а только строка запроса данных!
// 2) Sorting 
if(req.query.sort){
query = query.sort(req.query.sort)

}

  const tours = await query 


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
    message: err
  })
}
};

exports.getTour = async (req, res) => {

try{

  const tour = await Tour.findById(req.params.id)
  //тоже самое что Tour.findOne({_id: req.params.id})
  res.status(200).json({
    status: 'success',
    data: {
      tours: tour,
    },
  });
}catch(err){
  res.status(404).json({
    status:"failed",
    message: err
  })
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


try{
 await Tour.findByIdAndUpdate(req.params.id, req.body, {
  new: true,
  runValidators: true,
} )
  
  res.status(204).json({
    status: 'success',
    data:null,
})
}catch(err){
  res.status(404).json({
    status:"failed",
    message: err
  })
}
};

exports.deleteTour = async (req, res) => {
 try{
  const tour = await Tour.findAndDelete(req.params.id)
  res.status(204).json({
    status: 'success',
    data: {
      tour},
  });
 }catch (err){
  res.status(404).json({
    status:"failed",
    message: err
  })
 }


};
