const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFieatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log('id', req.params.id);
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('no doc found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('no doc found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const newTour = new Tour({});
    // newTour.save()

    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

  exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
  let query=Model.findById(req.params.id)
  if(popOptions) query=query.populate(popOptions)

      const doc = await query
    //тоже самое что doc.findOne({_id: req.params.id})
  
    if (!doc) {
      return next(new AppError('no doc found with that ID', 404));
    }
  
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

  exports.getAll = (Model) => catchAsync(async (req, res, next) => {
    //BUILD QUERY
    // to allow for nested get reviews on Tour
    let filter;
  if (req.params.tourId) filter = { tour: req.params.tourId };

    //EXECUTE QUERY
  
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
  
    const doc = await features.query;
  
    // const doc = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')
  
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });