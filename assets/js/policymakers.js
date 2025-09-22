// Policymakers Dashboard JavaScript

let sourceChart = null;
let fireChart = null;
let regionalChart = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePolicyDashboard();
    
    // Set up auto-refresh every 15 minutes
    setInterval(loadPolicyData, 15 * 60 * 1000);
});

async function initializePolicyDashboard() {
    await loadPolicyData();
}

async function loadPolicyData() {
    try {
        // Fetch all required data
        const aqiData = await AQIService.fetchDelhiAQI();
        const fireData = await FireService.fetchFireData();
        
        if (aqiData.length > 0) {
            const averageAQI = Math.round(aqiData.reduce((sum, station) => sum + station.aqi, 0) / aqiData.length);
            
            // Update key metrics
            updateKeyMetrics(aqiData, fireData);
            
            // Update charts
            updateSourceChart();
            updateFireChart(fireData);
            updateRegionalChart(aqiData);
            
            // Fetch weather data for recommendations
            const weatherData = await AQIService.fetchWeatherData(aqiData[0].location.lat, aqiData[0].location.lng);
            
            // Update AI recommendations
            updateAIRecommendations(aqiData, fireData, weatherData);
            updateInterventionTracker();
            updateSourceDetails();
            
            updateLastUpdated();
        }
    } catch (error) {
        console.error('Error loading policy data:', error);
    }
}

function updateKeyMetrics(aqiData, fireData) {
    // Critical stations (AQI > 300)
    const criticalStations = aqiData.filter(station => station.aqi > 300).length;
    document.getElementById('criticalStations').textContent = criticalStations;
    
    // Active fires (high confidence)
    const activeFires = fireData.filter(fire => fire.confidence > 80).length;
    document.getElementById('activeFires').textContent = activeFires;
    
    // AQI trend (simulated)
    const currentAvg = Math.round(aqiData.reduce((sum, station) => sum + station.aqi, 0) / aqiData.length);
    const yesterdayAvg = currentAvg - (Math.random() * 40 - 20); // Simulated yesterday's average
    const trend = currentAvg > yesterdayAvg ? '↑' : '↓';
    const trendPercent = Math.abs(((currentAvg - yesterdayAvg) / yesterdayAvg) * 100).toFixed(1);
    document.getElementById('aqiTrend').textContent = `${trend}${trendPercent}%`;
}

function updateSourceChart() {
    const ctx = document.getElementById('sourceChart').getContext('2d');
    
    if (sourceChart) {
        sourceChart.destroy();
    }
    
    const sourceData = [
        { name: 'Stubble Burning', percentage: 35, color: '#dc3545' },
        { name: 'Vehicular Emissions', percentage: 28, color: '#fd7e14' },
        { name: 'Industrial Activity', percentage: 20, color: '#ffc107' },
        { name: 'Dust & Construction', percentage: 12, color: '#28a745' },
        { name: 'Other Sources', percentage: 5, color: '#6c757d' }
    ];
    
    sourceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sourceData.map(s => s.name),
            datasets: [{
                data: sourceData.map(s => s.percentage),
                backgroundColor: sourceData.map(s => s.color),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            }
        }
    });
}

