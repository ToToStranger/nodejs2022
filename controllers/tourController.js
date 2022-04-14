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
const queryObj = {...req.query}
const excludedFields = [`page`, 'sort', "limit", 'fields']
//удаляем лишние поля
excludedFileds.forEach(el => { delete queryObj[el]});



  const query = Tour.find(queryObj)

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
