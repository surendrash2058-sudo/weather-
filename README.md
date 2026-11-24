# SkyCast Weather App

A responsive weather dashboard built with vanilla HTML, CSS and JavaScript. It uses the free [Open-Meteo](https://open-meteo.com/) forecast and geocoding APIs, so no API key or backend server is required.

## Features
- Current temperature, feels-like temperature and conditions
- Humidity, wind speed, UV index and precipitation chance
- 24-hour hourly forecast and 7-day forecast
- Search for cities around the world
- Optional browser geolocation
- Celsius / Fahrenheit toggle
- Responsive mobile and desktop layout

## Run locally
Open `index.html` in a browser, or run a local static server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy with GitHub Pages
The workflow in `.github/workflows/deploy.yml` builds and deploys the site whenever changes are pushed to `main`. In the repository, open **Settings → Pages** and make sure **Source** is set to **GitHub Actions**. After the workflow succeeds, the site is available at:

https://surendrash2058-sudo.github.io/weather-/

## Data and privacy
Weather data comes from Open-Meteo. Location access is optional and only requested after the visitor presses **Use my location**. No API key is stored in this repository.
