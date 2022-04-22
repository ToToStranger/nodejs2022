const dotenv = require('dotenv');
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
  .then((con) => {
    console.log('DB connection success');
  });
//schema type options опции для схемы читать в интернетах [true, 'A tour must have a name'] после запятой пишем ошибку, которую будем отправлять если неправильные данные

//SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});


//test