import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Home, 
  BarChart3, 
  Satellite, 
  Shield, 
  Settings, 
  RefreshCw,
  Activity,
  MapPin,
  Bell
} from 'lucide-react';
import AQIDashboard from '@/components/AQIDashboard';
import AQIForecast from '@/components/AQIForecast';
import SourceIdentification from '@/components/SourceIdentification';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setLastRefresh(new Date());
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-primary to-accent rounded-lg">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Delhi-NCR Air Quality Monitor</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Pollution Analytics</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <div className="text-sm text-muted-foreground">
                Updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <Satellite className="w-4 h-4" />
              <span className="hidden sm:inline">Sources</span>
            </TabsTrigger>
            <TabsTrigger value="policy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Policy</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AQIDashboard />
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <AQIForecast />
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <SourceIdentification />
          </TabsContent>

          <TabsContent value="policy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Policy Dashboard
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Data-driven insights for policymakers and intervention tracking
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Policy Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-l-4 border-l-aqi-very-poor">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Bell className="w-5 h-5 text-aqi-very-poor" />
                        <h3 className="font-medium">Immediate Action Required</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Stubble burning contributing 35% to current AQI levels
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Enhanced satellite monitoring of Punjab/Haryana</li>
                        <li>• Accelerate crop residue management programs</li>
                        <li>• Deploy additional air quality monitors</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-aqi-moderate">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Settings className="w-5 h-5 text-aqi-moderate" />
                        <h3 className="font-medium">Medium-term Strategies</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Vehicular emissions at 28% - focus on transport solutions
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Expand public transportation network</li>
                        <li>• Implement stricter emission norms</li>
                        <li>• Promote electric vehicle adoption</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Intervention Tracking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Intervention Effectiveness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-aqi-good/10 rounded-lg">
                        <span className="font-medium">Odd-Even Policy (Last Implementation)</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-aqi-good">-15%</div>
                          <div className="text-xs text-muted-foreground">AQI Reduction</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-aqi-satisfactory/10 rounded-lg">
                        <span className="font-medium">Construction Ban (Emergency)</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-aqi-satisfactory">-8%</div>
                          <div className="text-xs text-muted-foreground">PM10 Reduction</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-aqi-moderate/10 rounded-lg">
                        <span className="font-medium">Firecracker Ban (Diwali 2023)</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-aqi-moderate">-12%</div>
                          <div className="text-xs text-muted-foreground">Peak AQI Reduction</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Connected Data Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <div className="text-sm font-medium">CPCB</div>
                        <div className="text-xs text-muted-foreground">40 Stations</div>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Satellite className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <div className="text-sm font-medium">NASA FIRMS</div>
                        <div className="text-xs text-muted-foreground">Fire Data</div>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Activity className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <div className="text-sm font-medium">Weather API</div>
                        <div className="text-xs text-muted-foreground">Meteorology</div>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <div className="text-sm font-medium">ML Models</div>
                        <div className="text-xs text-muted-foreground">Predictions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Delhi-NCR Air Quality Monitor • Real-time data auto-refreshes every 15 minutes
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Data sources: CPCB, NASA FIRMS, OpenWeather • AICTE Clean & Green Technology Initiative
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;