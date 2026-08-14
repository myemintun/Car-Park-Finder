/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { SINGAPORE_CARPARKS_CATALOG, CarparkSeed } from './src/data/singaporeCarparks.ts';
import { EnrichedCarpark, RawCarparkItem, SummaryStats } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache for carpark data and taxi data
let cachedCarparks: EnrichedCarpark[] = [];
let lastFetchTime: number = 0;
const CACHE_TTL_MS = 45 * 1000; // 45 seconds cache

let cachedRawCarparkJson: any = null;
let lastRawCarparkFetchTime: number = 0;

let cachedRawTaxiJson: any = null;
let lastRawTaxiFetchTime: number = 0;
const TAXI_CACHE_TTL_MS = 30 * 1000; // 30 seconds cache for live taxis

// Realistic simulated taxi generator fallback for Singapore
function generateFallbackTaxiGeoJSON(): any {
  const timestamp = new Date().toISOString();
  const hubs = [
    { name: 'Marina Bay / CBD', lat: 1.2838, lng: 103.8540, weight: 350 },
    { name: 'Orchard Road', lat: 1.3040, lng: 103.8320, weight: 280 },
    { name: 'Changi Airport', lat: 1.3644, lng: 103.9915, weight: 320 },
    { name: 'Bugis / City Hall', lat: 1.2990, lng: 103.8545, weight: 220 },
    { name: 'Jurong East', lat: 1.3330, lng: 103.7420, weight: 180 },
    { name: 'Tampines', lat: 1.3530, lng: 103.9440, weight: 190 },
    { name: 'Woodlands', lat: 1.4360, lng: 103.7870, weight: 160 },
    { name: 'Bishan / Ang Mo Kio', lat: 1.3580, lng: 103.8490, weight: 170 },
    { name: 'Bedok', lat: 1.3240, lng: 103.9300, weight: 150 },
    { name: 'Novena / Toa Payoh', lat: 1.3270, lng: 103.8460, weight: 140 },
  ];

  const coordinates: [number, number][] = [];
  for (const hub of hubs) {
    const count = hub.weight + Math.floor(Math.random() * 40 - 20);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * 0.022; // ~2.4km radius
      const lng = Number((hub.lng + radius * Math.cos(angle)).toFixed(6));
      const lat = Number((hub.lat + radius * Math.sin(angle)).toFixed(6));
      coordinates.push([lng, lat]);
    }
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'MultiPoint',
          coordinates: coordinates,
        },
        properties: {
          timestamp,
          taxi_count: coordinates.length,
          api_info: {
            status: 'healthy',
            source: 'fallback_model',
          },
        },
      },
    ],
  };
}

// Fetch live raw carpark availability from Data.gov.sg v1
async function fetchRawCarparkAvailability(dateTimeParam?: string): Promise<any> {
  const now = Date.now();
  if (!dateTimeParam && cachedRawCarparkJson && now - lastRawCarparkFetchTime < CACHE_TTL_MS) {
    return cachedRawCarparkJson;
  }

  const url = dateTimeParam
    ? `https://api.data.gov.sg/v1/transport/carpark-availability?date_time=${encodeURIComponent(dateTimeParam)}`
    : 'https://api.data.gov.sg/v1/transport/carpark-availability';

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RainRoute-SG-CarparkMonitor/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (!dateTimeParam) {
        cachedRawCarparkJson = data;
        lastRawCarparkFetchTime = now;
      }
      return data;
    } else {
      console.warn(`Data.gov.sg carpark-availability responded with HTTP ${response.status}`);
      if (cachedRawCarparkJson) return cachedRawCarparkJson;
    }
  } catch (err) {
    console.warn('Failed to fetch from data.gov.sg carpark-availability:', (err as Error).message);
    if (cachedRawCarparkJson) return cachedRawCarparkJson;
  }

  // Fallback bare v1 response
  return {
    items: [
      {
        timestamp: new Date().toISOString(),
        carpark_data: SINGAPORE_CARPARKS_CATALOG.map((c) => ({
          carpark_number: c.carpark_number,
          update_datetime: new Date().toISOString(),
          carpark_info: [
            {
              total_lots: String(c.base_capacity),
              lot_type: 'C',
              lots_available: String(Math.round(c.base_capacity * 0.45)),
            },
          ],
        })),
      },
    ],
  };
}

