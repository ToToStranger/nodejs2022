const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitizer = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDLLEWAIRS
//helmet задает загаловки безопасности, поэтому его надо ставить в самый верх и всегда.
//security HTTP headers
app.use(helmet());
//morgan просто пишет в консоль данные о запросах
//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//опции для ограничения подключений с одного айпишника

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later',
});
//применится лимитер только на /api маршрут
//limit request from one IP
app.use('/api', limiter);

//без этой функции не будет доступа к res.body!!!!!! это важно
//body parser
app.use(express.json({ limit: '10kb' })); //limit: 10kb ограничевает body которое может принять
//data sanitization against noSQL query injection
//просто удалит из кода все $ и точки, без них не работает запрос
app.use(mongoSanitizer());
//data sanitization against xss
app.use(xss());
// prevent parameters pollution
//whitelist нужен чтобы определить какие параметры можно повторять
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
//serving static files
app.use(express.static(`${__dirname}/public`));

//создаем собственную middleware функцию
// app.use((req, res, next) => {
//   console.log('hello from the middleware ');
//   //обязательно надо выполнять функцию next!!!
//   next();
// });
//это просто ерунда которая потом может пригодиться
app.use((req, res, next) => {
  // добавляет время в запрос!
  req.requestTime = new Date().toISOString();
  //обязательно надо выполнять функцию next!!!
  next();
});

//2) ROUTE HANDLERS

// app.get('/api/v1/tours', getAllTours);
//маршрут с переменными
// app.post('/api/v1/tours', createTour)

// app.get('/api/v1/tours/:id', getTour);

// app.patch('/api/v1/tours/:id', updateTour)

// app.delete('/api/v1/tours/:id', )

// 3) ROUTES
//mounting the router :)

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// default route
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't find ${req.originalUrl}`,
  // });

  next(new AppError(`can't find ${req.originalUrl}`, 404)); // если мы пихаем чтото в next то это точно ошибка
});

//middlewaare функция для ловли ошибок всего приложения
app.use(globalErrorHandler);

module.exports = app;
