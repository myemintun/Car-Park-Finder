/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LotType = 'C' | 'H' | 'Y'; // C: Cars, H: Heavy Vehicles, Y: Motorcycles

export type CarparkStatus = 'AVAILABLE' | 'FILLING' | 'FULL';

export interface RawCarparkInfo {
  total_lots: string;
  lot_type: string;
  lots_available: string;
}

export interface RawCarparkItem {
  carpark_number: string;
  update_datetime: string;
  carpark_info: RawCarparkInfo[];
}

export interface LotsSummary {
  total_car_lots: number;
  available_car_lots: number;
  total_motorcycle_lots: number;
  available_motorcycle_lots: number;
  total_heavy_lots: number;
  available_heavy_lots: number;
  occupancy_rate: number; // 0 to 100
  status: CarparkStatus;
}

export interface EnrichedCarpark {
  id: string;
  carpark_number: string;
  name: string;
  address: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  x_coord?: number;
  y_coord?: number;
  car_park_type: string;
  type_of_parking_system: string;
  short_term_parking: string;
  free_parking: string;
  night_parking: boolean;
  car_park_decks: number;
  gantry_height: number; // in meters (e.g. 2.15)
  car_park_basement: boolean;
  has_ev_charging?: boolean;
  ev_charger_count?: number;
  agency: 'HDB' | 'URA' | 'LTA' | 'MALL' | 'COMMERCIAL';
  zone: 'Central' | 'East' | 'West' | 'North' | 'North-East';
  area: string;
  hourly_rate_estimate: string;
  central_area: boolean;
  lots_summary: LotsSummary;
  historical_trend: Array<{ hour: string; occupancy: number }>;
  last_updated: string;
  distance_km?: number;
}

export interface FilterState {
  searchQuery: string;
  agency: string; // 'ALL' | 'HDB' | 'URA' | 'MALL'
  carparkType: string; // 'ALL' | 'MSCP' | 'BASEMENT' | 'SURFACE'
  vehicleType: 'C' | 'Y' | 'H';
  freeParking: boolean;
  nightParking: boolean;
  evCharging: boolean;
  highGantryOnly: boolean; // >= 2.1m
  statusFilter: 'ALL' | 'AVAILABLE_ONLY' | 'PLENTY_ONLY';
  areaFilter: string;
  sortBy: 'EMPTY_LOTS_DESC' | 'OCCUPANCY_ASC' | 'NEAREST' | 'NAME_ASC' | 'RATE_ASC';
}

export interface SummaryStats {
  totalCarparks: number;
  totalAvailableLots: number;
  totalCapacity: number;
  averageOccupancy: number;
  totalFullCarparks: number;
  totalPlentyCarparks: number;
  lastUpdated: string;
}

export interface AIQueryResponse {
  query: string;
  recommendation: string;
  recommendedCarparks: Array<{
    carpark_number: string;
    name: string;
    available_lots: number;
    reason: string;
    rate_info: string;
    distance_or_advantage: string;
  }>;
  tips: string[];
  weather_advisory?: string;
}