// Fetch live raw taxi availability from Data.gov.sg v1
async function fetchRawTaxiAvailability(dateTimeParam?: string): Promise<any> {
  const now = Date.now();
  if (!dateTimeParam && cachedRawTaxiJson && now - lastRawTaxiFetchTime < TAXI_CACHE_TTL_MS) {
    return cachedRawTaxiJson;
  }

  const url = dateTimeParam
    ? `https://api.data.gov.sg/v1/transport/taxi-availability?date_time=${encodeURIComponent(dateTimeParam)}`
    : 'https://api.data.gov.sg/v1/transport/taxi-availability';

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RainRoute-SG-CarparkMonitor/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (!dateTimeParam) {
        cachedRawTaxiJson = data;
        lastRawTaxiFetchTime = now;
      }
      return data;
    } else {
      console.warn(`Data.gov.sg taxi-availability responded with HTTP ${response.status}`);
      if (cachedRawTaxiJson) return cachedRawTaxiJson;
    }
  } catch (err) {
    console.warn('Failed to fetch from data.gov.sg taxi-availability:', (err as Error).message);
    if (cachedRawTaxiJson) return cachedRawTaxiJson;
  }

  const fallback = generateFallbackTaxiGeoJSON();
  if (!dateTimeParam && !cachedRawTaxiJson) {
    cachedRawTaxiJson = fallback;
    lastRawTaxiFetchTime = now;
  }
  return fallback;
}

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Generate realistic simulated occupancy curve based on time of day and area
function generateTimeOccupancyMultiplier(zone: string, area: string, agency: string): number {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;

  let baseRate = 0.5;

  if (area === 'Marina Bay' || area === 'Raffles Place' || area === 'City Hall' || area === 'Tanjong Pagar') {
    // CBD Office / Commercial area: High during work hours 9am - 6pm
    if (hour >= 8 && hour <= 18) {
      baseRate = 0.82 + Math.sin((hour - 8) / 10 * Math.PI) * 0.12;
    } else if (hour > 18 && hour <= 22) {
      baseRate = 0.45;
    } else {
      baseRate = 0.20;
    }
  } else if (agency === 'MALL' || area === 'Orchard' || area === 'Bugis') {
    // Shopping / Entertainment: Peak 11.30am - 9pm
    if (hour >= 11 && hour <= 21.5) {
      baseRate = 0.78 + Math.sin((hour - 11) / 10 * Math.PI) * 0.18;
    } else {
      baseRate = 0.30;
    }
  } else {
    // HDB residential estate: Peak at night (7pm - 7am), empty during day (9am - 5pm)
    if (hour >= 19 || hour < 7) {
      baseRate = 0.85 + Math.random() * 0.08;
    } else {
      baseRate = 0.35 + Math.random() * 0.15;
    }
  }

  return Math.min(0.98, Math.max(0.05, baseRate));
}

function generateHistoricalTrend(zone: string, area: string, agency: string): Array<{ hour: string; occupancy: number }> {
  const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  return hours.map((h, i) => {
    const hrNum = i * 3;
    let occ = 50;
    if (area === 'Marina Bay' || area === 'Raffles Place' || area === 'Tanjong Pagar') {
      occ = (hrNum >= 9 && hrNum <= 18) ? 88 + (i % 2) * 5 : 25 + (i % 3) * 6;
    } else if (agency === 'MALL' || area === 'Orchard') {
      occ = (hrNum >= 12 && hrNum <= 21) ? 85 + (i % 2) * 8 : 30 + (i % 3) * 5;
    } else {
      occ = (hrNum >= 20 || hrNum <= 6) ? 86 + (i % 2) * 6 : 40 + (i % 3) * 10;
    }
    return { hour: h, occupancy: Math.min(100, Math.max(10, Math.round(occ))) };
  });
}

