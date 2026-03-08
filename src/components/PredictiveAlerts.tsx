import { Clock, CalendarDays } from 'lucide-react';
import { ServiceLog } from '@/hooks/useServiceLogs';
import { FuelLog } from '@/hooks/useFuelLogs';
import { differenceInDays, addDays, format } from 'date-fns';

interface PredictiveAlertsProps {
  services: ServiceLog[];
  fuelLogs: FuelLog[];
  currentOdometer: number;
}

const PredictiveAlerts = ({ services, fuelLogs, currentOdometer }: PredictiveAlertsProps) => {
  // Calculate average monthly mileage from fuel logs with odometer readings
  const logsWithOdo = fuelLogs
    .filter(l => l.odometer_at_fill)
    .sort((a, b) => new Date(a.fuel_date).getTime() - new Date(b.fuel_date).getTime());

  let avgKmPerDay = 0;
  if (logsWithOdo.length >= 2) {
    const first = logsWithOdo[0];
    const last = logsWithOdo[logsWithOdo.length - 1];
    const kmDiff = (last.odometer_at_fill || 0) - (first.odometer_at_fill || 0);
    const daysDiff = differenceInDays(new Date(last.fuel_date), new Date(first.fuel_date));
    if (daysDiff > 0 && kmDiff > 0) avgKmPerDay = kmDiff / daysDiff;
  }

  if (avgKmPerDay === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Clock className="h-4 w-4" /> Predictive Service Dates
        </h3>
        <p className="text-xs text-muted-foreground">
          Log 2+ fuel fill-ups with odometer readings to enable predictions.
        </p>
      </div>
    );
  }

  // Find parts with replacement intervals
  const partsWithInterval = services
    .filter(s => s.replacement_interval_km && s.odometer_at_service)
    .reduce((acc, s) => {
      const existing = acc.find(a => a.part_name.toLowerCase() === s.part_name.toLowerCase());
      if (!existing || (s.odometer_at_service || 0) > (existing.odometer_at_service || 0)) {
        const filtered = acc.filter(a => a.part_name.toLowerCase() !== s.part_name.toLowerCase());
        filtered.push(s);
        return filtered;
      }
      return acc;
    }, [] as ServiceLog[]);

  if (partsWithInterval.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Clock className="h-4 w-4" /> Predictive Service Dates
        </h3>
        <p className="text-xs text-muted-foreground">
          Add service logs with replacement intervals to see predictions.
        </p>
      </div>
    );
  }

  const predictions = partsWithInterval.map(s => {
    const nextServiceOdo = (s.odometer_at_service || 0) + (s.replacement_interval_km || 0);
    const kmRemaining = nextServiceOdo - currentOdometer;
    const daysUntil = kmRemaining > 0 ? Math.ceil(kmRemaining / avgKmPerDay) : 0;
    const predictedDate = addDays(new Date(), daysUntil);
    const isOverdue = kmRemaining <= 0;

    return {
      partName: s.part_name,
      kmRemaining: Math.max(0, kmRemaining),
      daysUntil,
      predictedDate,
      isOverdue,
    };
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="glass-card p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Clock className="h-4 w-4" /> Predictive Service Dates
      </h3>
      <p className="mb-4 text-xs text-muted-foreground/60">
        Based on {Math.round(avgKmPerDay * 30)} km/month average
      </p>
      <div className="space-y-3">
        {predictions.map((p, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
            <div>
              <span className="text-sm font-medium text-foreground">{p.partName}</span>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {p.isOverdue
                  ? 'Overdue!'
                  : format(p.predictedDate, 'MMM d, yyyy')}
              </div>
            </div>
            <div className="text-right">
              {p.isOverdue ? (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                  OVERDUE
                </span>
              ) : (
                <>
                  <div className="font-mono text-lg font-bold text-primary">{p.daysUntil}</div>
                  <div className="text-xs text-muted-foreground">days</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PredictiveAlerts;
