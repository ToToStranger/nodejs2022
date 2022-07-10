const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Booking = require('../models/bookingsModel');

exports.getOverview = catchAsync(async (req, res) => {
  // 1) get tour data from collection
  const tours = await Tour.find();
  // 2) Build template

  // 3) render that template using tour data from 1)

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user', //  поля которые будут запрошены и отображаться
  });

  if (!tour) {
    return next(new AppError('there is no tour found', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} tour`,
    tour,
  });
};

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = CatchAsync(async (req, res, next) => {
  // 1) find all bookungs
  // можно сделать ччерез virtual populate
  const bookings = await Booking.find({ user: request.user.id });
  // 2) find tours with returned ids
  const tourIds = bookings.map((el = el.tour));
  const tours = await Tour.find({ _id: { $in: tourIds } }); //{ $in: tourIds } это значит найти все ($in) ID которые находятся в массиве tourIds
  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).render('account', {
    title: `Your account`,
    user: updateUser,
  });
});
