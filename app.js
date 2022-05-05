const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const rateLimit = require('express-rate-limit')

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDLLEWAIRS
//morgan просто пишет в консоль данные о запросах
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//опции для ограничения подключений с одного айпишника
const limiter = rateLimit({
  max: 100,
  windowMs: 60*60*1000,
  message: 'Too many requests from this IP, please try again later'
})
//применится лимитер только на /api маршрут
app.use('/api',limiter)

//без этой функции не будет доступа к res.body!!!!!! это важно
app.use(express.json());

app.use(express.static(`${__dirname}/public`));

//создаем собственную middleware функцию
// app.use((req, res, next) => {
//   console.log('hello from the middleware ');
//   //обязательно надо выполнять функцию next!!!
//   next();
// });

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

  next(new AppError(`can't find ${req.originalUrl}`,404)); // если мы пихаем чтото в next то это точно ошибка
});

//middlewaare функция для ловли ошибок всего приложения
app.use(globalErrorHandler);

module.exports = app;
