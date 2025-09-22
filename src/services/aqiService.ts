import axios from 'axios';

const AQICN_TOKEN = '8fd33513cb7c5bd7a8b957ffa407c0d1805abf08';
const OPENWEATHER_API_KEY = '5abdf3419f06bbac859d61943f4aff7c';
const NASA_FIRMS_API_KEY = '558a917aac444e7134423ea7e1c58791';

export interface AQIData {
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  dominentpol: string;
  time: string;
  city: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
}

export interface FireData {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: number;
  acq_date: string;
  satellite: string;
}

export const getAQICategory = (aqi: number): {
  category: string;
  color: string;
  description: string;
} => {
  if (aqi <= 50) return { 
    category: 'Good', 
    color: 'aqi-good',
    description: 'Air quality is satisfactory and poses little or no risk.'
  };
  if (aqi <= 100) return { 
    category: 'Satisfactory', 
    color: 'aqi-satisfactory',
    description: 'Air quality is acceptable for most people.'
  };
  if (aqi <= 200) return { 
    category: 'Moderate', 
    color: 'aqi-moderate',
    description: 'Members of sensitive groups may experience health effects.'
  };
  if (aqi <= 300) return { 
    category: 'Poor', 
    color: 'aqi-poor',
    description: 'Health effects may be experienced by everyone.'
  };
  if (aqi <= 400) return { 
    category: 'Very Poor', 
    color: 'aqi-very-poor',
    description: 'Health alert: everyone may experience serious health effects.'
  };
  return { 
    category: 'Severe', 
    color: 'aqi-severe',
    description: 'Emergency conditions: everyone is likely to be affected.'
  };
};

// Fetch AQI data for Delhi-NCR stations
export const fetchDelhiAQI = async (): Promise<AQIData[]> => {
  const stations = [
    'delhi',
    'gurgaon', 
    'noida',
    'faridabad',
    'ghaziabad'
  ];

  try {
    const promises = stations.map(async (station) => {
      const response = await axios.get(
        `https://api.waqi.info/feed/${station}/?token=${AQICN_TOKEN}`
      );
      
      if (response.data.status === 'ok') {
        const data = response.data.data;
        return {
          aqi: data.aqi,
          pm25: data.iaqi?.pm25?.v || 0,
          pm10: data.iaqi?.pm10?.v || 0,
          o3: data.iaqi?.o3?.v || 0,
          no2: data.iaqi?.no2?.v || 0,
          so2: data.iaqi?.so2?.v || 0,
          co: data.iaqi?.co?.v || 0,
          dominentpol: data.dominentpol,
          time: data.time.s,
          city: data.city.name,
          location: {
            lat: data.city.geo[0],
            lng: data.city.geo[1]
          }
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean) as AQIData[];
  } catch (error) {
    console.error('Error fetching AQI data:', error);
    return [];
  }
};

// Fetch weather data for correlation analysis
export const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    return {
      temp: response.data.main.temp,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      windDirection: response.data.wind.deg,
      pressure: response.data.main.pressure,
      visibility: response.data.visibility / 1000 // Convert to km
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

// Fetch fire data from NASA FIRMS for stubble burning detection
export const fetchFireData = async (): Promise<FireData[]> => {
  try {
    // Punjab and Haryana region coordinates
    const response = await axios.get(
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${NASA_FIRMS_API_KEY}/MODIS_C6_1/29,74,32,77/1`,
      { headers: { 'Accept': 'text/csv' } }
    );

    // Parse CSV data (simplified for demo)
    const lines = response.data.split('\n');
    const fires: FireData[] = [];
    
    for (let i = 1; i < lines.length && i < 50; i++) { // Limit to 50 recent fires
      const row = lines[i].split(',');
      if (row.length > 8) {
        fires.push({
          latitude: parseFloat(row[0]),
          longitude: parseFloat(row[1]),
          brightness: parseFloat(row[2]),
          confidence: parseFloat(row[8]),
          acq_date: row[5],
          satellite: row[7]
        });
      }
    }

    return fires;
  } catch (error) {
    console.error('Error fetching fire data:', error);
    return [];
  }
};

// Generate AQI forecast (simplified ML prediction)
export const generateAQIForecast = (currentAQI: number, weatherData: WeatherData | null): number[] => {
  const forecast = [];
  let baseAQI = currentAQI;

  for (let i = 1; i <= 72; i++) { // 72-hour forecast
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
    const hour = (i % 24);
    if (hour >= 6 && hour <= 10) change += 15; // Morning traffic
    if (hour >= 18 && hour <= 22) change += 20; // Evening traffic + fires

    baseAQI = Math.max(0, Math.min(500, baseAQI + change));
    forecast.push(Math.round(baseAQI));
  }

  return forecast;
};