const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token, // просто отправляем token и всё. фронтенд должен поймать токен
    data: {
      user: newUser,
    },
  });
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1) check email and pass exits
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // 2) check if user exists & pass is correct
  //вот так выбираем те поля которые заранее не запрашиваются select('+password')
  const user = await User.findOne({ email: email }).select('+password');
  // 3)
  // const correct = await user.correctPassword(password, user.password)
  // поместили напрямую в if стейтмен для ускорения. Если пользователь неправильный, функции проверки пароля вообще не будут проводиться!
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1) getting token and check it.
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('please login', 401));
  }
  //2) Verification token
  //сейчас он будет строить из функции async функцию.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('user no longer exist', 401));
  }
  //4) Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('password changed, please login again', 401));
  }
  //GRANT ACCESS TO PROTECTED ROUTE!
  // это когда все проверки прошли
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  console.log(`restrictTo`);
  return (req, res, next) => {
    // roles is and array  ['admin', 'lead-guide'].
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permision to perform this action', 403)
      );
      //если всё норм, просто продолжаем
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('there is no user with email address', 404));
  }
  //2) generate random tokens
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSae: false });
  //3) send in to users mail
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `forgot your passwrd? submit a patch with new pass and confirm to: ${resetURL}.\nIf you didnt, please ignore this email!`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset to tokent (valid for 10 min)',
      message,
    });
    res.status(200).json({ status: 'success', essage: 'token sent to email' });
  } catch (err) {
    //если отправить не получилось, просто убираем токен и всё подчищаем.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSae: false });

    return next(
      new AppError('There was an error sending email.try later'),
      500
    );
  }
});

exports.resetPassword = (req, res, next) => {};
