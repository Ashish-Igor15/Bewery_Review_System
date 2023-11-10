// server2/models/review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  breweryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brewery',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  description: String
  // Add fields like userId, date, etc., based on requirements
});

module.exports = mongoose.model('Review', reviewSchema);
