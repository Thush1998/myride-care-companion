import { CalendarClock, ChevronRight } from 'lucide-react';
import { ServiceLog } from '@/hooks/useServiceLogs';
import { differenceInDays, addDays, format } from 'date-fns';
import { FORECAST_TRACKED, type VehicleCategory } from '@/lib/vehicleCategories';

interface MaintenanceForecastProps {
  services: ServiceLog[];
  currentOdometer: number;
  category?: VehicleCategory;
}

const MaintenanceForecast = ({ services, currentOdometer, category = 'car' }: MaintenanceForecastProps) => {
  const TRACKED = FORECAST_TRACKED[category as keyof typeof FORECAST_TRACKED] || FORECAST_TRACKED['car'];
  // Estimate avg daily km
  const allOdos = services
    .filter(s => s.odometer_at_service && s.odometer_at_service > 0)
    .sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime());

  let avgDailyKm = 30;
  if (allOdos.length >= 2) {
    const first = allOdos[0];
    const last = allOdos[allOdos.length - 1];
    const days = differenceInDays(new Date(last.service_date), new Date(first.service_date));
    const km = (last.odometer_at_service || 0) - (first.odometer_at_service || 0);
    if (days > 0 && km > 0) avgDailyKm = km / days;
  }

  const forecasts = TRACKED.map(tp => {
    const matching = services
      .filter(s => s.part_name.toLowerCase().includes(tp.key))
      .sort((a, b) => (b.odometer_at_service || 0) - (a.odometer_at_service || 0));

    const latest = matching[0];
    if (!latest || !latest.odometer_at_service) return null;

    const interval = latest.replacement_interval_km || tp.defaultInterval;
    const nextOdo = (latest.odometer_at_service || 0) + interval;
    const kmRemaining = nextOdo - currentOdometer;
    const daysRemaining = avgDailyKm > 0 ? Math.ceil(Math.max(0, kmRemaining) / avgDailyKm) : 0;
    const isOverdue = kmRemaining <= 0;

    // Time-based check
    const daysSinceService = differenceInDays(new Date(), new Date(latest.service_date));
    const timeDaysRemaining = Math.max(0, tp.timeDays - daysSinceService);
    const effectiveDays = Math.min(daysRemaining, timeDaysRemaining);

    return {
      label: tp.label,
      kmRemaining: Math.max(0, kmRemaining),
      daysRemaining: isOverdue ? 0 : effectiveDays,
      isOverdue,
    };
  }).filter(Boolean) as { label: string; kmRemaining: number; daysRemaining: number; isOverdue: boolean }[];

  // Sort by most urgent
  forecasts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  const top = forecasts.slice(0, 4);

  if (top.length === 0) {
    return (
      <div className="glass-card neon-border p-5">
        <h3 className="mb-3 flex items-center gap-2 font-display text-xs font-bold tracking-wider text-primary uppercase">
          <CalendarClock className="h-4 w-4" /> Maintenance Forecast
        </h3>
        <p className="text-xs text-muted-foreground">Log services with odometer readings to see maintenance countdowns.</p>
      </div>
    );
  }

  return (
    <div className="glass-card neon-border p-5">
      <h3 className="mb-4 flex items-center gap-2 font-display text-xs font-bold tracking-wider text-primary uppercase">
        <CalendarClock className="h-4 w-4" /> Maintenance Forecast
      </h3>
      <div className="space-y-3">
        {top.map((f, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <ChevronRight className={`h-4 w-4 ${f.isOverdue ? 'text-destructive' : 'text-primary'}`} />
              <div>
                <span className="text-sm font-medium text-foreground">{f.label}</span>
                <p className={`text-xs ${f.isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                  {f.isOverdue
                    ? 'Service overdue!'
                    : `${f.kmRemaining.toLocaleString()} km remaining`}
                </p>
              </div>
            </div>
            <div className="text-right">
              {f.isOverdue ? (
                <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">OVERDUE</span>
              ) : (
                <div>
                  <span className="font-mono text-lg font-bold text-primary">{f.daysRemaining}</span>
                  <span className="ml-1 text-xs text-muted-foreground">days</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaintenanceForecast;
