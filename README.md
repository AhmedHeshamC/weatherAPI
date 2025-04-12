# Weather API By Ahmed Hesham

A RESTful service that provides current weather data by leveraging the Visual Crossing API and implementing caching with Memcached.

## Features

- Fetch weather data for multiple locations in a single request
- Caching system to improve performance and reduce external API calls
- API key authentication for secure access
- Rate limiting to prevent abuse
- Error handling for invalid locations or API failures

## Prerequisites

- Node.js (v12 or higher)
- npm or yarn
- Memcached server running
- Visual Crossing API key

## Installation

1. Clone the repository or download the source code
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root with the following variables:

```
# Third-party Weather API Key
WEATHER_API_KEY=your_visual_crossing_api_key

# Memcached server address
MEMCACHED_SERVER=127.0.0.1:11211

# Port for the server
PORT=3000

# Cache expiration time in seconds (e.g., 1 hour)
CACHE_EXPIRATION_SECONDS=3600

# API Key for securing this server's endpoints
SERVER_API_KEY=your_secure_api_key
```

## Running the Application

### Development mode (with auto-restart):

```bash
npm run dev
```

### Production mode:

```bash
npm start
```

The server will start at http://localhost:3000 (or the port specified in your `.env` file).

## API Documentation

### Check API Status

**Endpoint:** `GET /`

**Description:** Check if the API is running

**Authentication:** None required

**Response:**
```
Weather API is running!
```

### Get Weather Data

**Endpoint:** `POST /api/v1/weather`

**Description:** Get weather information for one or more locations

**Authentication:** Required
- Header: `x-api-key`
- Value: Your SERVER_API_KEY from .env file

**Request Body:**
```json
{
  "locations": ["London", "New York", "Tokyo"]
}
```

**Constraints:**
- The `locations` array must contain between 1 and 10 items
- Each item should be a city name or zip code as a string

**Success Response (200 OK):**
```json
[
  {
    "location": "London, England, United Kingdom",
    "temperature": "12.5°C",
    "description": "Cloudy",
    "humidity": "85.0%",
    "windSpeed": "10.5 km/h",
    "source": "Visual Crossing API"
  },
  {
    "location": "New York, NY, United States",
    "temperature": "18.2°C",
    "description": "Partly cloudy",
    "humidity": "65.3%",
    "windSpeed": "8.7 km/h",
    "source": "Visual Crossing API"
  },
  {
    "location": "Tokyo, Tokyo, Japan",
    "temperature": "22.8°C",
    "description": "Clear",
    "humidity": "70.1%",
    "windSpeed": "5.2 km/h",
    "source": "Visual Crossing API"
  }
]
```

**Error Responses:**

- **400 Bad Request:** Invalid input format
```json
{
  "message": "Please provide an array of 1 to 10 locations (city names or zip codes) in the request body under the \"locations\" key."
}
```

- **401 Unauthorized:** Missing API key
```json
{
  "message": "Unauthorized: API key is missing."
}
```

- **403 Forbidden:** Invalid API key
```json
{
  "message": "Forbidden: Invalid API key."
}
```

- **429 Too Many Requests:** Rate limit exceeded (100 requests per 15 minutes)
```json
{
  "message": "Too many requests from this IP, please try again after 15 minutes"
}
```

- **500 Internal Server Error:** Server-side error
```json
{
  "message": "Something broke!"
}
```

## Example Usage

### Using cURL

```bash
curl -X POST \
  http://localhost:3000/api/v1/weather \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: YOUR_SERVER_API_KEY' \
  -d '{"locations": ["London", "Paris", "Berlin"]}'
```

### Using JavaScript (Fetch API)

```javascript
const fetchWeather = async () => {
  const response = await fetch('http://localhost:3000/api/v1/weather', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_SERVER_API_KEY'
    },
    body: JSON.stringify({
      locations: ['London', 'Paris', 'Berlin']
    })
  });
  
  const data = await response.json();
  console.log(data);
};

fetchWeather();
```

## Caching Behavior

- Weather data is cached using Memcached for improved performance
- Each location's data is stored with a key pattern: `weather_location_name` (lowercase with spaces replaced by underscores)
- Cache expiration time is configured via the `CACHE_EXPIRATION_SECONDS` environment variable (default: 3600 seconds / 1 hour)
- If a location's data is found in the cache, it's returned without calling the external API
- Only missing data is fetched from the external API, and then cached for subsequent requests

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per 15-minute window per IP address
- When the limit is exceeded, requests return a 429 status code

## License

ISC

## Author
Ahmed Hesham

## Project URLs
- https://roadmap.sh/projects/weather-api-wrapper-service
