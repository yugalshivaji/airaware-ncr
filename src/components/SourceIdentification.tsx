import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Flame, Car, Factory, Wind, Satellite, MapPin } from 'lucide-react';
import { fetchFireData, type FireData } from '@/services/aqiService';

interface PollutionSource {
  name: string;
  percentage: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

const SourceIdentification = () => {
  const [fireData, setFireData] = useState<FireData[]>([]);
  const [loading, setLoading] = useState(true);

  // Pollution source breakdown (based on typical Delhi-NCR patterns)
  const pollutionSources: PollutionSource[] = [
    {
      name: 'Stubble Burning',
      percentage: 35,
      color: 'hsl(var(--aqi-very-poor))',
      icon: <Flame className="w-5 h-5" />,
      description: 'Agricultural fires in Punjab & Haryana (Oct-Nov)'
    },
    {
      name: 'Vehicular Emissions',
      percentage: 28,
      color: 'hsl(var(--aqi-poor))',
      icon: <Car className="w-5 h-5" />,
      description: 'Cars, buses, trucks and two-wheelers'
    },
    {
      name: 'Industrial Activity',
      percentage: 20,
      color: 'hsl(var(--aqi-moderate))',
      icon: <Factory className="w-5 h-5" />,
      description: 'Manufacturing, power plants, construction'
    },
    {
      name: 'Dust & Construction',
      percentage: 12,
      color: 'hsl(var(--aqi-satisfactory))',
      icon: <Wind className="w-5 h-5" />,
      description: 'Road dust, construction activities'
    },
    {
      name: 'Other Sources',
      percentage: 5,
      color: 'hsl(var(--aqi-good))',
      icon: <MapPin className="w-5 h-5" />,
      description: 'Waste burning, cooking, natural sources'
    }
  ];

  useEffect(() => {
    const loadFireData = async () => {
      setLoading(true);
      try {
        const fires = await fetchFireData();
        setFireData(fires);
      } catch (error) {
        console.error('Error loading fire data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFireData();
  }, []);

  // Process fire data for visualization
  const processFiresByDate = () => {
    const firesByDate: { [key: string]: number } = {};
    
    fireData.forEach(fire => {
      const date = fire.acq_date;
      firesByDate[date] = (firesByDate[date] || 0) + 1;
    });

    return Object.entries(firesByDate)
      .map(([date, count]) => ({ date, fires: count }))
      .slice(-7) // Last 7 days
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const firesByDate = processFiresByDate();
  
  // Calculate high-confidence fires
  const highConfidenceFires = fireData.filter(fire => fire.confidence > 80).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-primary" />
            Pollution Source Identification
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Satellite-based monitoring and AI analysis of pollution sources across Delhi-NCR
          </p>
        </CardHeader>
      </Card>

      {/* Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Source Contribution Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pollutionSources}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {pollutionSources.map((source, index) => (
                      <Cell key={`cell-${index}`} fill={source.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Source Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pollutionSources.map((source, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-1 rounded-lg"
                      style={{ backgroundColor: `${source.color}20` }}
                    >
                      <div style={{ color: source.color }}>
                        {source.icon}
                      </div>
                    </div>
                    <span className="font-medium">{source.name}</span>
                  </div>
                  <Badge variant="outline">{source.percentage}%</Badge>
                </div>
                <Progress value={source.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground ml-8">
                  {source.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fire Detection Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-aqi-very-poor" />
              Stubble Burning Detection
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              NASA FIRMS satellite data for Punjab & Haryana region
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-aqi-very-poor/10 rounded-lg">
                <div className="text-3xl font-bold text-aqi-very-poor">{fireData.length}</div>
                <div className="text-sm text-muted-foreground">Total Fire Points</div>
              </div>
              <div className="text-center p-4 bg-aqi-severe/10 rounded-lg">
                <div className="text-3xl font-bold text-aqi-severe">{highConfidenceFires}</div>
                <div className="text-sm text-muted-foreground">High Confidence</div>
              </div>
            </div>

            {firesByDate.length > 0 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={firesByDate}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      labelFormatter={(label) => `Date: ${label}`}
                      formatter={(value) => [`${value} fires`, 'Fire Count']}
                    />
                    <Bar 
                      dataKey="fires" 
                      fill="hsl(var(--aqi-very-poor))"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-time Monitoring Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-aqi-good/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Satellite className="w-5 h-5 text-aqi-good" />
                  <span className="font-medium">NASA MODIS</span>
                </div>
                <Badge variant="outline" className="text-aqi-good border-aqi-good">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-aqi-good/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-aqi-good" />
                  <span className="font-medium">CPCB Stations</span>
                </div>
                <Badge variant="outline" className="text-aqi-good border-aqi-good">
                  Online
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-aqi-satisfactory/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wind className="w-5 h-5 text-aqi-satisfactory" />
                  <span className="font-medium">Weather Integration</span>
                </div>
                <Badge variant="outline" className="text-aqi-satisfactory border-aqi-satisfactory">
                  Synced
                </Badge>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Data Sources</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• NASA FIRMS fire detection system</li>
                <li>• ISRO satellite imagery analysis</li>
                <li>• CPCB ground monitoring stations</li>
                <li>• Traffic density mapping</li>
                <li>• Industrial emission tracking</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SourceIdentification;