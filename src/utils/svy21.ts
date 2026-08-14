/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SVY21 Coordinate Transformation Utility (Singapore Datum to WGS84)
 * Based on Singapore Land Authority (SLA) standard parameters.
 */

// SVY21 Projection Parameters
const a = 6378137.0; // Semi-major axis of reference ellipsoid
const f = 1 / 298.257223563; // Flattening
const oLat = 1.366666; // Origin latitude (degrees)
const oLon = 103.833333; // Origin longitude (degrees)
const oN = 38744.572; // False Northing
const oE = 28001.642; // False Easting
const k = 1.0; // Central meridian scale factor

const b = a * (1 - f);
const e2 = (2 * f) - (f * f);
const e4 = e2 * e2;
const e6 = e4 * e2;
const A0 = 1 - (e2 / 4) - (3 * e4 / 64) - (5 * e6 / 256);
const A2 = (3 / 8) * (e2 + (e4 / 4) + (15 * e6 / 128));
const A4 = (15 / 256) * (e4 + (3 * e6 / 4));
const A6 = 35 * e6 / 3072;

function calcM(latRad: number): number {
  return a * ((A0 * latRad) - (A2 * Math.sin(2 * latRad)) + (A4 * Math.sin(4 * latRad)) - (A6 * Math.sin(6 * latRad)));
}

/**
 * Converts SVY21 coordinates (x = Easting, y = Northing) to WGS84 (latitude, longitude)
 */
export function svy21ToWgs84(easting: number, northing: number): { latitude: number; longitude: number } {
  const oLatRad = (oLat * Math.PI) / 180;
  const oLonRad = (oLon * Math.PI) / 180;
  const Nprime = northing - oN;
  const Mo = calcM(oLatRad);
  const Mprime = Mo + (Nprime / k);
  const n = (a - b) / (a + b);
  const G = a * (1 - n) * (1 - n * n) * (1 + (9 / 4) * n * n + (225 / 64) * Math.pow(n, 4)) * (Math.PI / 180);
  const sigma = (Mprime * Math.PI) / (180 * G);

  const latPrimeRad = sigma + ((3 * n / 2) - (27 * Math.pow(n, 3) / 32)) * Math.sin(2 * sigma)
    + ((21 * n * n / 16) - (55 * Math.pow(n, 4) / 32)) * Math.sin(4 * sigma)
    + (151 * Math.pow(n, 3) / 96) * Math.sin(6 * sigma)
    + (1097 * Math.pow(n, 4) / 512) * Math.sin(8 * sigma);

  const sinLatPoint = Math.sin(latPrimeRad);
  const cosLatPoint = Math.cos(latPrimeRad);
  const tanLatPoint = Math.tan(latPrimeRad);

  const v = a / Math.sqrt(1 - (e2 * sinLatPoint * sinLatPoint));
  const rho = (a * (1 - e2)) / Math.pow(1 - (e2 * sinLatPoint * sinLatPoint), 1.5);
  const psi = v / rho;
  const t = tanLatPoint;
  const Eprime = easting - oE;
  const x = Eprime / (k * v);

  const Term1 = (t / (k * rho)) * ((Eprime * x) / 2);
  const Term2 = (t / (k * rho)) * ((Eprime * Math.pow(x, 3)) / 24) * ((-4 * psi * psi) + (9 * psi * (1 - t * t)) + (12 * t * t));
  const Term3 = (t / (k * rho)) * ((Eprime * Math.pow(x, 5)) / 720) * ((8 * Math.pow(psi, 4) * (11 - 24 * t * t)) - (12 * Math.pow(psi, 3) * (21 - 71 * t * t)) + (15 * psi * psi * (15 - 98 * t * t + 15 * Math.pow(t, 4))) + (180 * psi * (5 * t * t - 3 * Math.pow(t, 4))) + 360 * Math.pow(t, 4));
  const Term4 = (t / (k * rho)) * ((Eprime * Math.pow(x, 7)) / 40320) * (1385 - 3633 * t * t + 4095 * Math.pow(t, 4) + 1575 * Math.pow(t, 6));

  const latRad = latPrimeRad - Term1 + Term2 - Term3 + Term4;
  const lat = (latRad * 180) / Math.PI;

  const SecLatPoint = 1 / cosLatPoint;
  const LTerm1 = x * SecLatPoint;
  const LTerm2 = (Math.pow(x, 3) / 6) * SecLatPoint * (psi + 2 * t * t);
  const LTerm3 = (Math.pow(x, 5) / 120) * SecLatPoint * ((-4 * Math.pow(psi, 3) * (1 - 6 * t * t)) + (psi * psi * (9 - 68 * t * t)) + 72 * psi * t * t + 24 * Math.pow(t, 4));
  const LTerm4 = (Math.pow(x, 7) / 5040) * SecLatPoint * (61 + 662 * t * t + 1320 * Math.pow(t, 4) + 720 * Math.pow(t, 6));

  const lonRad = oLonRad + LTerm1 - LTerm2 + LTerm3 - LTerm4;
  const lon = (lonRad * 180) / Math.PI;

  return { latitude: lat, longitude: lon };
}

/**
 * Calculates Haversine distance in km between two lat/lng pairs
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
