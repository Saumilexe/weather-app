import express from "express";
import axios from "axios";
import "dotenv/config";

const app = express();
const port = process.env.PORT || 3000;
const API_URL = "https://api.weatherapi.com/v1";

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// ---------- helpers ----------

// WeatherAPI returns icons as "//cdn.weatherapi.com/..." (no protocol)
const iconUrl = (icon) => (icon.startsWith("//") ? `https:${icon}` : icon);

// "2026-10-11 14:00" -> "2 PM"
function formatHour(timeString) {
    const hour = Number(timeString.split(" ")[1].slice(0, 2));
    return `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;
}

// "2026-10-11" -> "Today" / "Tomorrow" / "Tuesday"
function dayLabel(dateString, index) {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";
    return new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
    });
}

function uvLabel(uv) {
    if (uv < 3) return "Low";
    if (uv < 6) return "Moderate";
    if (uv < 8) return "High";
    if (uv < 11) return "Very high";
    return "Extreme";
}

const showError = (res, message) =>
    res.redirect(`/error?message=${encodeURIComponent(message)}`);

// ---------- routes ----------

app.get("/", (req, res) => {
    res.render("main.ejs");
});

app.get("/error", (req, res) => {
    const errorMessage = req.query.message;
    res.render("error.ejs", { errorMessage });
});

app.post("/", async (req, res) => {
    const citySearch = (req.body.city || "").trim();
    if (!citySearch) {
        return showError(res, "Enter a city name to see its weather.");
    }

    try {
        // One request returns current conditions, today's hours and the 3-day forecast
        const response = await axios.get(`${API_URL}/forecast.json`, {
            params: { q: citySearch, key: process.env.apiKey, days: 3 },
        });

        const { location, current, forecast } = response.data;
        const today = forecast.forecastday[0];

        // Next 24 hours in 3-hour steps, starting from the hour we're in now
        const allHours = forecast.forecastday.flatMap((day) => day.hour);
        const nowIndex = Math.max(
            allHours.findLastIndex((h) => h.time_epoch <= location.localtime_epoch),
            0
        );
        const hourly = Array.from({ length: 8 }, (_, i) => allHours[nowIndex + i * 3])
            .filter(Boolean)
            .map((h, i) => ({
                label: i === 0 ? "Now" : formatHour(h.time),
                icon: iconUrl(h.condition.icon),
                text: h.condition.text,
                temp: Math.round(h.temp_c),
            }));

        const days = forecast.forecastday.map((day, i) => ({
            label: dayLabel(day.date, i),
            icon: iconUrl(day.day.condition.icon),
            text: day.day.condition.text,
            max: Math.round(day.day.maxtemp_c),
            min: Math.round(day.day.mintemp_c),
            rain: day.day.daily_chance_of_rain,
        }));

        const data = {
            cityName: `${location.name}, ${location.country}`,
            isDay: current.is_day === 1,
            currentTemp: Math.round(current.temp_c),
            condition: current.condition.text,
            icon: iconUrl(current.condition.icon).replace("/64x64/", "/128x128/"),
            maxTemp: Math.round(today.day.maxtemp_c),
            minTemp: Math.round(today.day.mintemp_c),
            feelsLike: Math.round(current.feelslike_c),
            humidity: current.humidity,
            uv: current.uv,
            uvLabel: uvLabel(current.uv),
            wind: Math.round(current.wind_kph),
            windDir: current.wind_dir,
            sunrise: today.astro.sunrise,
            sunset: today.astro.sunset,
            hourly,
            days,
        };

        res.render("index.ejs", { data, pageTitle: `${location.name} weather` });
    } catch (error) {
        // Bad city name -> WeatherAPI answers 400 with a readable message
        if (error.response?.status === 400) {
            return showError(res, error.response.data?.error?.message || "We couldn't find that city.");
        }
        console.error("Weather request failed:", error.message);
        showError(res, "The weather service isn't responding. Try again in a moment.");
    }
});

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});
