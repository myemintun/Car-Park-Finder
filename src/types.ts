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

export interface RawTaxiFeatureCollection {
  type: string;
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: [number, number][]; // [longitude, latitude]
    };
    properties: {
      timestamp: string;
      taxi_count: number;
      api_info?: {
        status: string;
      };
    };
  }>;
}

export interface TaxiHotspot {
  area: string;
  count: number;
  latitude: number;
  longitude: number;
}

export interface TaxiSummaryResponse {
  success: boolean;
  taxi_count: number;
  timestamp: string;
  coordinates: [number, number][]; // [longitude, latitude]
  hotspots: TaxiHotspot[];
  api_status: string;
}

export interface OneMapTokenResponse {
  access_token: string;
  token?: string;
  expiry_timestamp?: string;
  source?: string;
  expires_in?: number;
}

export interface OneMapSearchResultItem {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string;
  Y: string;
  LATITUDE: string;
  LONGITUDE: string;
}

export interface OneMapSearchResponse {
  found: number;
  totalNumPages: number;
  pageNum: number;
  results: OneMapSearchResultItem[];
}

export interface OneMapRevGeocodeResponse {
  GeocodeInfo: Array<{
    BUILDING: string;
    BLOCK: string;
    ROAD: string;
    POSTALCODE: string;
    LATITUDE: string;
    LONGITUDE: string;
  }>;
}

export interface OneMapRouteResponse {
  status_message: string;
  route_summary?: {
    start_point: string;
    end_point: string;
    total_time: number;
    total_distance: number;
    route_type?: string;
  };
  route_instructions?: Array<[string, string, number, string, number, string, number]>;
  route_geometry?: string;
  status: number;
}


