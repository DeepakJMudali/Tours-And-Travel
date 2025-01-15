const dotenv = require('dotenv');
const ngrok = require('@ngrok/ngrok');

// To handle  unCaught error globally
process.on("uncaughtException", err =>{
  console.log(err.name, err.message);
  console.log("Uncaught Exceptions");

})
dotenv.config({ path: './config.env' });
const mongoose =require("mongoose")
const app = require('./app');



const DB= process.env.DATABASE.replace("<db_password>",process.env.DATABASE_PASSWORD)

mongoose.connect(DB,{
  useNewUrlParser:true
}).then(()=>{

console.log("Connection Established!!")
}).catch((error)=>{
  console.log("error",error)
})


const port = process.env.PORT || 3000;
 app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

ngrok.connect({ addr: 3000, authtoken_from_env: true })
	.then(listener => console.log(`Ingress established at: ${listener.url()}`));


