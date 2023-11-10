const mongoose = require('mongoose');

const dbURI = 'mongodb+srv://Ashish1805:Putin1@cluster0.ncjydwd.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('Connected to MongoDB database');
});

module.exports = db;