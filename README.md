# City Weather

A small weather app built with Express and EJS. Search for a city to see current conditions, the next 24 hours, and a 3-day forecast.

## Run locally

Requirements: Node.js 20 or newer.

1. Install dependencies with `npm install`.
2. Create a `.env` file in the project root and add your WeatherAPI key:

   ```env
   apiKey=YOUR_WEATHERAPI_KEY
   ```

3. Start the app with `npm start`, then open <http://localhost:3000>.

## Deploy on Render

Create a **Web Service** connected to this GitHub repository and set:

- **Build command:** `npm install`
- **Start command:** `npm start`
- **Environment variable:** `apiKey` (set its value to your WeatherAPI key)

The app reads the API key from `process.env.apiKey`. Environment-variable names are case-sensitive. Do not commit `.env` or put the API key in source code.
