// Main JavaScript for Home Page

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the dashboard
    initializeDashboard();
    
    // Set up auto-refresh every 15 minutes
    setInterval(loadDashboardData, 15 * 60 * 1000);
});

async function initializeDashboard() {
    await loadDashboardData();
}

async function loadDashboardData() {
    try {
        // Show loading states
        Utils.showLoading('currentAQI');
        
        // Fetch AQI data
        const aqiData = await AQIService.fetchDelhiAQI();
        
        if (aqiData.length > 0) {
            // Calculate average AQI
            const averageAQI = Math.round(aqiData.reduce((sum, station) => sum + station.aqi, 0) / aqiData.length);
            const aqiCategory = AQI_CATEGORIES.getCategory(averageAQI);
            
            // Update main AQI display
            updateMainAQIDisplay(averageAQI, aqiCategory);
            
            // Update station cards
            updateStationCards(aqiData);
            
            // Update last updated time
            updateLastUpdated();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        document.getElementById('currentAQI').innerHTML = 'Error';
        document.getElementById('aqiCategory').innerHTML = 'Unable to load';
    }
}

function updateMainAQIDisplay(aqi, category) {
    // Update AQI number
    const aqiElement = document.getElementById('currentAQI');
    aqiElement.innerHTML = aqi;
    aqiElement.className = `display-1 fw-bold ${category.color}`;
    
    // Update category badge
    const categoryElement = document.getElementById('aqiCategory');
    categoryElement.innerHTML = category.category;
    categoryElement.className = `badge fs-6 px-3 py-2 ${category.bgColor} text-white`;
}

function updateStationCards(aqiData) {
    const container = document.getElementById('stationCards');
    
    if (!container) return;
    
    container.innerHTML = aqiData.map(station => {
        const category = AQI_CATEGORIES.getCategory(station.aqi);
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card station-card ${category.category.toLowerCase().replace(' ', '-')} border-0 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-map-marker-alt me-2"></i>${station.city}
                            </h5>
                            <span class="badge ${category.bgColor} text-white">${station.aqi}</span>
                        </div>
                        
                        <div class="row g-2 text-sm">
                            <div class="col-6">
                                <small class="text-muted">PM2.5:</small>
                                <strong class="ms-1">${station.pm25} µg/m³</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">PM10:</small>
                                <strong class="ms-1">${station.pm10} µg/m³</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">O₃:</small>
                                <strong class="ms-1">${station.o3} µg/m³</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">NO₂:</small>
                                <strong class="ms-1">${station.no2} µg/m³</strong>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <small class="text-muted">
                                Dominant: <strong>${(station.dominentpol || 'pm25').toUpperCase()}</strong>
                            </small>
                        </div>
                        
                        <div class="progress mt-2" style="height: 4px;">
                            <div class="progress-bar ${category.color.replace('aqi-', 'bg-aqi-')}" 
                                 style="width: ${(station.aqi / 500) * 100}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = Utils.formatDateTime(now);
    
    const element = document.getElementById('lastUpdated');
    if (element) {
        element.textContent = timeString;
    }
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add animation classes when elements come into view
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.card, section').forEach(el => {
    observer.observe(el);
});