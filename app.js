require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const weatherRoutes = require('./routes/weather');

const app = express();
const port = process.env.PORT || 3000;
const expectedApiKey = process.env.SERVER_API_KEY;

if (!expectedApiKey) {
    console.error("FATAL ERROR: SERVER_API_KEY is not defined in the environment variables.");
    process.exit(1); // Exit if the API key is not set
}

// Simple API Key Authentication Middleware
const apiKeyAuth = (req, res, next) => {
    const providedApiKey = req.headers['x-api-key']; // Case-insensitive header check might be better in production

    if (!providedApiKey) {
        return res.status(401).json({ message: 'Unauthorized: API key is missing.' });
    }

    if (providedApiKey !== expectedApiKey) {
        return res.status(403).json({ message: 'Forbidden: Invalid API key.' });
    }

    next(); // API key is valid, proceed to the next middleware/route handler
};

// Rate Limiter Middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply the rate limiting middleware to all requests *before* authentication
app.use(limiter);

// Middleware to parse JSON bodies
app.use(express.json());

// --- API Version 1 Routes ---
// Apply API key authentication ONLY to V1 routes
app.use('/api/v1', apiKeyAuth, weatherRoutes);

// Basic root route (does not require API key)
app.get('/', (req, res) => {
    res.send('Weather API is running!');
});

// Global error handler (basic)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
