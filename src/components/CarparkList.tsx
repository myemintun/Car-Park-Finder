/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Car, 
  Zap, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  ShieldCheck, 
  Moon, 
  Gift, 
  Ruler, 
  Building2, 
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { EnrichedCarpark, FilterState } from '../types';

interface CarparkListProps {
  carparks: EnrichedCarpark[];
  selectedCarpark: EnrichedCarpark | null;
  onSelectCarpark: (carpark: EnrichedCarpark) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  hasUserLocation: boolean;
}

const SG_AREAS_FILTER = [
  'ALL',
  'Marina Bay',
  'Orchard',
  'Bugis',
  'Tanjong Pagar',
  'Chinatown',
  'City Hall',
  'Jurong East',
  'Jurong West',
  'Clementi',
  'Tampines',
  'Bedok',
  'Pasir Ris',
  'Changi',
  'Bishan',
  'Ang Mo Kio',
  'Toa Payoh',
  'Serangoon',
  'Punggol',
  'Sengkang',
  'Woodlands',
  'Yishun',
  'Queenstown',
];

export const CarparkList: React.FC<CarparkListProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  favorites,
  onToggleFavorite,
  filters,
  setFilters,
  hasUserLocation,
}) => {
  // Filter and Sort Logic
  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Search text
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchCode = cp.carpark_number.toLowerCase().includes(q);
          const matchName = cp.name.toLowerCase().includes(q);
          const matchAddress = cp.address.toLowerCase().includes(q);
          const matchArea = cp.area.toLowerCase().includes(q);
          const matchPostal = cp.postal_code?.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchAddress && !matchArea && !matchPostal) {
            return false;
          }
        }

        // Area filter
        if (filters.areaFilter !== 'ALL' && cp.area !== filters.areaFilter) {
          return false;
        }

        // Agency filter
        if (filters.agency !== 'ALL' && cp.agency !== filters.agency) {
          return false;
        }

        // Carpark type filter
        if (filters.carparkType !== 'ALL') {
          if (filters.carparkType === 'MSCP' && !cp.car_park_type.includes('MULTI-STOREY')) return false;
          if (filters.carparkType === 'BASEMENT' && !cp.car_park_type.includes('BASEMENT')) return false;
          if (filters.carparkType === 'SURFACE' && !cp.car_park_type.includes('SURFACE')) return false;
        }

        // Toggles
        if (filters.evCharging && !cp.has_ev_charging) return false;
        if (filters.freeParking && cp.free_parking === 'NO') return false;
        if (filters.nightParking && !cp.night_parking) return false;
        if (filters.highGantryOnly && cp.gantry_height < 2.1) return false;

        // Status
        if (filters.statusFilter === 'AVAILABLE_ONLY' && cp.lots_summary.available_car_lots === 0) {
          return false;
        }
        if (filters.statusFilter === 'PLENTY_ONLY' && cp.lots_summary.available_car_lots < 20) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'EMPTY_LOTS_DESC') {
          return b.lots_summary.available_car_lots - a.lots_summary.available_car_lots;
        }
        if (filters.sortBy === 'OCCUPANCY_ASC') {
          return a.lots_summary.occupancy_rate - b.lots_summary.occupancy_rate;
        }
        if (filters.sortBy === 'NEAREST') {
          return (a.distance_km ?? 999) - (b.distance_km ?? 999);
        }
        if (filters.sortBy === 'RATE_ASC') {
          const rateA = a.central_area ? 1.2 : a.agency === 'HDB' ? 0.6 : 2.5;
          const rateB = b.central_area ? 1.2 : b.agency === 'HDB' ? 0.6 : 2.5;
          return rateA - rateB;
        }
        return a.name.localeCompare(b.name);
      });
  }, [carparks, filters]);

  return (
    <div className="flex flex-col gap-5">
      {/* Search & Filter Bento Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
        
        {/* Top Search Bar & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="input-search-carparks"
              type="text"
              placeholder="Search code (ACB, SUN01), mall, street name, or town..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-11 pr-16 py-3 rounded-2xl bg-zinc-50 border-2 border-zinc-900 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
            />
            {filters.searchQuery && (
              <button
                id="btn-clear-search"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-zinc-700 hover:text-zinc-950 px-2 py-1 rounded-lg bg-zinc-200 border border-zinc-400"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-zinc-800 shrink-0" />
            <select
              id="select-sort-carparks"
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as FilterState['sortBy'],
                }))
              }
              className="w-full sm:w-auto py-3 px-3.5 rounded-2xl bg-zinc-50 border-2 border-zinc-900 text-xs font-black text-zinc-900 focus:outline-none shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] cursor-pointer"
            >
              <option value="EMPTY_LOTS_DESC">Most Empty Lots First</option>
              <option value="OCCUPANCY_ASC">Lowest Occupancy %</option>
              {hasUserLocation && <option value="NEAREST">Nearest to Me (GPS)</option>}
              <option value="RATE_ASC">Cheapest Rate First</option>
              <option value="NAME_ASC">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="mt-4 pt-4 border-t-2 border-zinc-100 flex flex-wrap items-center gap-2 text-xs">
          {/* Area Filter Dropdown */}
          <select
            id="select-filter-area"
            value={filters.areaFilter}
            onChange={(e) => setFilters((prev) => ({ ...prev, areaFilter: e.target.value }))}
            className="py-2 px-3 rounded-xl bg-zinc-100 border-2 border-zinc-900 text-xs text-zinc-900 font-bold focus:outline-none shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
          >
            <option value="ALL">All Areas (Singapore)</option>
            {SG_AREAS_FILTER.filter((a) => a !== 'ALL').map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>

          {/* Agency Filter Chips */}
          {(['ALL', 'HDB', 'MALL', 'URA', 'COMMERCIAL'] as const).map((ag) => (
            <button
              key={ag}
              id={`filter-agency-${ag.toLowerCase()}`}
              onClick={() => setFilters((prev) => ({ ...prev, agency: ag }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 border-zinc-900 ${
                filters.agency === ag
                  ? 'bg-zinc-900 text-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                  : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-200 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]'
              }`}
            >
              {ag === 'ALL' ? 'All Types' : ag}
            </button>
          ))}

          {/* Special Feature Toggles */}
          <button
            id="filter-ev-toggle"
            onClick={() => setFilters((prev) => ({ ...prev, evCharging: !prev.evCharging }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 border-zinc-900 ${
              filters.evCharging
                ? 'bg-amber-300 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-200 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            EV Charging
          </button>

          <button
            id="filter-free-sunday-toggle"
            onClick={() => setFilters((prev) => ({ ...prev, freeParking: !prev.freeParking }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 border-zinc-900 ${
              filters.freeParking
                ? 'bg-emerald-400 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-200 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-emerald-700" />
            Free Sun/PH
          </button>

          <button
            id="filter-high-gantry-toggle"
            onClick={() => setFilters((prev) => ({ ...prev, highGantryOnly: !prev.highGantryOnly }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 border-zinc-900 ${
              filters.highGantryOnly
                ? 'bg-zinc-900 text-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-200 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            Clearance ≥2.1m
          </button>

          <button
            id="filter-status-available-toggle"
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                statusFilter: prev.statusFilter === 'PLENTY_ONLY' ? 'ALL' : 'PLENTY_ONLY',
              }))
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 border-zinc-900 ${
              filters.statusFilter === 'PLENTY_ONLY'
                ? 'bg-emerald-400 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-200 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
            Lots &gt;20
          </button>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
        <div>
          Showing <span className="font-black text-zinc-900 font-mono text-sm">{filteredCarparks.length}</span> car parks
        </div>
        {filteredCarparks.length > 0 && (
          <div className="text-emerald-700 font-mono font-black text-sm">
            {filteredCarparks.reduce((acc, c) => acc + c.lots_summary.available_car_lots, 0).toLocaleString()} empty lots matching
          </div>
        )}
      </div>

      {/* Carpark Cards Bento Grid */}
      {filteredCarparks.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="font-black text-zinc-900 text-base uppercase">No Car Parks Found</h3>
          <p className="text-xs font-semibold text-zinc-500 mt-1 max-w-sm mx-auto">
            No car parks match your active search or filter criteria. Try resetting filters.
          </p>
          <button
            id="btn-reset-filters"
            onClick={() =>
              setFilters({
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
              })
            }
            className="mt-4 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCarparks.map((cp) => {
            const avail = cp.lots_summary.available_car_lots;
            const total = cp.lots_summary.total_car_lots;
            const occ = cp.lots_summary.occupancy_rate;
            const isFav = favorites.includes(cp.id);
            const isSelected = selectedCarpark?.id === cp.id;

            return (
              <div
                key={cp.id}
                id={`card-carpark-${cp.carpark_number.toLowerCase()}`}
                onClick={() => onSelectCarpark(cp)}
                className={`group relative p-5 rounded-3xl border-2 border-zinc-900 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] ring-2 ring-zinc-900'
                    : 'bg-white hover:bg-zinc-50/80 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] hover:-translate-y-0.5'
                }`}
              >
                {/* Top Row: Code, Agency Badge, Distance, Favorite */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 text-xs font-mono font-black text-white">
                      {cp.carpark_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-[11px] font-black text-zinc-700 border border-zinc-300">
                      {cp.agency}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-[11px] font-bold text-zinc-500">
                      {cp.area}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {cp.distance_km !== undefined && (
                      <span className="text-[11px] font-mono text-zinc-900 font-black flex items-center gap-0.5 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-300">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {cp.distance_km} km
                      </span>
                    )}
                    <button
                      id={`btn-fav-${cp.id.toLowerCase()}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(cp.id);
                      }}
                      className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-amber-500 border border-zinc-200 transition-colors"
                      title={isFav ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      {isFav ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Carpark Name & Address */}
                <h3 className="font-black text-base text-zinc-900 group-hover:text-zinc-700 transition-colors line-clamp-1 uppercase tracking-tight">
                  {cp.name}
                </h3>
                <p className="text-xs font-bold text-zinc-500 line-clamp-1 mt-0.5">
                  {cp.address}
                </p>

                {/* Lot Vacancy Gauge Box */}
                <div className="my-3.5 p-3.5 rounded-2xl bg-zinc-50 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">AVAILABLE LOTS</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span
                          className={`text-2xl font-black font-mono ${
                            avail > 15
                              ? 'text-emerald-600'
                              : avail > 0
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {avail}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono font-bold">/ {total} lots</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          avail > 15
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : avail > 0
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {avail > 15 ? 'Available' : avail > 0 ? 'Filling Fast' : 'FULL'}
                      </span>
                      <div className="text-[11px] text-zinc-500 font-mono font-bold mt-1">
                        {occ}% Occupied
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden border border-zinc-900">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        avail > 15
                          ? 'bg-emerald-500'
                          : avail > 0
                          ? 'bg-amber-500'
                          : 'bg-rose-600'
                      }`}
                      style={{ width: `${Math.max(4, 100 - occ)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Badges: Type, Gantry Clearance, EV, Rate */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-300 font-bold">
                    {cp.car_park_type === 'MULTI-STOREY CAR PARK'
                      ? '🏢 Multi-Storey'
                      : cp.car_park_type === 'BASEMENT CAR PARK'
                      ? '🅿️ Basement'
                      : '🚗 Surface'}
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-300 font-bold">
                    Clearance: {cp.gantry_height}m
                  </span>

                  {cp.has_ev_charging && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-zinc-900 border border-amber-300 font-black flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                      EV ({cp.ev_charger_count})
                    </span>
                  )}

                  {cp.free_parking !== 'NO' && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-black">
                      Free Sun/PH
                    </span>
                  )}
                </div>

                {/* Bottom Rate & Navigation Row */}
                <div className="mt-3.5 pt-3 border-t-2 border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
                  <div className="truncate max-w-[200px]" title={cp.hourly_rate_estimate}>
                    Rate: <span className="text-zinc-900 font-bold">{cp.hourly_rate_estimate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-zinc-900 font-black uppercase text-[11px] group-hover:underline flex items-center gap-1">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
