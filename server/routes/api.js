const express= require('express')
const router=express.Router()
const User= require('../models/user')

const mongoose= require('mongoose')
const db= "mongodb+srv://Ashish1805:Putin1@cluster0.ncjydwd.mongodb.net/?retryWrites=true&w=majority"

mongoose.connect(db)
  .then(() => {
    console.log("Connected to Mongoose Atlas");
  })
  .catch((e) => {
    console.log("Error!" + e);
  });

router.get('/', (req, res) => {
  res.send("From API route");
});

router.post('/register', (req, res) => {
  let userData = req.body;
  let user = new User(userData);
  user.save()
    .then(registeredUser => {
      res.status(200).send(registeredUser);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send("Error registering user");
    });
});

router.post('/login', (req, res) => {
  let userData = req.body;
  User.findOne({ email: userData.email })
    .then(user => {
      if (!user) {
        res.status(401).send('Invalid Email');
      } else if (user.password !== userData.password) {
        res.status(401).send('Invalid Password');
      } else {
        res.status(200).send(user);
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send('Error during login');
    });
});

module.exports = router;