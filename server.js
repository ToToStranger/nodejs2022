const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log(`UNCAUGHT REJECTION! Shutting down`);
  console.log(err.name, err.message);
 console.log(err)
})

const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

//порядок важен!
const app = require('./app');

//mongoose для доступа к БД

const DB = process.env.DB_URL.replace('<PASSWORD>', process.env.DB_PASS);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection success');
  });
//schema type options опции для схемы читать в интернетах [true, 'A tour must have a name'] после запятой пишем ошибку, которую будем отправлять если неправильные данные

//SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});

// чтобы выключать сервер gracefully надо сначала сохранить его в переменную.
//unhandlede rejection handlers
process.on('unhandledRejection', err =>{
  console.log(`UNHANDLED REJECTION! Shutting down`);
  console.log(err.name, err.message);
  server.close(()=>{
    process.exit(1); // прекратить приложение
  })
  
}
)

