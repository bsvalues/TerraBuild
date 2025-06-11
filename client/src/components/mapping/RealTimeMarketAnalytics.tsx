import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, DollarSign, Home, Users,
  Clock, Zap, Activity, BarChart3, MapPin, Target
} from 'lucide-react';

interface MarketData {
  region: string;
  medianPrice: number;
  priceChange: number;
  inventory: number;
  daysOnMarket: number;
  absorption: number;
  salesVolume: number;
  pricePerSqft: number;
  activeListings: number;
  pendingSales: number;
  lastUpdated: string;
}

interface RealTimeMarketAnalyticsProps {
  selectedRegion?: string;
  onRegionSelect: (region: string) => void;
}

export const RealTimeMarketAnalytics: React.FC<RealTimeMarketAnalyticsProps> = ({
  selectedRegion = 'Richland',
  onRegionSelect
}) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [selectedRegion]);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      // Simulate real-time market data fetch
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockData: MarketData = {
        region: selectedRegion,
        medianPrice: 425000 + Math.floor((Math.random() - 0.5) * 10000),
        priceChange: 3.2 + (Math.random() - 0.5) * 2,
        inventory: 1.8 + (Math.random() - 0.5) * 0.4,
        daysOnMarket: 45 + Math.floor((Math.random() - 0.5) * 10),
        absorption: 2.8 + (Math.random() - 0.5) * 0.6,
        salesVolume: 124 + Math.floor(Math.random() * 20),
        pricePerSqft: 185 + Math.floor((Math.random() - 0.5) * 20),
        activeListings: 267 + Math.floor((Math.random() - 0.5) * 40),
        pendingSales: 89 + Math.floor((Math.random() - 0.5) * 15),
        lastUpdated: new Date().toLocaleString()
      };
      
      setMarketData(mockData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const regions = [
    'Richland', 'Kennewick', 'Pasco', 'West Richland', 
    'Benton City', 'Finch', 'Horn Rapids'
  ];

  const getMarketHealthColor = (inventory: number) => {
    if (inventory < 1.5) return 'text-red-400';
    if (inventory < 3) return 'text-green-400';
    if (inventory < 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMarketHealthLabel = (inventory: number) => {
    if (inventory < 1.5) return 'Seller\'s Market';
    if (inventory < 3) return 'Balanced Market';
    if (inventory < 6) return 'Buyer\'s Market';
    return 'Slow Market';
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getPriceChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  if (!marketData) {
    return (
      <Card className="bg-slate-900/95 border-slate-600 backdrop-blur">
        <CardContent className="p-6 text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 text-slate-400 animate-pulse" />
          <div className="text-slate-400">Loading market data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/95 border-slate-600 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-Time Market Analytics
          </div>
          <Badge variant="outline" className="text-xs">
            {isLoading ? 'Updating...' : 'Live'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Region Selector */}
        <div className="flex flex-wrap gap-1">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => onRegionSelect(region)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedRegion === region
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-400">Median Price</span>
            </div>
            <div className="font-bold text-white text-lg">
              ${marketData.medianPrice.toLocaleString()}
            </div>
            <div className={`flex items-center gap-1 text-xs ${getPriceChangeColor(marketData.priceChange)}`}>
              {getPriceChangeIcon(marketData.priceChange)}
              {marketData.priceChange >= 0 ? '+' : ''}{marketData.priceChange.toFixed(1)}% YoY
            </div>
          </div>

          <div className="bg-slate-800/50 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">Inventory</span>
            </div>
            <div className="font-bold text-white text-lg">
              {marketData.inventory.toFixed(1)} months
            </div>
            <div className={`text-xs ${getMarketHealthColor(marketData.inventory)}`}>
              {getMarketHealthLabel(marketData.inventory)}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-slate-400">Days on Market</span>
            </div>
            <div className="font-bold text-white text-lg">
              {marketData.daysOnMarket}
            </div>
            <div className="text-xs text-slate-400">
              Avg. time to sell
            </div>
          </div>

          <div className="bg-slate-800/50 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-400">Price/Sq Ft</span>
            </div>
            <div className="font-bold text-white text-lg">
              ${marketData.pricePerSqft}
            </div>
            <div className="text-xs text-slate-400">
              Average pricing
            </div>
          </div>
        </div>

        {/* Market Activity */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-300">Market Activity</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Active Listings</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-700 rounded-full h-1">
                  <div 
                    className="h-1 bg-blue-400 rounded-full"
                    style={{ width: `${Math.min(100, (marketData.activeListings / 400) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-white w-8 text-right">{marketData.activeListings}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Pending Sales</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-700 rounded-full h-1">
                  <div 
                    className="h-1 bg-green-400 rounded-full"
                    style={{ width: `${Math.min(100, (marketData.pendingSales / 150) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-white w-8 text-right">{marketData.pendingSales}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Sales Volume (30d)</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-700 rounded-full h-1">
                  <div 
                    className="h-1 bg-purple-400 rounded-full"
                    style={{ width: `${Math.min(100, (marketData.salesVolume / 200) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-white w-8 text-right">{marketData.salesVolume}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Absorption Rate */}
        <div className="bg-slate-800/30 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-medium text-slate-300">Absorption Rate</span>
            </div>
            <span className="text-sm font-bold text-orange-400">
              {marketData.absorption.toFixed(1)} months
            </span>
          </div>
          <Progress 
            value={Math.min(100, (6 - marketData.absorption) / 6 * 100)} 
            className="h-2"
          />
          <div className="text-xs text-slate-400 mt-1">
            Time to absorb current inventory at current sales pace
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-600">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <button 
            onClick={fetchMarketData}
            disabled={isLoading}
            className="flex items-center gap-1 hover:text-slate-300 transition-colors"
          >
            <Zap className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </CardContent>
    </Card>
  );
};