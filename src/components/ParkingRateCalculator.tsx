/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Car, 
  Clock, 
  DollarSign, 
  Info, 
  CheckCircle2, 
  Gift, 
  Moon, 
  Building2 
} from 'lucide-react';

export const ParkingRateCalculator: React.FC = () => {
  const [tier, setTier] = useState<'NON_CENTRAL_HDB' | 'CENTRAL_HDB' | 'ORCHARD_MALL' | 'CBD_COMMERCIAL'>('NON_CENTRAL_HDB');
  const [dayType, setDayType] = useState<'WEEKDAY' | 'SATURDAY' | 'SUNDAY_PH'>('WEEKDAY');
  const [startTime, setStartTime] = useState<string>('12:00');
  const [durationHours, setDurationHours] = useState<number>(2.5);

  // Calculation Logic
  const calculation = useMemo(() => {
    const [startHourStr, startMinStr] = startTime.split(':');
    const startHour = parseInt(startHourStr, 10) + parseInt(startMinStr, 10) / 60;
    const endHour = (startHour + durationHours) % 24;

    let totalCost = 0;
    let isFreeSunday = false;
    let nightCapApplied = false;

    if (tier === 'NON_CENTRAL_HDB') {
      if (dayType === 'SUNDAY_PH' && startHour >= 7 && startHour + durationHours <= 22.5) {
        isFreeSunday = true;
        totalCost = 0;
      } else {
        // $0.60 per half hour ($1.20 per hour)
        const halfHours = Math.ceil(durationHours * 2);
        totalCost = halfHours * 0.60;
        // Night cap: 10.30pm to 7.00am max $5.00
        if (durationHours >= 5 && (startHour >= 22.5 || startHour <= 6)) {
          totalCost = Math.min(totalCost, 5.00);
          nightCapApplied = true;
        }
      }
    } else if (tier === 'CENTRAL_HDB') {
      if (dayType === 'SUNDAY_PH' && startHour >= 7 && startHour + durationHours <= 22.5) {
        totalCost = Math.ceil(durationHours * 2) * 0.60;
      } else {
        // 7am to 5pm: $1.20 per 30 min ($2.40/hr); outside 7am-5pm: $0.60 per 30 min
        let currentH = startHour;
        let remaining = durationHours;
        while (remaining > 0) {
          const chunk = Math.min(remaining, 0.5);
          const hOfDay = currentH % 24;
          if (hOfDay >= 7 && hOfDay < 17 && dayType !== 'SUNDAY_PH') {
            totalCost += 1.20;
          } else {
            totalCost += 0.60;
          }
          currentH += 0.5;
          remaining -= 0.5;
        }
      }
    } else if (tier === 'ORCHARD_MALL') {
      if (durationHours <= 1) {
        totalCost = 3.20;
      } else {
        const extraHalfHours = Math.ceil((durationHours - 1) * 2);
        totalCost = 3.20 + extraHalfHours * 1.60;
      }
    } else if (tier === 'CBD_COMMERCIAL') {
      if (durationHours <= 1) {
        totalCost = 3.80;
      } else {
        const extraHalfHours = Math.ceil((durationHours - 1) * 2);
        totalCost = 3.80 + extraHalfHours * 1.90;
      }
    }

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      isFreeSunday,
      nightCapApplied,
      startFormatted: startTime,
      durationText: `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}m`,
    };
  }, [tier, dayType, startTime, durationHours]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Bento Header */}
      <div className="p-6 rounded-3xl bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border-2 border-zinc-900 flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-tight">
            Singapore Parking Rate Estimator
          </h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
            Tariff calculator across HDB (Central vs Non-Central) and Commercial Malls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Parameters Bento Card (Left 2 cols) */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col gap-5">
          
          {/* Location Category */}
          <div>
            <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-2.5">
              1. Select Car Park Type & Location
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'NON_CENTRAL_HDB', title: 'HDB (Outside Central)', desc: '$0.60 / 30 mins ($1.20/hr)' },
                { id: 'CENTRAL_HDB', title: 'HDB (Central Area / CBD)', desc: '$1.20 / 30 mins peak (7am-5pm)' },
                { id: 'ORCHARD_MALL', title: 'Orchard Shopping Mall', desc: '~$3.20 1st hr, $1.60/30min' },
                { id: 'CBD_COMMERCIAL', title: 'CBD Commercial Tower', desc: '~$3.80 1st hr, $1.90/30min' },
              ].map((item) => (
                <button
                  key={item.id}
                  id={`btn-calc-tier-${item.id.toLowerCase()}`}
                  onClick={() => setTier(item.id as typeof tier)}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all ${
                    tier === item.id
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]'
                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-900 text-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                  }`}
                >
                  <div className="font-black text-xs uppercase tracking-tight">{item.title}</div>
                  <div className={`text-[11px] font-semibold mt-0.5 ${tier === item.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-2.5">
              2. Day of Week
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'WEEKDAY', label: 'Weekday' },
                { id: 'SATURDAY', label: 'Saturday' },
                { id: 'SUNDAY_PH', label: 'Sunday / PH' },
              ].map((day) => (
                <button
                  key={day.id}
                  id={`btn-calc-day-${day.id.toLowerCase()}`}
                  onClick={() => setDayType(day.id as typeof dayType)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider border-2 transition-all text-center ${
                    dayType === day.id
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]'
                      : 'bg-zinc-50 text-zinc-900 border-zinc-900 hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entry Time & Duration Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-black text-zinc-900 uppercase tracking-wider mb-2">
                3. Entry Time
              </label>
              <input
                id="input-calc-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full py-2.5 px-3 rounded-2xl bg-zinc-50 border-2 border-zinc-900 text-sm font-mono font-black text-zinc-900 focus:outline-none shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                  4. Duration: <span className="text-zinc-900 font-mono font-black bg-amber-300 px-2 py-0.5 rounded-lg border border-zinc-900">{calculation.durationText}</span>
                </label>
              </div>
              <input
                id="range-calc-duration"
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                className="w-full h-3 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 border border-zinc-900"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono font-bold">
                <span>30m</span>
                <span>2h</span>
                <span>5h</span>
                <span>10h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Output Bill Bento Card (Right 1 col) */}
        <div className="p-6 rounded-3xl bg-zinc-900 text-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between relative overflow-hidden">
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>

          <div className="relative z-10">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
              ESTIMATED TOTAL FEE
            </div>
            
            <div className="text-5xl font-black font-mono text-emerald-400 my-3">
              ${calculation.totalCost.toFixed(2)}
            </div>

            <div className="text-xs text-zinc-400 space-y-2 mt-4 pt-4 border-t-2 border-zinc-800">
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-mono text-white font-bold">{calculation.durationText}</span>
              </div>
              <div className="flex justify-between">
                <span>Entry:</span>
                <span className="font-mono text-white font-bold">{startTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate Basis:</span>
                <span className="text-white text-[11px] text-right font-bold">
                  {tier === 'NON_CENTRAL_HDB' ? 'HDB Standard ($0.60/30m)' : tier === 'CENTRAL_HDB' ? 'HDB Central ($1.20/30m)' : 'Commercial Mall'}
                </span>
              </div>
            </div>

            {calculation.isFreeSunday && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Free Sunday & PH Parking applies! (7:00am - 10:30pm)</span>
              </div>
            )}

            {calculation.nightCapApplied && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-400/20 border-2 border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-2">
                <Moon className="w-4 h-4 text-amber-400 shrink-0" />
                <span>$5.00 Maximum Night Parking Cap applied.</span>
              </div>
            )}
          </div>

          <div className="relative z-10 mt-6 pt-4 border-t-2 border-zinc-800 text-[10px] font-bold text-zinc-500 leading-relaxed uppercase">
            * Tariffs calculated using HDB & URA Singapore official Electronic Parking System guidelines.
          </div>
        </div>
      </div>
    </div>
  );
};
