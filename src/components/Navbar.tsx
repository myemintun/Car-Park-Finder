/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  RefreshCw, 
  MapPin, 
  Bookmark, 
  Calculator, 
  Sparkles, 
  Compass, 
  Activity,
  Layers,
  Zap
} from 'lucide-react';
import { SummaryStats } from '../types';

interface NavbarProps {
  stats: SummaryStats | null;
  activeTab: 'map' | 'favorites' | 'calculator' | 'ai';
  setActiveTab: (tab: 'map' | 'favorites' | 'calculator' | 'ai') => void;
  favoritesCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLocateUser: () => void;
  isLocating: boolean;
  hasUserLocation: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  activeTab,
  setActiveTab,
  favoritesCount,
  onRefresh,
  isRefreshing,
  onLocateUser,
  isLocating,
  hasUserLocation
}) => {
  // Live Singapore Clock
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const s = now.toLocaleTimeString('en-SG', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setTimeString(s);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-zinc-100/90 backdrop-blur-md border-b-2 border-zinc-900 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Main Bento Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3">
          
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-zinc-900 border-2 border-zinc-900 flex items-center justify-center text-white shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-zinc-900 uppercase">
                  SG-PARK.LY
                </h1>
                <span className="bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded font-black tracking-wider uppercase">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                Real-time Parking Intelligence • Singapore
              </p>
            </div>
          </div>

          {/* Right Clock & Quick Action Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
            
            {/* Live Clock & Data Status */}
            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-mono font-black text-zinc-900 leading-none">
                {timeString || '12:00:00'}
              </div>
              <div className="flex items-center gap-1.5 justify-start sm:justify-end mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                  Data Live • SG Data.gov
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Geolocation Button */}
              <button
                id="btn-locate-user"
                onClick={onLocateUser}
                title="Find nearest car parks"
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                  hasUserLocation
                    ? 'bg-emerald-400 text-zinc-900 hover:bg-emerald-300'
                    : 'bg-white text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">
                  {hasUserLocation ? 'GPS ON' : 'NEAR ME'}
                </span>
              </button>

              {/* Refresh Button */}
              <button
                id="btn-refresh-data"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh live car park lots"
                className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-white hover:bg-zinc-100 text-zinc-900 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">REFRESH</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Bento Pill Bar) */}
        <div className="flex items-center gap-2 pt-2 border-t-2 border-zinc-900/10 overflow-x-auto no-scrollbar">
          <button
            id="tab-map-view"
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 border-zinc-900 ${
              activeTab === 'map'
                ? 'bg-zinc-900 text-white shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-white text-zinc-900 hover:bg-zinc-200/80 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Live Map & Directory
          </button>

          <button
            id="tab-favorites-view"
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 border-zinc-900 ${
              activeTab === 'favorites'
                ? 'bg-zinc-900 text-white shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-white text-zinc-900 hover:bg-zinc-200/80 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Watchlist
            {favoritesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                activeTab === 'favorites' ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'
              }`}>
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            id="tab-ai-advisor"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 border-zinc-900 ${
              activeTab === 'ai'
                ? 'bg-zinc-900 text-white shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-amber-300 text-zinc-900 hover:bg-amber-400 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            AI Parking Advisor
          </button>

          <button
            id="tab-calculator-view"
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 border-zinc-900 ${
              activeTab === 'calculator'
                ? 'bg-zinc-900 text-white shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-white text-zinc-900 hover:bg-zinc-200/80 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Rate Estimator
          </button>
        </div>
      </div>
    </header>
  );
};
