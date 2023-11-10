const express = require('express');
const router = express.Router();
const Review = require('../models/review');

// Route to add a review
router.post('/reviews', async (req, res) => {
  try {
    const { breweryId, rating, description } = req.body;
    const review = new Review({ breweryId, rating, description });
    await review.save();
    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Other review-related routes

router.get('/reviews', async (req, res) => {
    try {
      const reviews = await Review.find();
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

module.exports = router;