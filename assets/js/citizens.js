// Citizens Dashboard JavaScript

let forecastChart = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeCitizensDashboard();
    
    // Set up auto-refresh every 15 minutes
    setInterval(loadCitizensData, 15 * 60 * 1000);
});

async function initializeCitizensDashboard() {
    await loadCitizensData();
}

async function loadCitizensData() {
    try {
        // Fetch AQI data
        const aqiData = await AQIService.fetchDelhiAQI();
        
        if (aqiData.length > 0) {
            const averageAQI = Math.round(aqiData.reduce((sum, station) => sum + station.aqi, 0) / aqiData.length);
            const aqiCategory = AQI_CATEGORIES.getCategory(averageAQI);
            
            // Update main displays
            updateMainAQI(averageAQI, aqiCategory);
            updateHealthAlert(averageAQI, aqiCategory);
            updateStationDetails(aqiData);
            updatePollutantLevels(aqiData);
            updateHealthRecommendations(averageAQI);
            updateActivitySuggestions(averageAQI);
            
            // Fetch weather data for the first station
            const weatherData = await AQIService.fetchWeatherData(aqiData[0].location.lat, aqiData[0].location.lng);
            if (weatherData) {
                updateWeatherData(weatherData);
            }
            
            // Generate and display forecast
            const forecast = AQIService.generateAQIForecast(averageAQI, weatherData);
            updateForecastChart(forecast);
            
            updateLastUpdated();
        }
    } catch (error) {
        console.error('Error loading citizens data:', error);
    }
}

function updateMainAQI(aqi, category) {
    document.getElementById('mainAQI').innerHTML = aqi;
    document.getElementById('mainAQI').className = `display-1 fw-bold ${category.color}`;
    
    document.getElementById('mainAQICategory').innerHTML = category.category;
    document.getElementById('mainAQICategory').className = `badge fs-5 px-4 py-2 ${category.bgColor} text-white`;
    
    document.getElementById('aqiDescription').textContent = category.description;
    
    // Update progress bar
    const progressBar = document.getElementById('aqiProgress');
    progressBar.style.width = `${(aqi / 500) * 100}%`;
    progressBar.className = `progress-bar ${category.color.replace('aqi-', 'progress-bar aqi-')}`;
}

function updateHealthAlert(aqi, category) {
    const alertContainer = document.getElementById('healthAlert');
    const alertMessage = document.getElementById('alertMessage');
    
    if (aqi > 200) {
        alertContainer.style.display = 'block';
        alertMessage.textContent = `Current AQI is ${aqi} (${category.category}). ${category.healthAdvice}`;
        
        // Change alert class based on severity
        const alertElement = alertContainer.querySelector('.alert');
        alertElement.className = 'alert d-flex align-items-center';
        
        if (aqi > 400) {
            alertElement.classList.add('alert-danger');
        } else if (aqi > 300) {
            alertElement.classList.add('alert-warning');
        } else {
            alertElement.classList.add('alert-info');
        }
    } else {
        alertContainer.style.display = 'none';
    }
}

function updateWeatherData(weather) {
    document.getElementById('temperature').textContent = `${weather.temp}°C`;
    document.getElementById('windSpeed').textContent = `${weather.windSpeed} m/s`;
    document.getElementById('humidity').textContent = `${weather.humidity}%`;
    document.getElementById('visibility').textContent = `${weather.visibility} km`;
}

