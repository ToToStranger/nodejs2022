const path = require('path'); // для маршрутов
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitizer = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy'); // вот так приложение будет доверять proxy

app.set('view engine', 'pug'); //это для рендеринга страниц из шаблонов
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDLLEWAIRS
// implemet CORS глобально!!!! просто раскоменьт внизу. Мы пробуем включить корс на одном маршруте\
// app.use(cors()) // включит доступ отовсюду
// app.use(cors({
// origin: 'https://www.mydomain.com'
// }))

// отвечаем на CORS сложные запросы
app.options('*', cors());
// app.opions('/api/v1/tours/:id', cors()) так контроллируем что разрешен только один маршрут

app.use(express.static(path.join(__dirname, 'public')));
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
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //limit: 10kbтак можно ловить данные которые закодированы в сам url
app.use(cookieParser());

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
// app.use(express.static(`${__dirname}/public`));

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
app.use('/', viewRouter);
app.use('/api/v1/tours', cors(), tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

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
