const DOM = {
    input: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    city: document.getElementById('cityName'),
    temp: document.getElementById('currentTemp'),
    desc: document.getElementById('weatherDesc'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('windSpeed'),
    time: document.getElementById('localTime'),
    grid: document.getElementById('forecastGrid')
};

function initForecastSkeletons() {
    DOM.grid.innerHTML = '';
    for(let i = 0; i < 7; i++) {
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

initForecastSkeletons();