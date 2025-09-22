import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, Clock, Brain } from 'lucide-react';
import { generateAQIForecast, getAQICategory, fetchDelhiAQI, fetchWeatherData, type AQIData, type WeatherData } from '@/services/aqiService';
import { cn } from '@/lib/utils';

interface ForecastData {
  hour: string;
  aqi: number;
  category: string;
  color: string;
}

const AQIForecast = () => {
  const [forecast24h, setForecast24h] = useState<ForecastData[]>([]);
  const [forecast72h, setForecast72h] = useState<ForecastData[]>([]);
  const [currentAQI, setCurrentAQI] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateForecasts = async () => {
      setLoading(true);
      try {
        // Fetch current AQI data
        const aqiData = await fetchDelhiAQI();
        if (aqiData.length > 0) {
          const avgAQI = Math.round(aqiData.reduce((sum, station) => sum + station.aqi, 0) / aqiData.length);
          setCurrentAQI(avgAQI);

          // Fetch weather data for more accurate forecasting
          const weatherData = await fetchWeatherData(aqiData[0].location.lat, aqiData[0].location.lng);
          
          // Generate forecasts
          const forecast = generateAQIForecast(avgAQI, weatherData);
          
          // Process 24-hour forecast
          const forecast24 = forecast.slice(0, 24).map((aqi, index) => {
            const category = getAQICategory(aqi);
            const hour = new Date();
            hour.setHours(hour.getHours() + index + 1);
            
            return {
              hour: hour.getHours().toString().padStart(2, '0') + ':00',
              aqi,
              category: category.category,
              color: category.color
            };
          });

          // Process 72-hour forecast (3-hour intervals)
          const forecast72 = forecast.filter((_, index) => index % 3 === 0).slice(0, 24).map((aqi, index) => {
            const category = getAQICategory(aqi);
            const time = new Date();
            time.setHours(time.getHours() + (index + 1) * 3);
            
            return {
              hour: time.toLocaleDateString('en-IN', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit'
              }),
              aqi,
              category: category.category,
              color: category.color
            };
          });

          setForecast24h(forecast24);
          setForecast72h(forecast72);
        }
      } catch (error) {
        console.error('Error generating forecasts:', error);
      } finally {
        setLoading(false);
      }
    };

    generateForecasts();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className={cn("w-3 h-3 rounded-full", `bg-${data.color}`)} />
            <span>AQI: {payload[0].value}</span>
            <Badge variant="outline" className="text-xs">
              {data.category}
            </Badge>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forecast Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI-Powered AQI Forecasting
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Machine learning predictions based on current conditions, weather patterns, and historical data
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="24h" className="space-y-4">
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="24h" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            24 Hours
          </TabsTrigger>
          <TabsTrigger value="72h" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            3 Days
          </TabsTrigger>
        </TabsList>

        <TabsContent value="24h" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">24-Hour Forecast</CardTitle>
              <p className="text-sm text-muted-foreground">
                Hourly AQI predictions for Delhi-NCR region
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecast24h}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 12 }}
                      interval={2}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={[0, 'dataMax + 50']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="aqi" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Peak AQI</p>
                    <p className="text-2xl font-bold text-aqi-poor">
                      {Math.max(...forecast24h.map(f => f.aqi))}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-aqi-poor" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Best AQI</p>
                    <p className="text-2xl font-bold text-aqi-good">
                      {Math.min(...forecast24h.map(f => f.aqi))}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-aqi-good rotate-180" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg AQI</p>
                    <p className="text-2xl font-bold">
                      {Math.round(forecast24h.reduce((sum, f) => sum + f.aqi, 0) / forecast24h.length)}
                    </p>
                  </div>
                  <Brain className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="72h">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">72-Hour Extended Forecast</CardTitle>
              <p className="text-sm text-muted-foreground">
                3-hour interval predictions for the next 3 days
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecast72h}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={[0, 'dataMax + 50']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="aqi" 
                      fill="hsl(var(--primary))"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AQIForecast;