const dotenv = require('dotenv');
const mongoose =require("mongoose")
const fs = require("fs")
const Tour= require('./../../models/tourModel')
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');
// const app = require('./app');
const { dirname } = require('path');

dotenv.config({ path: './config.env' });
const DB= process.env.DATABASE.replace("<db_password>",process.env.DATABASE_PASSWORD)

mongoose.connect(DB,{
  useNewUrlParser:true,
  // useCreateIndex:true,
  // useFindAndModify:false
}).then(()=>{

console.log("Connection Established!!")
})

//Read JSON file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//Import Data into DB

const importData= async ()=>
{
        try{
        await Tour.create(tours)
        await User.create(users, { validateBeforeSave: false }); // to disable validation implicitly
        await Review.create(reviews);
        console.log('Data successfully loaded!');
        }catch(error){
        console.log(error)
        }
        process.exit()
}

const deleteData= async ()=>
    {
            try{
            await Tour.deleteMany()
            await User.deleteMany();
            await Review.deleteMany();
            console.log('Data successfully deleted!');
            }catch(error){
            console.log(error)
            }
            process.exit()
    }

    if(process.argv[2] === "--import")
    {
        importData();
    }else if(process.argv[2] === "--delete")
    {
        deleteData();
    }