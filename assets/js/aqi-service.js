// AQI Service - API integration for air quality data

// API Configuration
const API_CONFIG = {
    AQICN_TOKEN: '8fd33513cb7c5bd7a8b957ffa407c0d1805abf08',
    OPENWEATHER_API_KEY: '5abdf3419f06bbac859d61943f4aff7c',
    NASA_FIRMS_API_KEY: '558a917aac444e7134423ea7e1c58791'
};

// AQI Category Definitions
const AQI_CATEGORIES = {
    getCategory: function(aqi) {
        if (aqi <= 50) return {
            category: 'Good',
            color: 'aqi-good',
            bgColor: 'bg-aqi-good',
            description: 'Air quality is satisfactory and poses little or no risk.',
            healthAdvice: 'Perfect day for outdoor activities!'
        };
        if (aqi <= 100) return {
            category: 'Satisfactory',
            color: 'aqi-satisfactory',
            bgColor: 'bg-aqi-satisfactory',
            description: 'Air quality is acceptable for most people.',
            healthAdvice: 'Enjoy outdoor activities, sensitive individuals may want to limit prolonged exertion.'
        };
        if (aqi <= 200) return {
            category: 'Moderate',
            color: 'aqi-moderate',
            bgColor: 'bg-aqi-moderate',
            description: 'Members of sensitive groups may experience health effects.',
            healthAdvice: 'Sensitive groups should consider reducing outdoor activities.'
        };
        if (aqi <= 300) return {
            category: 'Poor',
            color: 'aqi-poor',
            bgColor: 'bg-aqi-poor',
            description: 'Health effects may be experienced by everyone.',
            healthAdvice: 'Limit outdoor activities, especially for children and elderly.'
        };
        if (aqi <= 400) return {
            category: 'Very Poor',
            color: 'aqi-very-poor',
            bgColor: 'bg-aqi-very-poor',
            description: 'Health alert: everyone may experience serious health effects.',
            healthAdvice: 'Avoid outdoor activities. Use air purifiers indoors.'
        };
        return {
            category: 'Severe',
            color: 'aqi-severe',
            bgColor: 'bg-aqi-severe',
            description: 'Emergency conditions: everyone is likely to be affected.',
            healthAdvice: 'Stay indoors. Use N95 masks if you must go out.'
        };
    }
};

// Utility Functions
const Utils = {
    showLoading: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading-spinner"></div>';
        }
    },

    hideLoading: function(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = content;
        }
    },

    formatDateTime: function(date) {
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    handleApiError: function(error, context) {
        console.error(`Error in ${context}:`, error);
        return null;
    }
};

