/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Car, 
  MapPin, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  Navigation, 
  Zap, 
  ShieldCheck, 
  Moon, 
  Gift, 
  Ruler, 
  Building2, 
  Clock, 
  DollarSign, 
  Share2, 
  Check, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { EnrichedCarpark } from '../types';

interface CarparkDetailModalProps {
  carpark: EnrichedCarpark | null;
  onClose: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  favorites,
  onToggleFavorite,
}) => {
  const [copied, setCopied] = useState(false);

  if (!carpark) return null;

  const isFav = favorites.includes(carpark.id);
  const availCars = carpark.lots_summary.available_car_lots;
  const totalCars = carpark.lots_summary.total_car_lots;
  const occRate = carpark.lots_summary.occupancy_rate;

  const availMotor = carpark.lots_summary.available_motorcycle_lots;
  const totalMotor = carpark.lots_summary.total_motorcycle_lots;

  // Gantry clearance guidance
  const gantryHeight = carpark.gantry_height;
  let vehicleGuidance = 'Sedans & Compact Cars Only';
  let guidanceColor = 'text-amber-700';
  if (gantryHeight >= 2.15) {
    vehicleGuidance = 'Fits High SUVs, MPVs & Vans (≥ 2.15m)';
    guidanceColor = 'text-emerald-700';
  } else if (gantryHeight >= 2.0) {
    vehicleGuidance = 'Fits Standard SUVs & Sedans (2.0m - 2.1m)';
    guidanceColor = 'text-zinc-800';
  }

  const handleShare = () => {
    const text = `SG-PARK.LY: ${carpark.name} (${carpark.carpark_number}) has ${availCars} empty car lots right now (${carpark.address}).`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.latitude},${carpark.longitude}`;
  const wazeUrl = `https://waze.com/ul?ll=${carpark.latitude},${carpark.longitude}&navigate=yes`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-zinc-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] p-6 sm:p-7 text-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Controls */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-zinc-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 text-white font-mono font-black text-xs">
                {carpark.carpark_number}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-xs font-black text-zinc-700 border border-zinc-300">
                {carpark.agency}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-xs font-bold text-zinc-500">
                {carpark.area} • {carpark.zone} Zone
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight uppercase">
              {carpark.name}
            </h2>
            <p className="text-xs font-bold text-zinc-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              {carpark.address} {carpark.postal_code ? `(S${carpark.postal_code})` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-modal-fav"
              onClick={() => onToggleFavorite(carpark.id)}
              className={`p-2.5 rounded-xl border-2 transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] ${
                isFav
                  ? 'bg-amber-300 border-zinc-900 text-zinc-950'
                  : 'bg-white hover:bg-zinc-100 border-zinc-900 text-zinc-700'
              }`}
              title={isFav ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isFav ? <BookmarkCheck className="w-5 h-5 text-zinc-950 fill-zinc-950" /> : <Bookmark className="w-5 h-5" />}
            </button>

            <button
              id="btn-modal-share"
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all"
              title="Share Carpark Info"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600 font-bold" /> : <Share2 className="w-5 h-5" />}
            </button>

            <button
              id="btn-modal-close"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Big Real-Time Vacancy Bento Box */}
        <div className="my-5 p-5 rounded-2xl bg-zinc-50 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Primary Car Lots Gauge */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-16 h-16 rounded-2xl border-2 border-zinc-900 font-mono font-black text-3xl shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] ${
                availCars > 15
                  ? 'bg-emerald-400 text-zinc-950'
                  : availCars > 0
                  ? 'bg-amber-300 text-zinc-950'
                  : 'bg-rose-500 text-white'
              }`}>
                {availCars}
              </div>

              <div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  CAR LOTS REAL-TIME VACANCY
                </span>
                <div className="text-lg font-black text-zinc-900">
                  {availCars > 0 ? `${availCars} empty lots right now` : 'Full (No empty lots)'}
                </div>
                <div className="text-xs text-zinc-500 font-mono font-bold">
                  Total Capacity: {totalCars} lots • {occRate}% Occupied
                </div>
              </div>
            </div>

            {/* Motorcycle Lots Indicator */}
            {totalMotor > 0 && (
              <div className="p-3 rounded-2xl bg-white border-2 border-zinc-900 text-center min-w-[140px] shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                <div className="text-[10px] font-black uppercase text-zinc-500">🏍️ Motor Lots</div>
                <div className="text-lg font-black font-mono text-zinc-900 mt-0.5">
                  {availMotor} / {totalMotor}
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase">Available</div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-zinc-200 rounded-full h-3 overflow-hidden border border-zinc-900">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                availCars > 15
                  ? 'bg-emerald-500'
                  : availCars > 0
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
              style={{ width: `${Math.max(4, 100 - occRate)}%` }}
            ></div>
          </div>
        </div>

        {/* 24-Hour Historical Occupancy Trend */}
        <div className="my-5 p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-zinc-900">
              <TrendingUp className="w-4 h-4 text-zinc-900" />
              Daily Occupancy Load Curve
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">SG Time</span>
          </div>

          <div className="grid grid-cols-8 gap-2 items-end h-24 pt-2">
            {carpark.historical_trend.map((point) => (
              <div key={point.hour} className="flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px] text-zinc-700 font-mono font-black">{point.occupancy}%</span>
                <div className="w-full bg-zinc-200 rounded-t-lg h-full flex items-end overflow-hidden border border-zinc-900">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      point.occupancy > 80
                        ? 'bg-rose-500'
                        : point.occupancy > 50
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ height: `${point.occupancy}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-zinc-600 font-mono font-bold">{point.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Specs Grid: Clearance, Type, Free Parking, EV */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          {/* Gantry Clearance */}
          <div className="p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <div className="flex items-center gap-2 text-zinc-600 font-black uppercase text-[10px] mb-1">
              <Ruler className="w-4 h-4 text-zinc-900" />
              Gantry Height Clearance
            </div>
            <div className="text-base font-black font-mono text-zinc-900">
              {carpark.gantry_height.toFixed(2)} meters
            </div>
            <div className={`text-[11px] font-bold mt-1 ${guidanceColor}`}>
              {vehicleGuidance}
            </div>
          </div>

          {/* Carpark Structure */}
          <div className="p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <div className="flex items-center gap-2 text-zinc-600 font-black uppercase text-[10px] mb-1">
              <Building2 className="w-4 h-4 text-zinc-900" />
              Structure & Decks
            </div>
            <div className="text-base font-black text-zinc-900">
              {carpark.car_park_type}
            </div>
            <div className="text-[11px] font-bold text-zinc-500 mt-1">
              {carpark.car_park_decks} Decks • {carpark.car_park_basement ? 'Sheltered Basement' : 'Sheltered Multi-Storey'}
            </div>
          </div>

          {/* Rates & Central Area Rules */}
          <div className="p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <div className="flex items-center gap-2 text-zinc-600 font-black uppercase text-[10px] mb-1">
              <DollarSign className="w-4 h-4 text-zinc-900" />
              Estimated Parking Rates
            </div>
            <div className="text-sm font-black text-zinc-900">
              {carpark.hourly_rate_estimate}
            </div>
            <div className="text-[11px] font-bold text-zinc-500 mt-1">
              {carpark.central_area ? '⚠️ Central Area HDB Tier ($1.20/30min 7am-5pm)' : 'Standard Outside Central Area Tier'}
            </div>
          </div>

          {/* EV Charging & Free Parking */}
          <div className="p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <div className="flex items-center gap-2 text-zinc-600 font-black uppercase text-[10px] mb-1">
              <Gift className="w-4 h-4 text-zinc-900" />
              Special Perks & EV Charging
            </div>
            <div className="text-xs font-black text-zinc-900 flex items-center gap-2">
              {carpark.has_ev_charging ? (
                <span className="text-zinc-900 font-black flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" /> {carpark.ev_charger_count} EV Chargers
                </span>
              ) : (
                <span className="text-zinc-400">No EV Chargers</span>
              )}
            </div>
            <div className="text-[11px] text-emerald-700 font-black mt-1">
              {carpark.free_parking !== 'NO' ? `Free Parking: ${carpark.free_parking}` : 'No Free Sunday Parking'}
            </div>
          </div>
        </div>

        {/* Direct Navigation Links */}
        <div className="mt-6 pt-4 border-t-2 border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs font-black uppercase text-zinc-500">
            Launch GPS Navigation App:
          </div>

          <div className="flex items-center gap-2">
            <a
              id="link-google-maps"
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all"
            >
              <Navigation className="w-4 h-4" />
              Google Maps
            </a>

            <a
              id="link-waze"
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-black text-xs uppercase tracking-wider border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Waze
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
