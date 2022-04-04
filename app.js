const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDLLEWAIRS
//morgan просто пишет в консоль данные о запросах
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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

module.exports = app;
