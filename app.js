const weatherCodeMap = {
    0: { desc: 'Clear sky', icon: '☀️' },
    1: { desc: 'Mainly clear', icon: '🌤️' },
    2: { desc: 'Partly cloudy', icon: '⛅' },
    3: { desc: 'Overcast', icon: '☁️' },
    45: { desc: 'Fog', icon: '🌫️' },
    48: { desc: 'Depositing rime fog', icon: '🌫️' },
    51: { desc: 'Light drizzle', icon: '🌧️' },
    53: { desc: 'Moderate drizzle', icon: '🌧️' },
    55: { desc: 'Dense drizzle', icon: '🌧️' },
    56: { desc: 'Light freezing drizzle', icon: '🌧️❄️' },
    57: { desc: 'Dense freezing drizzle', icon: '🌧️❄️' },
    61: { desc: 'Slight rain', icon: '🌦️' },
    63: { desc: 'Moderate rain', icon: '🌧️' },
    65: { desc: 'Heavy rain', icon: '🌧️' },
    66: { desc: 'Light freezing rain', icon: '🌧️❄️' },
    67: { desc: 'Heavy freezing rain', icon: '🌧️❄️' },
    71: { desc: 'Slight snow', icon: '🌨️' },
    73: { desc: 'Moderate snow', icon: '❄️' },
    75: { desc: 'Heavy snow', icon: '❄️' },
    77: { desc: 'Snow grains', icon: '❄️' },
    80: { desc: 'Slight rain showers', icon: '🌦️' },
    81: { desc: 'Moderate rain showers', icon: '🌧️' },
    82: { desc: 'Violent rain showers', icon: '⛈️' },
    85: { desc: 'Slight snow showers', icon: '🌨️' },
    86: { desc: 'Heavy snow showers', icon: '❄️' },
    95: { desc: 'Thunderstorm', icon: '⛈️' },
    96: { desc: 'Thunderstorm + hail', icon: '⛈️🧊' },
    99: { desc: 'Heavy thunderstorm + hail', icon: '⛈️🧊' }
};

let currentWeatherData = null;
let debounceTimer;

const DOM = {
    input: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    validMsg: document.getElementById('validationMsg'),
    errorBanner: document.getElementById('errorBanner'),
    errMsg: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    city: document.getElementById('cityName'),
    temp: document.getElementById('currentTemp'),
    desc: document.getElementById('weatherDesc'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('windSpeed'),
    time: document.getElementById('localTime'),
    grid: document.getElementById('forecastGrid')
};

function init() {
    initForecastSkeletons();
    
    DOM.input.addEventListener('input', handleDebounceSearch);
    
    DOM.searchBtn.addEventListener('click', () => {
        const city = DOM.input.value.trim();
        if (city) triggerSearch(city);
    });
    
    DOM.retryBtn.addEventListener('click', () => {
        const city = DOM.input.value.trim();
        if (city) triggerSearch(city);
    });
}

function handleDebounceSearch(e) {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query.length > 0 && query.length < 2) {
        DOM.validMsg.classList.remove('hidden');
        return;
    }
    
    DOM.validMsg.classList.add('hidden');

    debounceTimer = setTimeout(() => {
        if (query.length >= 2) triggerSearch(query);
    }, 500);
}

function triggerSearch(city) {
    if (!city || city.length < 2) return;
    hideError();
    setSkeletons(true);
    fetchWeatherData(city);
}

async function fetchWeatherData(city) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`;

        const geoRes = await fetch(geoUrl, { signal: controller.signal });
        
        if (!geoRes.ok) throw new Error(`Geocoding HTTP Error: ${geoRes.status}`);
        
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            showError(`City "${city}" not found.`);
            setSkeletons(false, true);
            return;
        }

        const { latitude, longitude, name, timezone } = geoData.results[0];

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

        const weatherRes = await fetch(weatherUrl, { signal: controller.signal });
        
        if (!weatherRes.ok) throw new Error(`Weather HTTP Error: ${weatherRes.status}`);
        
        const weatherData = await weatherRes.json();

        currentWeatherData = { name, weatherData, timezone };
        
        renderUI();
        fetchLocalTime(timezone);

    } catch (err) {
        if (err.name === 'AbortError') {
            showError("Request timed out after 10 seconds.");
        } else {
            showError("Network error: " + err.message); 
        }
        setSkeletons(false, true);
    } finally {
        clearTimeout(timeoutId);
    }
}

function fetchLocalTime(timezone) {
    if (!timezone) {
        DOM.time.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " (Local)";
        DOM.time.classList.remove('skeleton');
        return;
    }

    const timeApiUrl = `https://timeapi.io/api/Time/current/zone?timeZone=${timezone}`;
    
    $.getJSON(timeApiUrl)
        .done(function(data) {
            const date = new Date(data.dateTime); 
            DOM.time.textContent = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        })
        .fail(function() {
            DOM.time.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " (Local)";
        })
        .always(function() {
            DOM.time.classList.remove('skeleton');
            console.log(`Time request completed at: ${new Date().toLocaleTimeString()}`);
        });
}

function renderUI() {
    const { name, weatherData } = currentWeatherData;
    const current = weatherData.current_weather;
    const hourly = weatherData.hourly;
    const daily = weatherData.daily;
    
    const codeInfo = weatherCodeMap[current.weathercode] || { desc: 'Unknown', icon: '❓' };
    
    DOM.city.textContent = name;
    DOM.temp.textContent = `${current.temperature.toFixed(1)}°C`;
    DOM.desc.textContent = `${codeInfo.icon} ${codeInfo.desc}`;
    DOM.humidity.textContent = `${hourly.relativehumidity_2m[0]}%`;
    DOM.wind.textContent = `${current.windspeed} km/h`;

    DOM.grid.innerHTML = '';
    for(let i = 0; i < 7; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dCode = weatherCodeMap[daily.weathercode[i]] || { icon: '❓' };
        
        DOM.grid.innerHTML += `
            <div class="forecast-card">
                <h4>${dayName}</h4>
                <div class="forecast-icon">${dCode.icon}</div>
                <p>H: ${daily.temperature_2m_max[i].toFixed(0)}°C</p>
                <p>L: ${daily.temperature_2m_min[i].toFixed(0)}°C</p>
            </div>
        `;
    }
    
    setSkeletons(false);
    
    DOM.time.textContent = ''; 
    DOM.time.classList.add('skeleton');
}

function setSkeletons(isActive, clearData = false) {
    const els = [DOM.city, DOM.temp, DOM.desc, DOM.humidity, DOM.wind, DOM.time];
    els.forEach(el => {
        if (isActive) { 
            el.classList.add('skeleton'); 
            if(clearData) el.textContent = ''; 
        } else { 
            el.classList.remove('skeleton'); 
        }
    });
    if (isActive) initForecastSkeletons();
}

function initForecastSkeletons() {
    DOM.grid.innerHTML = '';
    for(let i=0; i<7; i++) {
        DOM.grid.innerHTML += `
            <div class="forecast-card">
                <h4 class="skeleton skeleton-text short"></h4>
                <div class="skeleton" style="width:50px; height:50px; margin:10px auto;"></div>
                <p class="skeleton skeleton-text"></p>
                <p class="skeleton skeleton-text"></p>
            </div>
        `;
    }
}

function showError(msg) { 
    DOM.errMsg.textContent = msg; 
    DOM.errorBanner.classList.remove('hidden'); 
}

function hideError() { 
    DOM.errorBanner.classList.add('hidden'); 
}

init();