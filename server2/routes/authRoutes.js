const express = require('express');
const router = express.Router();
const User = require('../models/user');

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new User({ email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});


router.post('/login', (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    } else if (!user || !user.isValidPassword(password)) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    } else {
      res.status(200).json({ success: true, message: 'Login successful' });
    }
  });
});

module.exports = router;