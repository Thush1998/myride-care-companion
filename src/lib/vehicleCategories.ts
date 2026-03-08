export type VehicleCategory = 'car' | 'motorcycle' | 'three_wheeler' | 'van';

export const VEHICLE_CATEGORIES: { value: VehicleCategory; label: string; icon: string }[] = [
  { value: 'car', label: 'Car / SUV', icon: '🚗' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'three_wheeler', label: 'Three-Wheeler', icon: '🛺' },
  { value: 'van', label: 'Van', icon: '🚐' },
];

export type TrackedPart = {
  key: string;
  label: string;
  defaultInterval: number;
  timeIntervalDays: number;
};

const ALL_PARTS: Record<string, TrackedPart> = {
  'engine oil': { key: 'engine oil', label: 'Engine Oil', defaultInterval: 5000, timeIntervalDays: 180 },
  'brake pad': { key: 'brake pad', label: 'Brake Pads', defaultInterval: 40000, timeIntervalDays: 730 },
  'timing belt': { key: 'timing belt', label: 'Timing Belt', defaultInterval: 100000, timeIntervalDays: 1825 },
  'gear oil': { key: 'gear oil', label: 'Gear Oil', defaultInterval: 40000, timeIntervalDays: 730 },
  'tire': { key: 'tire', label: 'Tires', defaultInterval: 50000, timeIntervalDays: 1095 },
  'air filter': { key: 'air filter', label: 'Air Filter', defaultInterval: 20000, timeIntervalDays: 365 },
  'coolant': { key: 'coolant', label: 'Coolant', defaultInterval: 40000, timeIntervalDays: 730 },
  'chain': { key: 'chain', label: 'Chain / Sprocket', defaultInterval: 20000, timeIntervalDays: 365 },
  'brake cable': { key: 'brake cable', label: 'Brake Cable', defaultInterval: 30000, timeIntervalDays: 730 },
};

const CATEGORY_PARTS: Record<VehicleCategory, string[]> = {
  car: ['engine oil', 'gear oil', 'coolant', 'tire', 'brake pad', 'air filter'],
  motorcycle: ['engine oil', 'tire', 'chain', 'brake pad'],
  three_wheeler: ['engine oil', 'gear oil', 'tire', 'brake cable'],
  van: ['engine oil', 'gear oil', 'coolant', 'tire', 'brake pad', 'air filter', 'timing belt'],
};

export function getTrackedParts(category: VehicleCategory | string): TrackedPart[] {
  const key = normalizeCategory(category);
  return (CATEGORY_PARTS[key] || CATEGORY_PARTS['car']).map(k => ALL_PARTS[k]);
}

function normalizeCategory(category: string | undefined | null): VehicleCategory {
  if (!category) return 'car';
  const lower = category.toLowerCase();
  if (lower === 'car' || lower === 'suv/car' || lower === 'suv' || lower.includes('car')) return 'car';
  if (lower === 'motorcycle' || lower.includes('bike') || lower.includes('motor')) return 'motorcycle';
  if (lower === 'three_wheeler' || lower.includes('three') || lower.includes('wheeler') || lower.includes('tuk')) return 'three_wheeler';
  if (lower === 'van' || lower.includes('van')) return 'van';
  return 'car';
}

export function getCategoryIcon(category: VehicleCategory | string): string {
  const key = normalizeCategory(category);
  return VEHICLE_CATEGORIES.find(c => c.value === key)?.icon ?? '🚗';
}

export function getCategoryLabel(category: VehicleCategory | string): string {
  const key = normalizeCategory(category);
  return VEHICLE_CATEGORIES.find(c => c.value === key)?.label ?? 'Car / SUV';
}

