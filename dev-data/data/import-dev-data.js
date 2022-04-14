const fs = require('fs')
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require(`./../../dev-data/data/tour5`)

dotenv.config({ path: './config.env' });


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
// read files
const toures = JSON.parse(fs.readFileSync(`${__dirname}/tours`, 'utf-8'))
//IMPORT DATA
const importData = async()=>{
    try{
await Tour.create(toures)
console.log(`data successfully loaded!`);
process.exit() //закончит приложение
    }catch(err){
        console.log(err);
    }
}

//DELETE ALL data from COLLECTION
const deleteData = async () =>{
    try{
        await Tour.deleteMany()
        console.log(`data successfully deleted!`);
        process.exit() //закончит приложение
            }catch(err){
                console.log(err);
            }
}
if(process.argv[2] ==='--import'){
    importData()
    
} else if (process.argv[2] ==='--delete'){
    deleteData()

}


console.log(process.argv);
