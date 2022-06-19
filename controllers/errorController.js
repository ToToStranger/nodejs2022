const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};
const handleDuplicateFieldsBD = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];

  const message = `duplicate field value: ${value}. please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el = el.message));
  const message = `invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!');

const handleJWTExpiredError = () =>
  new AppError(' your token has expired, please login', 401);

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //RENDERED WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'something went wrong',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      // operational, trusted error: send message client
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // programming or other unknown error. Dont leaK ERROR TO Client
    //1) log error to console
    console.log('ERROR !!', err);
    // send error to client
    return res.status(500).json({
      status: 'error',
      message: 'something went very wrong',
    });
  }
  //B) rendered website
  if (err.isOperational) {
    // operational, trusted error: send message client
    return res.status(err.statusCode).render('error', {
      title: 'something went wrong',
      msg: err.message,
    });
  }
  // programming or other unknown error. Dont leaK ERROR TO Client
  //1) log error to console
  return res.status(err.statusCode).render('error', {
    title: 'something went wrong',
    msg: 'please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    //теперь те ошибки которые сделали сами пользователи и которые что то значат
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsBD(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
