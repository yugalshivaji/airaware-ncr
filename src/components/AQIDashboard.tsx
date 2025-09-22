import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wind, Thermometer, Droplets, Eye, AlertTriangle, MapPin } from 'lucide-react';
import { fetchDelhiAQI, fetchWeatherData, getAQICategory, type AQIData, type WeatherData } from '@/services/aqiService';
import { cn } from '@/lib/utils';

const AQIDashboard = () => {
  const [aqiData, setAQIData] = useState<AQIData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const aqi = await fetchDelhiAQI();
        setAQIData(aqi);

        if (aqi.length > 0) {
          const weather = await fetchWeatherData(aqi[0].location.lat, aqi[0].location.lng);
          setWeatherData(weather);
        }

        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Auto-refresh every 15 minutes
    const interval = setInterval(loadData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const averageAQI = aqiData.length > 0 
    ? Math.round(aqiData.reduce((sum, station) => sum + station.aqi, 0) / aqiData.length)
    : 0;

  const aqiCategory = getAQICategory(averageAQI);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading Delhi-NCR Air Quality Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Delhi-NCR Air Quality Monitor
        </h1>
        <p className="text-muted-foreground">
          Real-time pollution monitoring & forecasting • Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {/* Main AQI Display */}
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg text-muted-foreground">Average AQI - Delhi NCR</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="relative">
            <div className={cn(
              "text-8xl font-bold mb-2",
              `text-${aqiCategory.color}`
            )}>
              {averageAQI}
            </div>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-lg px-4 py-1",
                `bg-${aqiCategory.color}/10 text-${aqiCategory.color} border-${aqiCategory.color}/20`
              )}
            >
              {aqiCategory.category}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={(averageAQI / 500) * 100} 
              className="h-3"
            />
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {aqiCategory.description}
            </p>
          </div>

          {averageAQI > 200 && (
            <div className="flex items-center justify-center gap-2 text-aqi-poor bg-aqi-poor/10 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Health Alert: Limit outdoor activities</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Station Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aqiData.map((station, index) => {
          const stationCategory = getAQICategory(station.aqi);
          return (
            <Card key={index} className="relative overflow-hidden">
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1",
                `bg-${stationCategory.color}`
              )} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {station.city}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      `border-${stationCategory.color} text-${stationCategory.color}`
                    )}
                  >
                    {station.aqi}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">PM2.5:</span>
                    <span className="ml-2 font-medium">{station.pm25} µg/m³</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PM10:</span>
                    <span className="ml-2 font-medium">{station.pm10} µg/m³</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">O₃:</span>
                    <span className="ml-2 font-medium">{station.o3} µg/m³</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">NO₂:</span>
                    <span className="ml-2 font-medium">{station.no2} µg/m³</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Dominant pollutant: <span className="font-medium">{station.dominentpol?.toUpperCase()}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weather Conditions */}
      {weatherData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              Weather Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-1/10 rounded-lg">
                  <Thermometer className="w-5 h-5 text-chart-1" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{weatherData.temp}°C</div>
                  <div className="text-sm text-muted-foreground">Temperature</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <Wind className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{weatherData.windSpeed} m/s</div>
                  <div className="text-sm text-muted-foreground">Wind Speed</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-3/10 rounded-lg">
                  <Droplets className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{weatherData.humidity}%</div>
                  <div className="text-sm text-muted-foreground">Humidity</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-4/10 rounded-lg">
                  <Eye className="w-5 h-5 text-chart-4" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{weatherData.visibility} km</div>
                  <div className="text-sm text-muted-foreground">Visibility</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AQIDashboard;