function updateStationDetails(aqiData) {
    const container = document.getElementById('stationDetails');
    
    container.innerHTML = aqiData.map(station => {
        const category = AQI_CATEGORIES.getCategory(station.aqi);
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            <i class="fas fa-map-marker-alt me-2"></i>${station.city}
                        </h6>
                        <span class="badge ${category.bgColor} text-white">${station.aqi}</span>
                    </div>
                    <div class="card-body">
                        <div class="row g-2">
                            <div class="col-6">
                                <div class="pollutant-level pm25">
                                    <div>
                                        <small class="text-muted">PM2.5</small>
                                        <div class="fw-bold">${station.pm25}</div>
                                        <small class="text-muted">µg/m³</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="pollutant-level pm10">
                                    <div>
                                        <small class="text-muted">PM10</small>
                                        <div class="fw-bold">${station.pm10}</div>
                                        <small class="text-muted">µg/m³</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="pollutant-level o3">
                                    <div>
                                        <small class="text-muted">O₃</small>
                                        <div class="fw-bold">${station.o3}</div>
                                        <small class="text-muted">µg/m³</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="pollutant-level no2">
                                    <div>
                                        <small class="text-muted">NO₂</small>
                                        <div class="fw-bold">${station.no2}</div>
                                        <small class="text-muted">µg/m³</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 text-center">
                            <small class="text-muted">
                                Dominant: <strong>${(station.dominentpol || 'pm25').toUpperCase()}</strong>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updatePollutantLevels(aqiData) {
    const container = document.getElementById('pollutantLevels');
    
    // Calculate average pollutant levels
    const avgPollutants = {
        pm25: Math.round(aqiData.reduce((sum, station) => sum + station.pm25, 0) / aqiData.length),
        pm10: Math.round(aqiData.reduce((sum, station) => sum + station.pm10, 0) / aqiData.length),
        o3: Math.round(aqiData.reduce((sum, station) => sum + station.o3, 0) / aqiData.length),
        no2: Math.round(aqiData.reduce((sum, station) => sum + station.no2, 0) / aqiData.length),
        so2: Math.round(aqiData.reduce((sum, station) => sum + station.so2, 0) / aqiData.length),
        co: Math.round(aqiData.reduce((sum, station) => sum + station.co, 0) / aqiData.length)
    };
    
    const pollutants = [
        { name: 'PM2.5', value: avgPollutants.pm25, unit: 'µg/m³', safe: 25, icon: 'fas fa-circle' },
        { name: 'PM10', value: avgPollutants.pm10, unit: 'µg/m³', safe: 50, icon: 'fas fa-circle' },
        { name: 'O₃', value: avgPollutants.o3, unit: 'µg/m³', safe: 100, icon: 'fas fa-circle' },
        { name: 'NO₂', value: avgPollutants.no2, unit: 'µg/m³', safe: 40, icon: 'fas fa-circle' },
        { name: 'SO₂', value: avgPollutants.so2, unit: 'µg/m³', safe: 40, icon: 'fas fa-circle' },
        { name: 'CO', value: avgPollutants.co, unit: 'mg/m³', safe: 2, icon: 'fas fa-circle' }
    ];
    
    container.innerHTML = pollutants.map(pollutant => {
        const isHigh = pollutant.value > pollutant.safe;
        const statusClass = isHigh ? 'danger' : 'success';
        const statusIcon = isHigh ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';
        
        return `
            <div class="col-md-4 col-lg-2 mb-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body text-center">
                        <i class="${pollutant.icon} fa-2x mb-2 text-${statusClass}"></i>
                        <h6>${pollutant.name}</h6>
                        <div class="h5 fw-bold text-${statusClass}">${pollutant.value}</div>
                        <small class="text-muted">${pollutant.unit}</small>
                        <div class="mt-2">
                            <i class="${statusIcon} text-${statusClass}"></i>
                            <small class="text-${statusClass}">
                                ${isHigh ? 'Above Safe' : 'Safe Level'}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateHealthRecommendations(aqi) {
    const recommendations = RecommendationService.getHealthRecommendations(aqi);
    const container = document.getElementById('healthRecommendations');
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card mb-3">
            <i class="fas fa-heart-pulse text-danger me-2"></i>
            ${rec}
        </div>
    `).join('');
}

function updateActivitySuggestions(aqi) {
    const activities = RecommendationService.getActivitySuggestions(aqi);
    const container = document.getElementById('activitySuggestions');
    
    container.innerHTML = activities.map(activity => `
        <div class="recommendation-card mb-3">
            <span class="me-2">${activity}</span>
        </div>
    `).join('');
}

function updateForecastChart(forecast) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    if (forecastChart) {
        forecastChart.destroy();
    }
    
    const chartData = {
        labels: forecast.map(f => f.time),
        datasets: [{
            label: 'AQI Forecast',
            data: forecast.map(f => f.aqi),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: forecast.map(f => {
                const category = AQI_CATEGORIES.getCategory(f.aqi);
                return getComputedStyle(document.documentElement).getPropertyValue(`--${category.color}`).trim();
            }),
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
        }]
    };
    
    forecastChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const aqi = context.parsed.y;
                            const category = AQI_CATEGORIES.getCategory(aqi);
                            return `AQI: ${aqi} (${category.category})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 500,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 6
                }
            }
        }
    });
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = Utils.formatDateTime(now);
    document.getElementById('lastUpdated').textContent = timeString;
}