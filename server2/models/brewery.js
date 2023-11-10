
const mongoose = require('mongoose');

const brewerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address_1: String,
  address_2: String,
  address_3: String,
  city: String,
  state_province: String,
  postal_code: String,
  country: String,
  longitude: String,
  latitude: String,
  phone: String,
  website_url: String,
  street: String
  
});

// module.exports = mongoose.model('Brewery', brewerySchema);
const Brewery = mongoose.model('Brewery', brewerySchema);

module.exports = Brewery;