// AQI Data Service
const AQIService = {
    // Fetch AQI data for Delhi-NCR stations
    fetchDelhiAQI: async function() {
        const stations = ['delhi', 'gurgaon', 'noida', 'faridabad', 'ghaziabad'];
        
        try {
            const promises = stations.map(async (station) => {
                const response = await fetch(
                    `https://api.waqi.info/feed/${station}/?token=${API_CONFIG.AQICN_TOKEN}`
                );
                const data = await response.json();
                
                if (data.status === 'ok') {
                    const stationData = data.data;
                    return {
                        aqi: stationData.aqi,
                        pm25: stationData.iaqi?.pm25?.v || 0,
                        pm10: stationData.iaqi?.pm10?.v || 0,
                        o3: stationData.iaqi?.o3?.v || 0,
                        no2: stationData.iaqi?.no2?.v || 0,
                        so2: stationData.iaqi?.so2?.v || 0,
                        co: stationData.iaqi?.co?.v || 0,
                        dominentpol: stationData.dominentpol,
                        time: stationData.time.s,
                        city: stationData.city.name,
                        location: {
                            lat: stationData.city.geo[0],
                            lng: stationData.city.geo[1]
                        }
                    };
                }
                return null;
            });

            const results = await Promise.all(promises);
            return results.filter(Boolean);
        } catch (error) {
            Utils.handleApiError(error, 'fetchDelhiAQI');
            return [];
        }
    },

    // Fetch weather data for correlation analysis
    fetchWeatherData: async function(lat, lon) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_CONFIG.OPENWEATHER_API_KEY}&units=metric`
            );
            const data = await response.json();

            return {
                temp: Math.round(data.main.temp),
                humidity: data.main.humidity,
                windSpeed: Math.round(data.wind.speed * 10) / 10,
                windDirection: data.wind.deg,
                pressure: data.main.pressure,
                visibility: Math.round((data.visibility / 1000) * 10) / 10
            };
        } catch (error) {
            Utils.handleApiError(error, 'fetchWeatherData');
            return null;
        }
    },

    // Generate AQI forecast (simplified ML prediction)
    generateAQIForecast: function(currentAQI, weatherData) {
        const forecast = [];
        let baseAQI = currentAQI;

        for (let i = 1; i <= 24; i++) { // 24-hour forecast
            let change = Math.random() * 20 - 10; // Base random variation

            // Weather impact on AQI
            if (weatherData) {
                // Wind speed reduces pollution
                if (weatherData.windSpeed > 15) change -= 15;
                else if (weatherData.windSpeed < 5) change += 10;

                // High humidity can trap pollutants
                if (weatherData.humidity > 80) change += 8;

                // Temperature inversion effects
                if (weatherData.temp < 10) change += 12;
            }

            // Diurnal pattern (higher AQI in morning/evening)
            const hour = (new Date().getHours() + i) % 24;
            if (hour >= 6 && hour <= 10) change += 15; // Morning traffic
            if (hour >= 18 && hour <= 22) change += 20; // Evening traffic + fires

            baseAQI = Math.max(0, Math.min(500, baseAQI + change));
            
            const forecastTime = new Date();
            forecastTime.setHours(forecastTime.getHours() + i);
            
            forecast.push({
                time: forecastTime.getHours().toString().padStart(2, '0') + ':00',
                aqi: Math.round(baseAQI),
                category: AQI_CATEGORIES.getCategory(Math.round(baseAQI))
            });
        }

        return forecast;
    }
};

// Fire Data Service
const FireService = {
    // Fetch fire data from NASA FIRMS for stubble burning detection
    fetchFireData: async function() {
        try {
            // Simulated fire data for demo (NASA FIRMS API requires authentication)
            const mockFireData = this.generateMockFireData();
            return mockFireData;
        } catch (error) {
            Utils.handleApiError(error, 'fetchFireData');
            return [];
        }
    },

    generateMockFireData: function() {
        const fires = [];
        const dates = [];
        
        // Generate last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }

        dates.forEach((date, index) => {
            const fireCount = Math.floor(Math.random() * 50) + 10; // 10-60 fires per day
            for (let i = 0; i < fireCount; i++) {
                fires.push({
                    latitude: 29.5 + Math.random() * 2.5, // Punjab/Haryana region
                    longitude: 75.5 + Math.random() * 2,
                    brightness: 300 + Math.random() * 200,
                    confidence: 60 + Math.random() * 40,
                    acq_date: date,
                    satellite: Math.random() > 0.5 ? 'MODIS' : 'VIIRS'
                });
            }
        });

        return fires;
    },

    processFiresByDate: function(fireData) {
        const firesByDate = {};
        
        fireData.forEach(fire => {
            const date = fire.acq_date;
            firesByDate[date] = (firesByDate[date] || 0) + 1;
        });

        return Object.entries(firesByDate)
            .map(([date, count]) => ({ date, fires: count }))
            .slice(-7) // Last 7 days
            .sort((a, b) => a.date.localeCompare(b.date));
    }
};

// Health and Recommendations Service
const RecommendationService = {
    getHealthRecommendations: function(aqi) {
        const category = AQI_CATEGORIES.getCategory(aqi);
        
        const recommendations = {
            'Good': [
                'Perfect conditions for outdoor activities',
                'Great day for jogging, cycling, or outdoor sports',
                'Windows can be opened for natural ventilation',
                'No health precautions needed'
            ],
            'Satisfactory': [
                'Good day for outdoor activities',
                'Sensitive individuals should monitor symptoms',
                'Outdoor exercise is generally safe',
                'Consider air quality when planning long outdoor activities'
            ],
            'Moderate': [
                'Limit prolonged outdoor exertion if sensitive',
                'Consider indoor alternatives for exercise',
                'Keep rescue medications handy if asthmatic',
                'Monitor air quality trends before outdoor plans'
            ],
            'Poor': [
                'Avoid outdoor activities, especially for children',
                'Use air purifiers indoors',
                'Keep windows closed',
                'Wear N95 masks when going outside'
            ],
            'Very Poor': [
                'Stay indoors as much as possible',
                'Use air purifiers and keep windows sealed',
                'Mandatory use of N95 masks outdoors',
                'Avoid all outdoor exercise'
            ],
            'Severe': [
                'Emergency conditions - stay indoors',
                'Use air purifiers continuously',
                'Wear N95 masks even for brief outdoor exposure',
                'Seek medical attention if experiencing symptoms'
            ]
        };

        return recommendations[category.category] || [];
    },

    getActivitySuggestions: function(aqi) {
        const category = AQI_CATEGORIES.getCategory(aqi);
        
        const activities = {
            'Good': [
                '🏃‍♂️ Outdoor running and jogging',
                '🚴‍♀️ Cycling and outdoor sports',
                '🏞️ Nature walks and hiking',
                '🧘‍♀️ Outdoor yoga and meditation'
            ],
            'Satisfactory': [
                '🚶‍♂️ Light outdoor walks',
                '🏸 Recreational outdoor games',
                '🌳 Gardening activities',
                '📚 Reading in outdoor spaces'
            ],
            'Moderate': [
                '🏠 Indoor workouts and gym sessions',
                '🏊‍♀️ Swimming in covered pools',
                '🎬 Indoor entertainment activities',
                '🍳 Cooking and indoor hobbies'
            ],
            'Poor': [
                '🏋️‍♂️ Indoor gym and fitness activities',
                '📚 Reading and indoor learning',
                '🎨 Arts and crafts projects',
                '🎮 Indoor games and entertainment'
            ],
            'Very Poor': [
                '🧘‍♂️ Indoor meditation and relaxation',
                '📺 Movies and indoor entertainment',
                '🍲 Cooking and food preparation',
                '💼 Work from home activities'
            ],
            'Severe': [
                '🏠 Stay indoors - essential activities only',
                '📱 Virtual meetings and online activities',
                '📖 Reading and quiet indoor pursuits',
                '🤝 Connect with family indoors'
            ]
        };

        return activities[category.category] || [];
    }
};

// Policy Recommendations Service
const PolicyService = {
    generateRecommendations: function(aqiData, fireData, weatherData) {
        const avgAQI = aqiData.reduce((sum, station) => sum + station.aqi, 0) / aqiData.length;
        const highConfidenceFires = fireData.filter(fire => fire.confidence > 80).length;
        
        const recommendations = [];

        // Fire-based recommendations
        if (highConfidenceFires > 20) {
            recommendations.push({
                priority: 'High',
                category: 'Stubble Burning',
                action: 'Immediate deployment of teams to high-fire regions',
                impact: 'Could reduce AQI by 30-50 points',
                timeline: 'Immediate (24 hours)',
                icon: 'fas fa-fire'
            });
        }

        // Weather-based recommendations
        if (weatherData && weatherData.windSpeed < 5) {
            recommendations.push({
                priority: 'Medium',
                category: 'Traffic Management',
                action: 'Implement odd-even vehicle restrictions',
                impact: 'Could reduce AQI by 15-25 points',
                timeline: 'Short term (1-3 days)',
                icon: 'fas fa-car'
            });
        }

        // AQI-based recommendations
        if (avgAQI > 300) {
            recommendations.push({
                priority: 'Critical',
                category: 'Public Health',
                action: 'Issue public health emergency advisory',
                impact: 'Protect vulnerable populations',
                timeline: 'Immediate',
                icon: 'fas fa-exclamation-triangle'
            });
        }

        // Construction recommendations
        if (avgAQI > 200) {
            recommendations.push({
                priority: 'Medium',
                category: 'Construction',
                action: 'Halt construction activities in NCR',
                impact: 'Could reduce AQI by 10-20 points',
                timeline: 'Short term (1-7 days)',
                icon: 'fas fa-hard-hat'
            });
        }

        return recommendations.length > 0 ? recommendations : [{
            priority: 'Low',
            category: 'Monitoring',
            action: 'Continue regular monitoring and assessment',
            impact: 'Maintain current air quality levels',
            timeline: 'Ongoing',
            icon: 'fas fa-chart-line'
        }];
    },

    getInterventionTracking: function() {
        return [
            {
                intervention: 'Odd-Even Policy',
                status: 'Active',
                effectiveness: '15% AQI reduction',
                duration: '15 days',
                statusClass: 'success'
            },
            {
                intervention: 'Construction Ban',
                status: 'Under Review',
                effectiveness: 'TBD',
                duration: 'TBD',
                statusClass: 'warning'
            },
            {
                intervention: 'Stubble Burning Control',
                status: 'Planned',
                effectiveness: 'Expected 30% reduction',
                duration: '30 days',
                statusClass: 'info'
            }
        ];
    }
};

// Export services for global use
window.AQIService = AQIService;
window.FireService = FireService;
window.RecommendationService = RecommendationService;
window.PolicyService = PolicyService;
window.AQI_CATEGORIES = AQI_CATEGORIES;
window.Utils = Utils;