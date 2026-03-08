import { ServiceLog } from '@/hooks/useServiceLogs';

interface HealthRingsProps {
  services: ServiceLog[];
  currentOdometer: number;
}

const TRACKED_PARTS = [
  { key: 'engine oil', label: 'Engine Oil', defaultInterval: 5000 },
  { key: 'brake pad', label: 'Brake Pads', defaultInterval: 40000 },
  { key: 'timing belt', label: 'Timing Belt', defaultInterval: 100000 },
  { key: 'tire', label: 'Tires', defaultInterval: 50000 },
];

const CircularRing = ({ percent, label, color }: { percent: number; label: string; color: string }) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
          <circle
            cx="40" cy="40" r={r} fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-lg font-bold text-foreground">
            {Math.max(0, Math.round(100 - percent))}%
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
};

const HealthRings = ({ services, currentOdometer }: HealthRingsProps) => {
  const parts = TRACKED_PARTS.map(tp => {
    // Find the most recent service log matching this part (case-insensitive)
    const matching = services
      .filter(s => s.part_name.toLowerCase().includes(tp.key))
      .sort((a, b) => (b.odometer_at_service || 0) - (a.odometer_at_service || 0));

    const latest = matching[0];
    const interval = latest?.replacement_interval_km || tp.defaultInterval;
    const lastOdo = latest?.odometer_at_service || 0;
    const kmSince = currentOdometer - lastOdo;
    const usedPercent = lastOdo > 0 ? (kmSince / interval) * 100 : 100;

    let color = 'hsl(var(--success))';
    if (usedPercent >= 100) color = 'hsl(var(--destructive))';
    else if (usedPercent >= 80) color = 'hsl(var(--warning))';

    return { ...tp, usedPercent, color, hasData: lastOdo > 0 };
  });

  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Component Health</h3>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {parts.map(p => (
          <CircularRing key={p.key} percent={p.usedPercent} label={p.label} color={p.color} />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground/60">
        Health based on mileage since last service. Log services with matching part names to track.
      </p>
    </div>
  );
};

export default HealthRings;