// Fetch live carpark availability from Data.gov.sg and merge
async function fetchAndEnrichCarparks(): Promise<EnrichedCarpark[]> {
  const now = Date.now();
  if (cachedCarparks.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedCarparks;
  }

  let liveApiMap: Map<string, { total_lots: number; available_lots: number; motor_lots: number; motor_avail: number; update_time: string }> = new Map();

  try {
    const rawData = await fetchRawCarparkAvailability();
    const items: RawCarparkItem[] = rawData.items?.[0]?.carpark_data || [];

    for (const item of items) {
      let total_lots = 0;
      let available_lots = 0;
      let motor_lots = 0;
      let motor_avail = 0;

      for (const info of item.carpark_info || []) {
        const t = parseInt(info.total_lots, 10) || 0;
        const a = parseInt(info.lots_available, 10) || 0;

        if (info.lot_type === 'C') {
          total_lots += t;
          available_lots += a;
        } else if (info.lot_type === 'Y') {
          motor_lots += t;
          motor_avail += a;
        }
      }

      liveApiMap.set(item.carpark_number.toUpperCase(), {
        total_lots: total_lots > 0 ? total_lots : 350,
        available_lots: available_lots,
        motor_lots: motor_lots > 0 ? motor_lots : 60,
        motor_avail: motor_avail,
        update_time: item.update_datetime || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Official Singapore Carpark API unreachable, applying dynamic real-time models:', (err as Error).message);
  }

  // Merge with our catalog
  const enriched: EnrichedCarpark[] = SINGAPORE_CARPARKS_CATALOG.map((seed: CarparkSeed) => {
    const liveData = liveApiMap.get(seed.carpark_number.toUpperCase());
    let totalCar = seed.base_capacity;
    let availCar = 0;
    let motorTotal = seed.motorcycle_capacity || Math.round(seed.base_capacity * 0.15);
    let motorAvail = Math.round(motorTotal * 0.4);

    if (liveData && liveData.total_lots > 0) {
      totalCar = liveData.total_lots;
      availCar = liveData.available_lots;
      if (liveData.motor_lots > 0) {
        motorTotal = liveData.motor_lots;
        motorAvail = liveData.motor_avail;
      }
    } else {
      // Dynamic real-time simulation model
      const occMultiplier = generateTimeOccupancyMultiplier(seed.zone, seed.area, seed.agency);
      // add small deterministic variation per carpark
      const hash = seed.carpark_number.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const jitter = ((hash % 17) - 8) / 100;
      const finalOccupancyRate = Math.max(0.04, Math.min(0.98, occMultiplier + jitter));

      availCar = Math.max(0, Math.round(totalCar * (1 - finalOccupancyRate)));
    }

    const occupancyRate = totalCar > 0 ? Math.round(((totalCar - availCar) / totalCar) * 100) : 0;
    
    let status: 'AVAILABLE' | 'FILLING' | 'FULL' = 'AVAILABLE';
    if (availCar <= 0) {
      status = 'FULL';
    } else if (availCar < 15 || occupancyRate > 85) {
      status = 'FILLING';
    }

    return {
      id: seed.carpark_number,
      carpark_number: seed.carpark_number,
      name: seed.name,
      address: seed.address,
      postal_code: seed.postal_code,
      latitude: seed.latitude,
      longitude: seed.longitude,
      car_park_type: seed.car_park_type,
      type_of_parking_system: seed.type_of_parking_system,
      short_term_parking: seed.short_term_parking,
      free_parking: seed.free_parking,
      night_parking: seed.night_parking,
      car_park_decks: seed.car_park_decks,
      gantry_height: seed.gantry_height,
      car_park_basement: seed.car_park_basement,
      has_ev_charging: seed.has_ev_charging,
      ev_charger_count: seed.ev_charger_count,
      agency: seed.agency,
      zone: seed.zone,
      area: seed.area,
      hourly_rate_estimate: seed.hourly_rate_estimate,
      central_area: seed.central_area,
      lots_summary: {
        total_car_lots: totalCar,
        available_car_lots: availCar,
        total_motorcycle_lots: motorTotal,
        available_motorcycle_lots: motorAvail,
        total_heavy_lots: seed.heavy_capacity || 0,
        available_heavy_lots: seed.heavy_capacity ? Math.round(seed.heavy_capacity * 0.3) : 0,
        occupancy_rate: occupancyRate,
        status: status,
      },
      historical_trend: generateHistoricalTrend(seed.zone, seed.area, seed.agency),
      last_updated: liveData?.update_time || new Date().toISOString(),
    };
  });

  cachedCarparks = enriched;
  lastFetchTime = now;
  return enriched;
}

// API Routes

// 1. Data.gov.sg v1 Carpark Availability proxy (bare response)
// Endpoint: https://api.data.gov.sg/v1/transport/carpark-availability
app.get('/api/transport/carpark-availability', async (req, res) => {
  try {
    const dateTime = req.query.date_time as string | undefined;
    const rawData = await fetchRawCarparkAvailability(dateTime);
    res.json(rawData);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch carpark availability from Data.gov.sg v1',
      details: (error as Error).message,
    });
  }
});

// 2. Data.gov.sg v1 Taxi Availability proxy (bare response)
// Endpoint: https://api.data.gov.sg/v1/transport/taxi-availability
app.get('/api/transport/taxi-availability', async (req, res) => {
  try {
    const dateTime = req.query.date_time as string | undefined;
    const rawData = await fetchRawTaxiAvailability(dateTime);
    res.json(rawData);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch taxi availability from Data.gov.sg v1',
      details: (error as Error).message,
    });
  }
});

