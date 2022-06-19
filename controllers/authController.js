const crypto = require('crypto');
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

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined; //это уберет пароль из отправки нам так как запись в БД происходит раньше
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),

    httpOnly: true, // так нельзя вообще никак модифицировать куки Очень важно!
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token, // просто отправляем token и всё. фронтенд должен поймать токен
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);

  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token, // просто отправляем token и всё. фронтенд должен поймать токен
  //   data: {
  //     user: newUser,
  //   },
  // });
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

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1) getting token and check it.
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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
  res.locals.user = currentUser; // res.locals будет доступен в самом PUG но мне с реактом это не нужно
  next();
});
// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  // 1) verify token
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //4) Check if user changed password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //There is a logged in user
      res.locals.user = currentUser; // res.locals будет доступен в самом PUG но мне с реактом это не нужно

      return next();
    } catch (err) {
      return next(err);
    }
  }
  next();
};

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

exports.resetPassword = async (req, res, next) => {
  //1) get user based on the token
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  }); // просто видимо применяется два правила для фильтрации. первое это токен, второе что дата должна быть больше чем сейчас
  //2) if token has not expired and there is a user already
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  } //400 - bad request
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordExpires = undefined;
  await user.save();

  //3) update changedPasswordAt property of

  //4) Log the use in. Send JWT
  createSendToken(user, 200, res);
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  // const {email, password} = req.body

  const user = User.findById(req.user.id).select('+password');
  // 2) check if posted pass is correct

  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError('You entered wrong password', 401));
  }
  // 3) if correct, update password and send JWT

  user.password = password;
  user.passwordConfirm = password;
  await user.save();
  //user.findbyandUpdate не будет производить валидвацию паролей, пролетит мимо шифрования и

  createSendToken(user, 200, res);
});
