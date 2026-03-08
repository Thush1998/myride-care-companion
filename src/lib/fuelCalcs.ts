import { FuelLog } from '@/hooks/useFuelLogs';

type FuelLogWithOdo = FuelLog & { odometer_at_fill: number };

/**
 * Sort logs by odometer ascending and filter to those with odometer readings.
 */
const withOdoSorted = (logs: FuelLog[]): FuelLogWithOdo[] =>
  logs
    .filter((l): l is FuelLogWithOdo => l.odometer_at_fill != null)
    .sort((a, b) => a.odometer_at_fill - b.odometer_at_fill);

/**
 * Calculate trip-based cost/km from fuel entries.
 * Uses distance between consecutive odometer readings, NOT total odometer.
 * @param logs - fuel logs
 * @param lastN - optional: only use last N entries for a rolling average
 * @returns cost per km or null if not enough data
 */
export function calcCostPerKm(logs: FuelLog[], lastN?: number): number | null {
  const sorted = withOdoSorted(logs);
  if (sorted.length < 2) return null;

  // Take last N entries if specified (need N+1 for N intervals)
  const slice = lastN ? sorted.slice(-(lastN + 1)) : sorted;
  if (slice.length < 2) return null;

  let totalCost = 0;
  let totalKm = 0;

  for (let i = 1; i < slice.length; i++) {
    const km = slice[i].odometer_at_fill - slice[i - 1].odometer_at_fill;
    if (km > 0) {
      totalKm += km;
      totalCost += slice[i].total_cost ?? 0;
    }
  }

  return totalKm > 0 ? totalCost / totalKm : null;
}

/**
 * Calculate average fuel consumption in km/L.
 * Uses distance between consecutive odometer readings.
 * @returns km per liter or null if not enough data
 */
export function calcKmPerLiter(logs: FuelLog[]): number | null {
  const sorted = withOdoSorted(logs);
  if (sorted.length < 2) return null;

  let totalKm = 0;
  let totalL = 0;

  for (let i = 1; i < sorted.length; i++) {
    const km = sorted[i].odometer_at_fill - sorted[i - 1].odometer_at_fill;
    if (km > 0) {
      totalKm += km;
      totalL += sorted[i].liters;
    }
  }

  return totalL > 0 ? totalKm / totalL : null;
}

/**
 * Calculate liters per 100km.
 */
export function calcLitersPer100km(logs: FuelLog[]): number | null {
  const kmPerL = calcKmPerLiter(logs);
  return kmPerL && kmPerL > 0 ? 100 / kmPerL : null;
}
