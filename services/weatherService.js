const axios = require('axios');

// Function to get weather for a single city/zip (contains the actual API call logic)
async function getWeatherByCity(location) {
    console.log(`Fetching weather data for ${location} from external API`);

    // --- Placeholder for 3rd Party API Call ---
    // Ensure your API can handle both city names and zip codes,
    // or add logic here to determine which parameter to use.
    const apiKey = process.env.WEATHER_API_KEY;
    // Example: Visual Crossing Timeline API (adjust URL and params as needed)
    // It often accepts city names or zip codes directly in the location path parameter.
    const encodedLocation = encodeURIComponent(location);
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodedLocation}?unitGroup=metric&key=${apiKey}&contentType=json`;

    try {
        const response = await axios.get(apiUrl);
        // --- Adapt the returned data structure as needed ---
        // Example: Extracting relevant info from Visual Crossing response
        if (response.data && response.data.currentConditions) {
             const current = response.data.currentConditions;
             return {
                 location: response.data.resolvedAddress || location, // Use resolved address if available
                 temperature: `${current.temp}°C`,
                 description: current.conditions,
                 humidity: `${current.humidity}%`,
                 windSpeed: `${current.windspeed} km/h`,
                 source: 'Visual Crossing API' // Indicate the actual source
             };
        } else {
             // Handle cases where the API returns 200 OK but no useful data
             throw new Error(`No current weather conditions found for ${location}`);
        }
        // --- End data extraction ---
    } catch (error) {
        console.error(`Error calling weather API for ${location}:`, error.response?.data?.message || error.response?.data || error.message);
        // Handle specific API errors (like 404 Not Found or 400 Bad Request for invalid location)
        if (error.response) {
             if (error.response.status === 400 || error.response.status === 404) {
                 throw new Error(`Location not found or invalid: ${location}`);
             } else {
                 throw new Error(`API error for ${location}: Status ${error.response.status}`);
             }
        }
        // Handle network errors or other issues
        throw new Error(`Failed to fetch weather data for ${location} from external API`);
    }
    // --- End Placeholder ---


    /* // Remove or comment out the old hardcoded logic
    // Hardcoded response for initial setup
    if (location.toLowerCase() === 'london') {
        // ... hardcoded london data ...
    } else if (location.toLowerCase() === 'tokyo') {
        // ... hardcoded tokyo data ...
    } else {
        // Simulate a 'not found' scenario for other cities in this hardcoded example
        throw new Error(`City not found: ${location}`);
    }
    */
}

// New function to get weather for multiple locations concurrently
async function getWeatherForLocations(locations) {
    // Use Promise.allSettled to fetch all locations, even if some fail
    const promises = locations.map(location => getWeatherByCity(location));
    const results = await Promise.allSettled(promises);

    // Return the array of settled promises (contains status and value/reason)
    // The route handler will process this array
    return results;
}

module.exports = {
    getWeatherByCity, // Keep exporting if needed elsewhere, otherwise could be internal
    getWeatherForLocations,
};
