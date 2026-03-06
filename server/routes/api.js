const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Review = require('../models/review');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const BREWERY_API_BASE = 'https://api.openbrewerydb.org/v1/breweries';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function getPublicErrorMessage(error, fallbackMessage) {
  const status = error.response?.status;
  if (status === 404) {
    return { statusCode: 404, message: 'Brewery not found' };
  }

  if (status === 429) {
    return {
      statusCode: 503,
      message: 'Brewery provider is rate-limiting requests. Please try again in a moment.',
    };
  }

  return { statusCode: 500, message: fallbackMessage };
}

async function getBreweryOrThrow(id) {
  if (!id || typeof id !== 'string' || id.length > 120) {
    const err = new Error('Invalid brewery id');
    err.statusCode = 400;
    throw err;
  }

  try {
    const response = await axios.get(`${BREWERY_API_BASE}/${encodeURIComponent(id)}`, {
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    const mapped = getPublicErrorMessage(error, 'Failed to fetch brewery details');
    const err = new Error(mapped.message);
    err.statusCode = mapped.statusCode;
    throw err;
  }
}

router.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

router.post('/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({ email, password });

    return res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Signup failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id email createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.get('/breweries/search', async (req, res) => {
  try {
    const { by_city, by_name, by_type } = req.query;
    const page = parsePositiveInt(req.query.page, 1);
    const per_page = Math.min(parsePositiveInt(req.query.per_page, 20), 50);

    if (!by_city && !by_name && !by_type) {
      return res
        .status(400)
        .json({ message: 'Provide at least one filter: by_city, by_name, or by_type' });
    }

    const response = await axios.get(BREWERY_API_BASE, {
      params: { by_city, by_name, by_type, page, per_page },
      timeout: 10000,
    });

    const breweries = response.data;
    const breweryIds = breweries.map((brewery) => brewery.id);

    const ratingAgg = await Review.aggregate([
      { $match: { breweryId: { $in: breweryIds } } },
      {
        $group: {
          _id: '$breweryId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const ratingMap = ratingAgg.reduce((acc, row) => {
      acc[row._id] = {
        averageRating: Number(row.averageRating.toFixed(2)),
        reviewCount: row.reviewCount,
      };
      return acc;
    }, {});

    const result = breweries.map((brewery) => ({
      ...brewery,
      current_rating: ratingMap[brewery.id]?.averageRating ?? null,
      review_count: ratingMap[brewery.id]?.reviewCount ?? 0,
    }));

    return res.status(200).json({
      page,
      per_page,
      count: result.length,
      breweries: result,
    });
  } catch (error) {
    const mapped = getPublicErrorMessage(error, 'Failed to search breweries');
    return res.status(mapped.statusCode).json({ message: mapped.message });
  }
});

router.get('/breweries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const brewery = await getBreweryOrThrow(id);

    const reviews = await Review.find({ breweryId: id }).populate('user', 'email').sort({ createdAt: -1 });

    const averageRating =
      reviews.length > 0
        ? Number((reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(2))
        : null;

    return res.status(200).json({
      brewery,
      averageRating,
      reviewCount: reviews.length,
      reviews,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || 'Failed to fetch brewery details' });
  }
});

router.get('/breweries/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ breweryId: req.params.id }).populate('user', 'email').sort({ createdAt: -1 });
    return res.status(200).json({ count: reviews.length, reviews });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

router.post('/breweries/:id/reviews', requireAuth, async (req, res) => {
  try {
    const parsedRating = Number(req.body.rating);
    const description = String(req.body.description || '').trim();

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'rating must be an integer between 1 and 5' });
    }

    if (!description) {
      return res.status(400).json({ message: 'description is required' });
    }

    await getBreweryOrThrow(req.params.id);

    const review = await Review.findOneAndUpdate(
      { breweryId: req.params.id, user: req.user.id },
      {
        breweryId: req.params.id,
        user: req.user.id,
        rating: parsedRating,
        description,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({ message: 'Review saved', review });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || 'Failed to save review' });
  }
});

module.exports = router;