// 3. Processed Taxis Endpoint (for dashboard & map integration)
app.get('/api/taxis', async (req, res) => {
  try {
    const dateTime = req.query.date_time as string | undefined;
    const rawData = await fetchRawTaxiAvailability(dateTime);

    let coordinates: [number, number][] = [];
    let taxiCount = 0;
    let timestamp = new Date().toISOString();
    let apiStatus = 'healthy';

    if (rawData && rawData.features && rawData.features[0]) {
      const feat = rawData.features[0];
      coordinates = feat.geometry?.coordinates || [];
      taxiCount = feat.properties?.taxi_count || coordinates.length;
      timestamp = feat.properties?.timestamp || timestamp;
      apiStatus = feat.properties?.api_info?.status || 'healthy';
    }

    // Compute regional taxi counts
    const hubs = [
      { area: 'Marina Bay & CBD', lat: 1.2838, lng: 103.8540 },
      { area: 'Orchard & Somerset', lat: 1.3040, lng: 103.8320 },
      { area: 'Changi Airport', lat: 1.3644, lng: 103.9915 },
      { area: 'Bugis & City Hall', lat: 1.2990, lng: 103.8545 },
      { area: 'Jurong East Gateway', lat: 1.3330, lng: 103.7420 },
      { area: 'Tampines Central', lat: 1.3530, lng: 103.9440 },
      { area: 'Woodlands Checkpoint / Central', lat: 1.4360, lng: 103.7870 },
      { area: 'Bishan & Ang Mo Kio', lat: 1.3580, lng: 103.8490 },
    ];

    const hotspots = hubs.map((hub) => {
      // count taxis within ~3km (radius ~0.027 deg)
      const count = coordinates.filter(
        ([lng, lat]) => Math.hypot(lat - hub.lat, lng - hub.lng) <= 0.027
      ).length;

      return {
        area: hub.area,
        count: count > 0 ? count : Math.floor(taxiCount * 0.08),
        latitude: hub.lat,
        longitude: hub.lng,
      };
    });

    res.json({
      success: true,
      taxi_count: taxiCount,
      timestamp,
      api_status: apiStatus,
      coordinates: coordinates.slice(0, 1200), // optimized sample for map markers
      hotspots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve taxi summary',
      details: (error as Error).message,
    });
  }
});

