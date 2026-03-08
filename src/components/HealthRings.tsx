import { useState } from 'react';
import { ServiceLog } from '@/hooks/useServiceLogs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, differenceInDays } from 'date-fns';
import { getTrackedParts, type VehicleCategory } from '@/lib/vehicleCategories';

interface HealthRingsProps {
  services: ServiceLog[];
  currentOdometer: number;
  category?: VehicleCategory;
}

const CircularRing = ({
  percent, label, color, lastDate, lastPrice, predictedNext, brand, hasData,
}: {
  percent: number; label: string; color: string;
  lastDate: string | null; lastPrice: number | null;
  predictedNext: string | null; brand: string | null; hasData: boolean;
}) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const healthPct = hasData ? Math.max(0, Math.round(100 - percent)) : -1;
  const offset = hasData ? circ - (Math.min(Math.max(0, 100 - percent), 100) / 100) * circ : circ;
  const isCritical = hasData && healthPct < 20;
  const isNotLogged = !hasData;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`flex flex-col items-center gap-2 rounded-xl p-2 transition-colors hover:bg-secondary/50 focus:outline-none ${isCritical ? 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]' : ''}`}>
          <div className="relative h-24 w-24">
            {isCritical && (
              <div className="absolute inset-0 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20" style={{ background: `radial-gradient(circle, hsl(var(--destructive)), transparent 70%)` }} />
            )}
            <svg viewBox="0 0 80 80" className="relative h-full w-full -rotate-90">
              <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
              {!isNotLogged && (
                <circle
                  cx="40" cy="40" r={r} fill="none"
                  stroke={isCritical ? 'hsl(var(--destructive))' : color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  className="transition-all duration-700"
                  style={{ filter: `drop-shadow(0 0 ${isCritical ? '10px' : '6px'} ${isCritical ? 'hsl(var(--destructive))' : color})` }}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isNotLogged ? (
                <span className="font-mono text-[10px] font-medium text-muted-foreground">N/A</span>
              ) : (
                <span className={`font-mono text-lg font-bold ${isCritical ? 'text-destructive' : 'text-foreground'}`}>
                  {healthPct}%
                </span>
              )}
            </div>
          </div>
          <span className={`font-display text-xs font-medium tracking-wider uppercase ${isCritical ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>{label}</span>
          {isNotLogged && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Not Logged
            </span>
          )}
          {isCritical && (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
              ⚠ CRITICAL
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className={`w-64 bg-card border-border ${isCritical ? 'border-destructive/50' : ''}`}>
        <div className="space-y-2">
          {isCritical && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-center">
              <p className="text-xs font-bold text-destructive">🚨 Critical Service Required</p>
              <p className="text-[10px] text-destructive/80">This component has exceeded safe service limits</p>
            </div>
          )}
          <h4 className="font-display text-xs font-bold tracking-wider text-primary uppercase">{label} Details</h4>
          {hasData ? (
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Changed</span>
                <span className="text-foreground">{lastDate ? format(new Date(lastDate), 'MMM d, yyyy') : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Paid</span>
                <span className="text-primary font-bold">{lastPrice != null ? `Rs. ${lastPrice}` : '—'}</span>
              </div>
              {brand && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand</span>
                  <span className="text-foreground">{brand}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Health</span>
                <span className={percent >= 100 ? 'text-destructive font-bold' : percent >= 80 ? 'text-accent font-bold' : 'text-success font-bold'}>
                  {Math.max(0, Math.round(100 - percent))}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Change</span>
                <span className="text-foreground">{predictedNext || '—'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No service data. Log a service with "{label}" in the part name to track.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const HealthRings = ({ services, currentOdometer, category = 'car' }: HealthRingsProps) => {
  const TRACKED_PARTS = getTrackedParts(category);
  // Estimate avg daily km from services
  const allOdos = services
    .filter(s => s.odometer_at_service && s.odometer_at_service > 0)
    .sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime());

  let avgDailyKm = 30; // default ~30km/day
  if (allOdos.length >= 2) {
    const first = allOdos[0];
    const last = allOdos[allOdos.length - 1];
    const days = differenceInDays(new Date(last.service_date), new Date(first.service_date));
    const km = (last.odometer_at_service || 0) - (first.odometer_at_service || 0);
    if (days > 0 && km > 0) avgDailyKm = km / days;
  }

  const parts = TRACKED_PARTS.map(tp => {
    const matching = services
      .filter(s => s.part_name.toLowerCase().includes(tp.key))
      .sort((a, b) => (b.odometer_at_service || 0) - (a.odometer_at_service || 0));

    const latest = matching[0];
    const interval = latest?.replacement_interval_km || tp.defaultInterval;
    const lastOdo = latest?.odometer_at_service || 0;
    const kmSince = currentOdometer - lastOdo;

    // Time-based check
    let timePercent = 0;
    if (latest) {
      const daysSince = differenceInDays(new Date(), new Date(latest.service_date));
      timePercent = (daysSince / tp.timeIntervalDays) * 100;
    }

    const mileagePercent = lastOdo > 0 ? (kmSince / interval) * 100 : 100;
    const usedPercent = Math.max(mileagePercent, timePercent);

    let color = 'hsl(var(--success))';
    if (usedPercent >= 100) color = 'hsl(var(--destructive))';
    else if (usedPercent >= 80) color = 'hsl(var(--accent))';

    // Predict next change date
    let predictedNext: string | null = null;
    if (lastOdo > 0 && avgDailyKm > 0) {
      const kmRemaining = Math.max(0, interval - kmSince);
      const daysRemaining = Math.round(kmRemaining / avgDailyKm);
      predictedNext = format(addDays(new Date(), daysRemaining), 'MMM d, yyyy');
    }

    return {
      ...tp,
      usedPercent,
      color,
      hasData: lastOdo > 0,
      lastDate: latest?.service_date || null,
      lastPrice: latest?.price || null,
      brand: (latest as any)?.brand_used || null,
      predictedNext,
    };
  });

  return (
    <div className="glass-card neon-border p-5">
      <h3 className="mb-4 font-display text-xs font-bold tracking-wider text-primary uppercase">Component Health Scan</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {parts.map(p => (
          <CircularRing
            key={p.key}
            percent={p.usedPercent}
            label={p.label}
            color={p.color}
            lastDate={p.lastDate}
            lastPrice={p.lastPrice}
            predictedNext={p.predictedNext}
            brand={p.brand}
            hasData={p.hasData}
          />
        ))}
      </div>
      <p className="mt-3 text-center font-mono text-xs text-muted-foreground/60">
        Click a ring for details. Health based on mileage & time since last service.
      </p>
    </div>
  );
};

export default HealthRings;
