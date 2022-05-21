const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log('id', req.params.id);
    const doc = await Model.findOneAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('no doc found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
