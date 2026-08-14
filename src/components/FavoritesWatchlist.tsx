/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Car, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Trash2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { EnrichedCarpark } from '../types';

interface FavoritesWatchlistProps {
  carparks: EnrichedCarpark[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectCarpark: (carpark: EnrichedCarpark) => void;
  onGoToMap: () => void;
}

export const FavoritesWatchlist: React.FC<FavoritesWatchlistProps> = ({
  carparks,
  favorites,
  onToggleFavorite,
  onSelectCarpark,
  onGoToMap,
}) => {
  const favoriteCarparks = carparks.filter((c) => favorites.includes(c.id));

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Bento Header Banner */}
      <div className="p-6 rounded-3xl bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-300 border-2 border-zinc-900 flex items-center justify-center text-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <BookmarkCheck className="w-6 h-6 text-zinc-900" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-tight">
              My Watchlist Monitor
            </h2>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
              Pinned daily car parks (Home, Office, Malls) with real-time lot vacancy.
            </p>
          </div>
        </div>

        <button
          onClick={onGoToMap}
          className="px-4 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-black uppercase tracking-wider border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
        >
          Add More from Map →
        </button>
      </div>

      {/* Empty State */}
      {favoriteCarparks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          <Bookmark className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-black text-zinc-900 text-lg uppercase">Your Watchlist is Empty</h3>
          <p className="text-xs font-semibold text-zinc-500 mt-1 max-w-md mx-auto">
            Click the bookmark star icon on any car park card or map marker to add it to your quick-access daily monitor.
          </p>
          <button
            id="btn-explore-carparks-map"
            onClick={onGoToMap}
            className="mt-5 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]"
          >
            Explore Singapore Car Parks
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteCarparks.map((cp) => {
            const avail = cp.lots_summary.available_car_lots;
            const total = cp.lots_summary.total_car_lots;
            const occ = cp.lots_summary.occupancy_rate;

            return (
              <div
                key={cp.id}
                id={`watchlist-card-${cp.id.toLowerCase()}`}
                onClick={() => onSelectCarpark(cp)}
                className="p-5 rounded-3xl bg-white border-2 border-zinc-900 hover:bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 text-xs font-mono font-black text-white">
                      {cp.carpark_number}
                    </span>

                    <button
                      id={`btn-remove-fav-${cp.id.toLowerCase()}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(cp.id);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-black text-zinc-900 group-hover:text-zinc-700 transition-colors text-base uppercase tracking-tight line-clamp-1">
                    {cp.name}
                  </h3>
                  <p className="text-xs font-bold text-zinc-500 line-clamp-1 mt-0.5">
                    {cp.address}
                  </p>

                  {/* Big Vacancy Counter Bento Box */}
                  <div className="my-4 p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-900 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">
                      EMPTY LOTS RIGHT NOW
                    </div>
                    <div
                      className={`text-4xl font-black font-mono mt-1 ${
                        avail > 15
                          ? 'text-emerald-600'
                          : avail > 0
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {avail}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono font-bold mt-1">
                      out of {total} lots ({occ}% occupied)
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden border border-zinc-900 mb-3">
                    <div
                      className={`h-2.5 rounded-full ${
                        avail > 15 ? 'bg-emerald-500' : avail > 0 ? 'bg-amber-500' : 'bg-rose-600'
                      }`}
                      style={{ width: `${Math.max(5, 100 - occ)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Bottom Details */}
                <div className="pt-3 border-t-2 border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
                  <span className="font-bold text-[11px]">
                    {cp.car_park_type.includes('MULTI-STOREY') ? '🏢 Sheltered MSCP' : '🚗 Surface'}
                  </span>
                  <span className="text-zinc-900 font-black uppercase text-[11px] group-hover:underline">
                    Inspect →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
