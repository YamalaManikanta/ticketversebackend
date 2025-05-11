const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const client = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// JWT middleware
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user;
    next();
  });
};

// USER REGISTER
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await client.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Register error', error: err.message });
  }
});

// USER LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, result.rows[0].password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: result.rows[0].id, username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

// ADD MOVIE
app.post('/api/movies', authenticateJWT, async (req, res) => {
  const { title, description, release_date, genre, image_url } = req.body;
  try {
    const result = await client.query(
      'INSERT INTO movies (title, description, release_date, genre, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, release_date, genre, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Add movie error', error: err.message });
  }
});

// GET MOVIES
app.get('/api/movies', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM movies');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Get movies error', error: err.message });
  }
});

// ADD SPORT
app.post('/api/sports', authenticateJWT, async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await client.query(
      'INSERT INTO sports (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Add sport error', error: err.message });
  }
});

// GET SPORTS
app.get('/api/sports', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM sports');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Get sports error', error: err.message });
  }
});

// ADD EVENT
app.post('/api/events', authenticateJWT, async (req, res) => {
  const { name, event_type, description, event_date } = req.body;
  try {
    const result = await client.query(
      'INSERT INTO events (name, event_type, description, event_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, event_type, description, event_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Add event error', error: err.message });
  }
});

// GET EVENTS
app.get('/api/events', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM events');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Get events error', error: err.message });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
