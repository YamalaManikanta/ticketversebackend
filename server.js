const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Client } = require('pg');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// PostgreSQL database connection
const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres', // Replace with your database username
    password: 'yamala', // Replace with your database password
    database: 'postgres' // Replace with your database name
});

// Connect to PostgreSQL
client.connect((err) => {
    if (err) {
        console.error('Connection error', err.stack);
    } else {
        console.log('Connected to PostgreSQL');
    }
});

// Registration route (Insert email and password)
app.post('/register', (req, res) => {
    const { email, password } = req.body;

    const query = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *';

    client.query(query, [email, password], (err, result) => {
        if (err) {
            return res.status(500).send('Error inserting user into database');
        }
        res.status(201).send('User registered successfully');
    });
});

// Login route (Authenticate user and generate JWT)
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Query the database for the user with the given email
    client.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
        if (err) {
            return res.status(500).send('Database error');
        }

        if (result.rows.length === 0) {
            return res.status(400).send('User not found');
        }

        const user = result.rows[0];

        // Compare the password entered by the user with the stored password (no hashing here)
        if (user.password !== password) {
            return res.status(400).send('Invalid password');
        }

        // Password matched, generate a JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            'your_jwt_secret', // Secret key (keep it secure)
            { expiresIn: '1h' } // JWT expires in 1 hour
        );

        // Send the JWT token to the user
        res.json({ token });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
