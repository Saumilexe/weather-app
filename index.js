import express from "express";
import axios from "axios";
import ejs from "ejs";

const app = express();
const port = 3000;
const API_url = "http://api.weatherapi.com/v1";
const apiKey = "56833094fdc64921b62101810231010"

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("main.ejs");
});

app.get("/error", (req, res) => {
    const errorMessage = req.query.message;
    res.render("error.ejs", { errorMessage });
});

app.post("/", async (req, res) => {
    const citySearch = req.body["city"];
    try {
        const [result, forecastResult, sevenDayForecast] = await Promise.all([
            axios.get(API_url + "/current.json", {
                params: {
                    q: citySearch,
                    key: apiKey
                }
                }),
            axios.get(API_url + "/forecast.json", {
                params: {
                    q: citySearch,
                    key: apiKey
                }
                }),
            axios.get(API_url + "/forecast.json", {
                params: {
                    q: citySearch,
                    key: apiKey,
                    days: 7,
                    hours: 6
                }
            })
        ])

        const current_temp = result.data.current.temp_c;
        const cityName = result.data.location.name + ", " + result.data.location.country;
        const current_cond = result.data.current.condition.text;
        const current_wind = result.data.current.wind_kph;
        const current_icon = result.data.current.condition.icon;

        const feelsLike = result.data.current.feelslike_c;
        const uvIndex = result.data.current.uv;
        const humid = result.data.current.humidity;
        
        // const tempForecast0 = forecastResult.data.forecast.forecastday[0].hour[0].temp_c;
        // const tempForecast6 = forecastResult.data.forecast.forecastday[0].hour[6].temp_c;
        // const tempForecast12 = forecastResult.data.forecast.forecastday[0].hour[12].temp_c;
        // const tempForecast18 = forecastResult.data.forecast.forecastday[0].hour[18].temp_c;
        // writing the above 4 lines of code into a shorter version

        const hours = [0, 6, 12, 18];
        const tempForecast = hours.map(hour => forecastResult.data.forecast.forecastday[0].hour[hour].temp_c);
        // tempForecast will be an array with all 4 intervals 
        const tempForecastIcon = hours.map(hour => forecastResult.data.forecast.forecastday[0].hour[hour].condition.icon);

        const sunrise = forecastResult.data.forecast.forecastday[0].astro.sunrise;
        const sunset = forecastResult.data.forecast.forecastday[0].astro.sunset;
        const maxTemp = forecastResult.data.forecast.forecastday[0].day.maxtemp_c;
        const minTemp = forecastResult.data.forecast.forecastday[0].day.mintemp_c;

        const weekdayInfo = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const days = [0,1,2,3,4,5,6];
        const dates = days.map((days) => sevenDayForecast.data.forecast.forecastday[days].date);
        const dateString = dates.map((days) => new Date(days));
        const weekday = dateString.map((days) => days.getDay());
        const weekdayOut = weekday.map((Index) => weekdayInfo[Index]);

        const forecastIcons = days.map((days) => sevenDayForecast.data.forecast.forecastday[days].day.condition.icon);
        const forecastCond = days.map((days) => sevenDayForecast.data.forecast.forecastday[days].day.condition.text);
        const sevenMaxTemp = days.map((days) => sevenDayForecast.data.forecast.forecastday[days].day.maxtemp_c);
        const sevenMinTemp = days.map((days) => sevenDayForecast.data.forecast.forecastday[days].day.mintemp_c);

        const data = {
            cityName: cityName,
            current_temp: current_temp,
            current_cond: current_cond,
            wind : current_wind,
            mainIcon: current_icon,
            tempForecast: {
                hour0: tempForecast[0],
                hour6: tempForecast[1],
                hour12: tempForecast[2],
                hour18: tempForecast[3],
                icon0: tempForecastIcon[0],
                icon6: tempForecastIcon[1],
                icon12: tempForecastIcon[2],
                icon18: tempForecastIcon[3]
            },
            otherdetails: {
                realfeel: feelsLike,
                uvIndex: uvIndex,
                humidity: humid,
                sunrise: sunrise,
                sunset: sunset,
                maxTemp: maxTemp,
                minTemp: minTemp
            },
            sevenDayForecast: {
                forecastIcons,
                forecastCond,
                sevenMaxTemp,
                sevenMinTemp,
                weekdayOut
            }
        }

        res.render("index.ejs", {data});
    } catch (error) {
        const errorMessage = error.response.data.error.message;
        res.redirect(`/error?message=${encodeURIComponent(errorMessage)}`);
    }
});

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});