// Health certificate system mapping per category
export const HEALTH_SYSTEMS: Record<VehicleCategory, { key: string; label: string; parts: string[]; icon: string }[]> = {
  car: [
    { key: 'engine', label: 'Engine System', parts: ['engine oil', 'oil filter', 'spark plug', 'timing belt', 'coolant'], icon: '⚙️' },
    { key: 'transmission', label: 'Transmission', parts: ['transmission', 'gearbox', 'clutch', 'differential', 'gear oil'], icon: '🔧' },
    { key: 'suspension', label: 'Suspension & Brakes', parts: ['brake pad', 'shock', 'strut', 'spring', 'ball joint', 'tie rod'], icon: '🛞' },
  ],
  motorcycle: [
    { key: 'engine', label: 'Engine', parts: ['engine oil', 'spark plug', 'air filter'], icon: '⚙️' },
    { key: 'drivetrain', label: 'Drivetrain', parts: ['chain', 'sprocket', 'clutch'], icon: '🔗' },
    { key: 'brakes', label: 'Brakes & Tires', parts: ['brake pad', 'tire'], icon: '🛞' },
  ],
  three_wheeler: [
    { key: 'engine', label: 'Engine', parts: ['engine oil', 'spark plug'], icon: '⚙️' },
    { key: 'transmission', label: 'Transmission', parts: ['gear oil', 'clutch'], icon: '🔧' },
    { key: 'brakes', label: 'Brakes & Tires', parts: ['brake cable', 'tire'], icon: '🛞' },
  ],
  van: [
    { key: 'engine', label: 'Engine System', parts: ['engine oil', 'oil filter', 'spark plug', 'timing belt', 'coolant'], icon: '⚙️' },
    { key: 'transmission', label: 'Transmission', parts: ['transmission', 'gearbox', 'clutch', 'differential', 'gear oil'], icon: '🔧' },
    { key: 'suspension', label: 'Suspension & Brakes', parts: ['brake pad', 'shock', 'strut', 'spring', 'ball joint', 'tie rod'], icon: '🛞' },
  ],
};

// Maintenance forecast tracked items per category
export const FORECAST_TRACKED: Record<VehicleCategory, { key: string; label: string; defaultInterval: number; timeDays: number }[]> = {
  car: [
    { key: 'engine oil', label: 'Oil Change', defaultInterval: 5000, timeDays: 180 },
    { key: 'brake pad', label: 'Brake Pads', defaultInterval: 40000, timeDays: 730 },
    { key: 'timing belt', label: 'Timing Belt', defaultInterval: 100000, timeDays: 1825 },
    { key: 'air filter', label: 'Air Filter', defaultInterval: 20000, timeDays: 365 },
    { key: 'tire', label: 'Tires', defaultInterval: 50000, timeDays: 1095 },
    { key: 'gear oil', label: 'Gear Oil', defaultInterval: 40000, timeDays: 730 },
  ],
  motorcycle: [
    { key: 'engine oil', label: 'Oil Change', defaultInterval: 3000, timeDays: 180 },
    { key: 'tire', label: 'Tires', defaultInterval: 20000, timeDays: 730 },
    { key: 'chain', label: 'Chain / Sprocket', defaultInterval: 20000, timeDays: 365 },
    { key: 'brake pad', label: 'Brake Pads', defaultInterval: 20000, timeDays: 730 },
  ],
  three_wheeler: [
    { key: 'engine oil', label: 'Oil Change', defaultInterval: 3000, timeDays: 180 },
    { key: 'gear oil', label: 'Gear Oil', defaultInterval: 20000, timeDays: 730 },
    { key: 'tire', label: 'Tires', defaultInterval: 30000, timeDays: 730 },
    { key: 'brake cable', label: 'Brake Cable', defaultInterval: 30000, timeDays: 730 },
  ],
  van: [
    { key: 'engine oil', label: 'Oil Change', defaultInterval: 5000, timeDays: 180 },
    { key: 'brake pad', label: 'Brake Pads', defaultInterval: 40000, timeDays: 730 },
    { key: 'timing belt', label: 'Timing Belt', defaultInterval: 100000, timeDays: 1825 },
    { key: 'air filter', label: 'Air Filter', defaultInterval: 20000, timeDays: 365 },
    { key: 'tire', label: 'Tires', defaultInterval: 50000, timeDays: 1095 },
    { key: 'gear oil', label: 'Gear Oil', defaultInterval: 40000, timeDays: 730 },
  ],
};
