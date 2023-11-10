const express = require('express');
const db = require('./db'); 
const breweryRoutes = require('./routes/breweryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const app = express();

app.use(express.json());

app.use('/api/brewery', breweryRoutes);
app.use('/api/review', reviewRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});