const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');
const cache = require('../utils/cache'); // Import cache utility

// Cache expiration time (e.g., 1 hour = 3600 seconds)
const CACHE_EXPIRATION = process.env.CACHE_EXPIRATION_SECONDS || 3600;

// POST /api/weather - Get weather for multiple locations
router.post('/weather', async (req, res, next) => {
    const { locations } = req.body;

    // Validate input
    if (!Array.isArray(locations) || locations.length === 0 || locations.length > 10) {
        return res.status(400).json({ message: 'Please provide an array of 1 to 10 locations (city names or zip codes) in the request body under the "locations" key.' });
    }

    const results = [];
    const locationsToFetch = [];
    const cacheKeys = locations.map(loc => `weather_${loc.toString().toLowerCase().replace(/\s+/g, '_')}`); // Normalize cache keys
    const cachePromises = [];

    // 1. Try fetching all locations from cache
    cacheKeys.forEach((key, index) => {
        cachePromises.push(new Promise((resolve) => {
            cache.get(key, (err, data) => {
                if (err) {
                    console.error(`Memcached get error for key ${key}:`, err);
                    // If cache fails, we need to fetch it
                    locationsToFetch.push({ originalIndex: index, location: locations[index], cacheKey: key });
                    resolve(null); // Resolve with null to indicate cache miss/error
                } else if (data) {
                    console.log(`Cache hit for ${locations[index]}`);
                    try {
                        results[index] = JSON.parse(data); // Store result at original index
                    } catch (parseError) {
                        console.error(`Error parsing cached data for key ${key}:`, parseError);
                        // Treat as cache miss if parsing fails
                        locationsToFetch.push({ originalIndex: index, location: locations[index], cacheKey: key });
                        resolve(null);
                    }
                    resolve(data); // Resolve with data if hit
                } else {
                    console.log(`Cache miss for ${locations[index]}`);
                    locationsToFetch.push({ originalIndex: index, location: locations[index], cacheKey: key });
                    resolve(null); // Resolve with null for cache miss
                }
            });
        }));
    });

    try {
        // Wait for all cache lookups to complete
        await Promise.all(cachePromises);

        // 2. Fetch missing locations from the weather service
        if (locationsToFetch.length > 0) {
            console.log(`Fetching data for ${locationsToFetch.length} locations from service.`);
            const locationsOnly = locationsToFetch.map(item => item.location);
            const fetchedResults = await weatherService.getWeatherForLocations(locationsOnly);

            // 3. Process fetched results and update cache
            const cacheSetPromises = [];
            fetchedResults.forEach((result, i) => {
                const item = locationsToFetch[i]; // Get corresponding item with originalIndex and cacheKey
                results[item.originalIndex] = result; // Place result in the correct position

                // Cache successful results
                if (result && result.status === 'fulfilled' && result.value) {
                    const dataToCache = JSON.stringify(result.value);
                    cacheSetPromises.push(new Promise((resolveSet) => {
                        cache.set(item.cacheKey, dataToCache, CACHE_EXPIRATION, (setErr) => {
                            if (setErr) {
                                console.error(`Memcached set error for key ${item.cacheKey}:`, setErr);
                            } else {
                                console.log(`Cached data for ${item.location}`);
                            }
                            resolveSet(); // Resolve regardless of cache success/failure
                        });
                    }));
                } else if (result && result.status === 'rejected') {
                     // Store error information for rejected promises at the correct index
                     results[item.originalIndex] = {
                         location: item.location,
                         error: result.reason?.message || 'Failed to fetch weather data'
                     };
                }
            });
            // Wait for all cache sets to complete (optional, can proceed without waiting)
            await Promise.all(cacheSetPromises);
        }

        // 4. Return combined results
        // Ensure the results array has entries for all requested locations, even if null/error
        const finalResults = locations.map((loc, index) => {
             if (results[index]) {
                 // If we stored a Promise.allSettled result object, extract value or format error
                 if (results[index].status === 'fulfilled') {
                     return results[index].value;
                 } else if (results[index].status === 'rejected') {
                     return { location: loc, error: results[index].reason?.message || 'Failed to fetch weather data' };
                 }
                 // Otherwise, it was a direct cache hit or pre-formatted error
                 return results[index];
             }
             // Should not happen if logic is correct, but as a fallback:
             return { location: loc, error: 'Data not found or processing error' };
        });

        res.json(finalResults);

    } catch (error) {
        console.error("Error processing weather request:", error);
        next(error); // Pass to global error handler
    }
});


// Remove or comment out the old GET route if it's no longer needed
/*
router.get('/weather/:city', async (req, res, next) => {
    // ... old single city logic ...
});
*/

module.exports = router;