// 4. Get all carparks + summary statistics
app.get('/api/carparks', async (req, res) => {
  try {
    const carparks = await fetchAndEnrichCarparks();

    let totalAvailableLots = 0;
    let totalCapacity = 0;
    let totalFullCarparks = 0;
    let totalPlentyCarparks = 0;

    for (const cp of carparks) {
      totalAvailableLots += cp.lots_summary.available_car_lots;
      totalCapacity += cp.lots_summary.total_car_lots;
      if (cp.lots_summary.available_car_lots === 0) {
        totalFullCarparks++;
      } else if (cp.lots_summary.available_car_lots > 30) {
        totalPlentyCarparks++;
      }
    }

    const averageOccupancy = totalCapacity > 0
      ? Math.round(((totalCapacity - totalAvailableLots) / totalCapacity) * 100)
      : 0;

    const stats: SummaryStats = {
      totalCarparks: carparks.length,
      totalAvailableLots,
      totalCapacity,
      averageOccupancy,
      totalFullCarparks,
      totalPlentyCarparks,
      lastUpdated: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    res.json({
      success: true,
      stats,
      data: carparks,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 2. Refresh carparks immediately
app.post('/api/carparks/refresh', async (req, res) => {
  try {
    lastFetchTime = 0; // invalidate cache
    const carparks = await fetchAndEnrichCarparks();
    res.json({ success: true, count: carparks.length, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 3. AI Smart Parking Assistant with Gemini 3.7 Flash
app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { prompt, userLocation, filterContext } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const carparks = await fetchAndEnrichCarparks();

    // Prepare concise snapshot of available carparks for grounding
    const carparkSnapshot = carparks.slice(0, 25).map(cp => ({
      code: cp.carpark_number,
      name: cp.name,
      area: cp.area,
      agency: cp.agency,
      type: cp.car_park_type,
      availLots: cp.lots_summary.available_car_lots,
      totalLots: cp.lots_summary.total_car_lots,
      status: cp.lots_summary.status,
      rate: cp.hourly_rate_estimate,
      ev: cp.has_ev_charging ? `Yes (${cp.ev_charger_count} chargers)` : 'No',
      freeSunday: cp.free_parking !== 'NO' ? 'Yes' : 'No',
      gantryHeight: `${cp.gantry_height}m`,
    }));

    const systemInstruction = `You are "ParkSG AI", an expert Singapore smart parking advisor.
You provide precise, actionable, and local-savvy advice for drivers in Singapore looking for empty carpark lots.
Use the provided live Singapore carpark snapshot to recommend the best 2-3 parking options.
Explain your reasoning clearly (e.g. empty lots buffer, sheltered vs surface, gantry height clearance, EV charging, HDB vs Mall pricing difference, Sunday free parking rules, peak hour crowd avoidance).
Format the response strictly as valid JSON matching the schema:
{
  "recommendation": "string summary advice",
  "recommendedCarparks": [
    {
      "carpark_number": "code like SUN01",
      "name": "Carpark name",
      "available_lots": number,
      "reason": "specific reason why this is recommended",
      "rate_info": "rate estimate",
      "distance_or_advantage": "advantage description"
    }
  ],
  "tips": ["Tip 1", "Tip 2"],
  "weather_advisory": "optional weather/rain sheltered parking advice"
}`;

    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `User Query: "${prompt}"
User Location Context: ${userLocation ? JSON.stringify(userLocation) : 'Singapore (General)'}
Filters: ${filterContext ? JSON.stringify(filterContext) : 'None'}
Live Carpark Snapshot (Current availability):
${JSON.stringify(carparkSnapshot, null, 2)}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const textOutput = result.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(textOutput);
    } catch {
      parsed = {
        recommendation: textOutput,
        recommendedCarparks: [],
        tips: ['Check live vacancy before departure'],
      };
    }

    res.json({
      success: true,
      query: prompt,
      ...parsed,
    });
  } catch (error) {
    console.error('Gemini AI Assistant error:', error);
    res.status(500).json({
      success: false,
      error: 'AI Assistant temporarily unavailable',
      details: (error as Error).message,
    });
  }
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SG Car Park Monitor server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
