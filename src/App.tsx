/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LiveMap } from './components/LiveMap';
import { CarparkList } from './components/CarparkList';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { FavoritesWatchlist } from './components/FavoritesWatchlist';
import { ParkingRateCalculator } from './components/ParkingRateCalculator';
import { AIParkingAssistant } from './components/AIParkingAssistant';
import { EnrichedCarpark, FilterState, SummaryStats } from './types';
import { calculateDistanceKm } from './utils/svy21';
import { Car, Zap, Activity, AlertCircle, CloudRain, ShieldCheck, Sparkles, TrendingUp, Compass, Clock } from 'lucide-react';

export default function App() {
  const [carparks, setCarparks] = useState<EnrichedCarpark[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'favorites' | 'calculator' | 'ai'>('map');
  const [selectedCarpark, setSelectedCarpark] = useState<EnrichedCarpark | null>(null);
  
  // User Location
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Favorites (LocalStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_carpark_favorites');
      return saved ? JSON.parse(saved) : ['SUN01', 'CS1', 'TM1'];
    } catch {
      return ['SUN01', 'CS1', 'TM1'];
    }
  });

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    agency: 'ALL',
    carparkType: 'ALL',
    vehicleType: 'C',
    freeParking: false,
    nightParking: false,
    evCharging: false,
    highGantryOnly: false,
    statusFilter: 'ALL',
    areaFilter: 'ALL',
    sortBy: 'EMPTY_LOTS_DESC',
  });

  // Save favorites to LocalStorage
  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('sg_carpark_favorites', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save favorites:', e);
      }
      return next;
    });
  };

  // Fetch carparks from API
  const fetchCarparks = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    try {
      const res = await fetch('/api/carparks');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        let list: EnrichedCarpark[] = json.data;

        // If user location is active, compute distances
        if (userLocation) {
          list = list.map((cp) => ({
            ...cp,
            distance_km: calculateDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              cp.latitude,
              cp.longitude
            ),
          }));
        }

        setCarparks(list);
        setStats(json.stats);
      }
    } catch (err) {
      console.error('Error fetching carparks:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [userLocation]);

  // Initial load
  useEffect(() => {
    fetchCarparks();
  }, [fetchCarparks]);

  // Auto-refresh interval (every 60s)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchCarparks();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchCarparks]);

  // Handle Geolocation
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(coords);
        setIsLocating(false);

        // Update distance in carparks list & set sort to nearest
        setCarparks((prev) =>
          prev.map((cp) => ({
            ...cp,
            distance_km: calculateDistanceKm(coords.latitude, coords.longitude, cp.latitude, cp.longitude),
          }))
        );
        setFilters((prev) => ({ ...prev, sortBy: 'NEAREST' }));
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  // Top prominent live carpark hotspots
  const spotlightCarparks = carparks.slice(0, 4);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      {/* Top Bento Navigation */}
      <Navbar
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
        onRefresh={() => fetchCarparks(true)}
        isRefreshing={isRefreshing}
        onLocateUser={handleLocateUser}
        isLocating={isLocating}
        hasUserLocation={!!userLocation}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border-2 border-zinc-900 flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] animate-bounce">
              <Car className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-xl text-zinc-900 uppercase tracking-tight">Syncing Singapore Lots...</h3>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">Connecting to LTA & HDB Live Feeds</p>
            </div>
          </div>
        ) : (
          <>
            {/* Bento Grid Top Summary Dashboard (Visible on Map tab) */}
            {activeTab === 'map' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Bento Card 1: Live Available Lots Spotlight */}
                <div className="bg-white border-2 border-zinc-900 rounded-3xl p-5 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      VACANCY SPOTLIGHT
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-black border border-emerald-300">
                      LIVE
                    </span>
                  </div>
                  
                  <div className="my-3 space-y-2">
                    {spotlightCarparks.map((cp) => (
                      <div 
                        key={cp.id}
                        onClick={() => setSelectedCarpark(cp)}
                        className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 cursor-pointer transition-colors"
                      >
                        <div className="truncate max-w-[130px]">
                          <div className="text-xs font-black text-zinc-900 truncate">{cp.name}</div>
                          <div className="text-[10px] font-bold text-zinc-500">{cp.area}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-black text-emerald-600">
                            {cp.lots_summary.available_car_lots}
                          </div>
                          <div className="text-[9px] font-bold text-zinc-400">LOTS FREE</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[11px] font-black text-zinc-700">
                    <span>TOTAL ISLAND EMPTY</span>
                    <span className="font-mono text-zinc-900 text-sm font-black">
                      {stats ? stats.totalAvailableLots.toLocaleString() : '---'}
                    </span>
                  </div>
                </div>

                {/* Bento Card 2: Island Sensor Load Matrix */}
                <div className="bg-zinc-900 text-white rounded-3xl p-5 flex flex-col justify-between border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] relative overflow-hidden">
                  {/* Decorative background dot pattern */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      SECTOR LOAD MATRIX
                    </span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                  </div>

                  <div className="relative z-10 my-3 space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/80 border border-zinc-700">
                      <span className="text-xs font-bold">CBD & MARINA BAY</span>
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/50 text-[10px] font-mono px-2 py-0.5 rounded font-black">
                        MODERATE
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/80 border border-zinc-700">
                      <span className="text-xs font-bold">ORCHARD & BUGIS</span>
                      <span className="bg-red-400/20 text-red-300 border border-red-400/50 text-[10px] font-mono px-2 py-0.5 rounded font-black">
                        HIGH LOAD
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/80 border border-zinc-700">
                      <span className="text-xs font-bold">HEARTLAND MSCP</span>
                      <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/50 text-[10px] font-mono px-2 py-0.5 rounded font-black">
                        AVAILABLE
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] font-bold text-zinc-400">
                    <span>AVG ISLAND OCCUPANCY</span>
                    <span className="font-mono text-white text-sm font-black">
                      {stats ? `${stats.averageOccupancy}%` : '---'}
                    </span>
                  </div>
                </div>

                {/* Bento Card 3: Hourly Congestion Trend Bar Sparkline */}
                <div className="bg-zinc-200 border-2 border-zinc-900 rounded-3xl p-5 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                      HOURLY DEMAND PULSE
                    </span>
                    <TrendingUp className="w-4 h-4 text-zinc-800" />
                  </div>

                  <div className="my-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black font-mono tracking-tight text-zinc-900">
                        18:30
                      </span>
                      <span className="text-[11px] font-black text-zinc-600 uppercase">
                        EVENING PEAK
                      </span>
                    </div>

                    {/* Stylized Spark Bars */}
                    <div className="flex items-end gap-1.5 h-16 mt-3 pt-2 border-b-2 border-zinc-900/20">
                      <div className="flex-1 bg-zinc-400 rounded-t h-[30%]" title="10:00"></div>
                      <div className="flex-1 bg-zinc-400 rounded-t h-[50%]" title="12:00"></div>
                      <div className="flex-1 bg-zinc-500 rounded-t h-[65%]" title="14:00"></div>
                      <div className="flex-1 bg-zinc-600 rounded-t h-[45%]" title="16:00"></div>
                      <div className="flex-1 bg-zinc-900 rounded-t h-[95%]" title="18:00 (Peak)"></div>
                      <div className="flex-1 bg-zinc-800 rounded-t h-[80%]" title="20:00"></div>
                      <div className="flex-1 bg-zinc-400 rounded-t h-[35%]" title="22:00"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-black text-zinc-600 uppercase">
                    <span>MONITORED CARPARKS</span>
                    <span className="font-mono text-zinc-900 font-bold">{carparks.length}</span>
                  </div>
                </div>

                {/* Bento Card 4: Weather & Sheltered Advisory */}
                <div className="bg-amber-300 border-2 border-zinc-900 rounded-3xl p-5 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] text-zinc-950">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">
                      WEATHER & SHELTER
                    </span>
                    <CloudRain className="w-5 h-5 text-zinc-950" />
                  </div>

                  <div className="my-2">
                    <div className="text-base font-black uppercase leading-tight">
                      Wet Weather Advisory
                    </div>
                    <p className="text-xs font-semibold text-zinc-800 mt-1">
                      Rain expected in Central & East. Recommend covered MSCP & Basement lots.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, carparkType: 'MSCP' }));
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-black text-[11px] uppercase tracking-wider transition-colors border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    Filter Sheltered MSCP Only
                  </button>
                </div>

              </div>
            )}

            {/* View: Map & Directory */}
            {activeTab === 'map' && (
              <div className="space-y-6">
                {/* Interactive Map Bento Box */}
                <LiveMap
                  carparks={carparks}
                  selectedCarpark={selectedCarpark}
                  onSelectCarpark={(cp) => setSelectedCarpark(cp)}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  userLocation={userLocation}
                />

                {/* Search, Filter & List */}
                <CarparkList
                  carparks={carparks}
                  selectedCarpark={selectedCarpark}
                  onSelectCarpark={(cp) => setSelectedCarpark(cp)}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  filters={filters}
                  setFilters={setFilters}
                  hasUserLocation={!!userLocation}
                />
              </div>
            )}

            {/* View: My Favorites Watchlist */}
            {activeTab === 'favorites' && (
              <FavoritesWatchlist
                carparks={carparks}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectCarpark={(cp) => setSelectedCarpark(cp)}
                onGoToMap={() => setActiveTab('map')}
              />
            )}

            {/* View: Rate Estimator */}
            {activeTab === 'calculator' && <ParkingRateCalculator />}

            {/* View: AI Parking Advisor */}
            {activeTab === 'ai' && (
              <AIParkingAssistant
                carparks={carparks}
                onSelectCarpark={(cp) => {
                  setSelectedCarpark(cp);
                  setActiveTab('map');
                }}
                userLocation={userLocation}
              />
            )}
          </>
        )}
      </main>

      {/* Carpark Detailed Modal / Drawer */}
      <CarparkDetailModal
        carpark={selectedCarpark}
        onClose={() => setSelectedCarpark(null)}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Bento Footer */}
      <footer className="mt-auto border-t-2 border-zinc-900 bg-white py-6 text-xs text-zinc-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-zinc-900"></div>
            <span className="font-bold text-zinc-900">Singapore Smart Mobility & Parking Intelligence</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-semibold text-zinc-500">
            <span>Data.gov.sg</span>
            <span>•</span>
            <span>HDB Electronic Parking</span>
            <span>•</span>
            <span>LTA DataMall</span>
            <span>•</span>
            <span>URA Parking</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
