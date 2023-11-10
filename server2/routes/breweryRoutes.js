// const express = require('express');
// const axios = require('axios');
// const router = express.Router();
// const Brewery = require('../models/brewery');




// router.get('/breweries/city/:city', async (req, res) => {
//     try {
//       const city = req.params.city;
//       const response = await axios.get(`https://api.openbrewerydb.org/breweries?by_city=${city}`);
//       const breweries = response.data;
//       res.status(200).json(breweries);
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to fetch breweries by city' });
//     }
//   });
  
//   // Route to search breweries by name using Open Brewery DB API
//   router.get('/breweries/name/:name', async (req, res) => {
//     try {
//       const name = req.params.name;
//       const response = await axios.get(`https://api.openbrewerydb.org/breweries?by_name=${name}`);
//       const breweries = response.data;
//       res.status(200).json(breweries);
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to search breweries by name' });
//     }
//   });
  
//   // Route to search breweries by type using Open Brewery DB API
//   router.get('/breweries/type/:type', async (req, res) => {
//     try {
//       const type = req.params.type;
//       const response = await axios.get(`https://api.openbrewerydb.org/breweries?by_type=${type}`);
//       const breweries = response.data;
//       res.status(200).json(breweries);
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to search breweries by type' });
//     }
//   });
  
//   module.exports = router;

const express = require('express');
const router = express.Router();
const Brewery = require('../models/brewery'); // Import the Brewery model

// Then you can use this model to interact with the database
// For example, to perform a search based on the request parameters:
router.get('/breweries/search', async (req, res) => {
  try {
    const { city, name, type } = req.query;

    // Use the Brewery model to search the database based on parameters
    const breweries = await Brewery.find({ 
      city: new RegExp(city, 'i'), 
      name: new RegExp(name, 'i'), 
      type: new RegExp(type, 'i') 
    });

    res.status(200).json(breweries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search breweries' });
  }
});

module.exports = router;