const express= require('express')
const bodyParser= require('body-parser')
const cors = require('cors');
const PORT= 4000
const app= express()
app.use(cors());
const api= require('./routes/api')
app.use(bodyParser.json())  

app.use('/api', api)

app.get('/', function(req,res){
    res.send("server is running on port 4000")
})

app.listen(PORT, function(){
    console.log("server is running on localhost: " + PORT)
})