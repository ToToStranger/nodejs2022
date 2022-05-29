const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');
const Tour = require(`./../../models/tourModel`);
const Review = require(`./../../models/reviewModel`);
const User = require(`./../../models/userModel`);

//mongoose для доступа к БД
console.log(`lets start`);
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
// read files
const toures = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
//IMPORT DATA
const importData = async () => {
  try {
    await Tour.create(toures);
    await User.create(users, { validateBeforeSave: false }); // это сделано чтобы не выполнять валидацию пароля во время импорта данных пользователя. Иначе будет ошибка валидации
    await Review.create(reviews);
    console.log(`data successfully loaded!`);
    process.exit(); //закончит приложение
  } catch (err) {
    console.log(err);
  }
};

//DELETE ALL data from COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log(`data successfully deleted!`);
    process.exit(); //закончит приложение
  } catch (err) {
    console.log(err);
  }
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
