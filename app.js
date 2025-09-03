const express = require('express');
const path = require('path');

require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;

// Set view engine to EJS
app.set('view engine', 'ejs');

// Set views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files (css, js, images)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.render('home', { title: 'Home Page', message: 'Anupa Kapri' });
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About Page', message: 'This is the about page.' });
});

// Start server


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