function updateFireChart(fireData) {
    const ctx = document.getElementById('fireChart').getContext('2d');
    
    if (fireChart) {
        fireChart.destroy();
    }
    
    const firesByDate = FireService.processFiresByDate(fireData);
    
    fireChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: firesByDate.map(f => {
                const date = new Date(f.date);
                return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Fire Count',
                data: firesByDate.map(f => f.fires),
                backgroundColor: '#dc3545',
                borderColor: '#c82333',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateRegionalChart(aqiData) {
    const ctx = document.getElementById('regionalChart').getContext('2d');
    
    if (regionalChart) {
        regionalChart.destroy();
    }
    
    regionalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: aqiData.map(station => station.city),
            datasets: [{
                label: 'Current AQI',
                data: aqiData.map(station => station.aqi),
                backgroundColor: aqiData.map(station => {
                    const category = AQI_CATEGORIES.getCategory(station.aqi);
                    const colors = {
                        'aqi-good': '#28a745',
                        'aqi-satisfactory': '#ffc107',
                        'aqi-moderate': '#fd7e14',
                        'aqi-poor': '#dc3545',
                        'aqi-very-poor': '#6f42c1',
                        'aqi-severe': '#495057'
                    };
                    return colors[category.color] || '#6c757d';
                }),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
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
                y: {
                    beginAtZero: true,
                    max: 500,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            const category = AQI_CATEGORIES.getCategory(value);
                            return value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateAIRecommendations(aqiData, fireData, weatherData) {
    const recommendations = PolicyService.generateRecommendations(aqiData, fireData, weatherData);
    const container = document.getElementById('aiRecommendations');
    
    container.innerHTML = recommendations.map(rec => {
        const priorityClass = {
            'Critical': 'danger',
            'High': 'warning',
            'Medium': 'info',
            'Low': 'secondary'
        };
        
        return `
            <div class="card mb-3 border-${priorityClass[rec.priority] || 'secondary'}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="d-flex align-items-center">
                            <i class="${rec.icon} fa-2x text-${priorityClass[rec.priority] || 'secondary'} me-3"></i>
                            <div>
                                <h6 class="mb-1">${rec.action}</h6>
                                <small class="text-muted">${rec.category}</small>
                            </div>
                        </div>
                        <span class="badge bg-${priorityClass[rec.priority] || 'secondary'}">${rec.priority}</span>
                    </div>
                    
                    <div class="row g-3">
                        <div class="col-md-6">
                            <strong>Expected Impact:</strong>
                            <div class="text-muted">${rec.impact}</div>
                        </div>
                        <div class="col-md-6">
                            <strong>Timeline:</strong>
                            <div class="text-muted">${rec.timeline}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateInterventionTracker() {
    const interventions = PolicyService.getInterventionTracking();
    const container = document.getElementById('interventionTracker');
    
    container.innerHTML = interventions.map(intervention => {
        const statusColors = {
            'success': 'success',
            'warning': 'warning',
            'info': 'info'
        };
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <h6 class="card-title">${intervention.intervention}</h6>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-${statusColors[intervention.statusClass]}">${intervention.status}</span>
                        <small class="text-muted">${intervention.duration}</small>
                    </div>
                    <div class="small text-muted">
                        <strong>Effectiveness:</strong> ${intervention.effectiveness}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateSourceDetails() {
    const container = document.getElementById('sourceDetails');
    
    const sources = [
        { 
            name: 'Stubble Burning',
            icon: 'fas fa-fire',
            percentage: 35,
            trend: '↑ 15%',
            trendClass: 'danger',
            description: 'Agricultural fires in Punjab & Haryana'
        },
        {
            name: 'Vehicular Emissions',
            icon: 'fas fa-car',
            percentage: 28,
            trend: '↓ 5%',
            trendClass: 'success',
            description: 'Cars, buses, trucks and two-wheelers'
        },
        {
            name: 'Industrial Activity',
            icon: 'fas fa-industry',
            percentage: 20,
            trend: '→ 2%',
            trendClass: 'info',
            description: 'Manufacturing, power plants, construction'
        },
        {
            name: 'Dust & Construction',
            icon: 'fas fa-hard-hat',
            percentage: 12,
            trend: '↓ 8%',
            trendClass: 'success',
            description: 'Road dust, construction activities'
        },
        {
            name: 'Other Sources',
            icon: 'fas fa-ellipsis-h',
            percentage: 5,
            trend: '→ 1%',
            trendClass: 'info',
            description: 'Waste burning, cooking, natural sources'
        }
    ];
    
    container.innerHTML = sources.map(source => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <div class="p-2 bg-primary/10 rounded me-3">
                            <i class="${source.icon} fa-lg text-primary"></i>
                        </div>
                        <div>
                            <h6 class="mb-1">${source.name}</h6>
                            <div class="d-flex align-items-center">
                                <span class="h5 fw-bold me-2">${source.percentage}%</span>
                                <small class="text-${source.trendClass}">${source.trend}</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="progress mb-2" style="height: 6px;">
                        <div class="progress-bar bg-primary" style="width: ${source.percentage * 2}%"></div>
                    </div>
                    
                    <p class="small text-muted mb-0">${source.description}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = Utils.formatDateTime(now);
    document.getElementById('lastUpdated').textContent = timeString;
}

// Time frame selector functionality
document.querySelectorAll('input[name="timeframe"]').forEach(radio => {
    radio.addEventListener('change', function() {
        // Here you could reload data for different time frames
        console.log(`Time frame changed to: ${this.id}`);
        // For demo purposes, we'll just log the change
        // In a real implementation, you'd fetch data for the selected timeframe
    });
});