import { Shield, Heart, AlertTriangle, CheckCircle } from 'lucide-react';
import { ServiceLog } from '@/hooks/useServiceLogs';

interface HealthCertificateProps {
  services: ServiceLog[];
  currentOdometer: number;
  vehicleName: string;
}

const SYSTEMS = [
  { key: 'engine', label: 'Engine System', parts: ['engine oil', 'oil filter', 'spark plug', 'timing belt', 'coolant'], icon: '⚙️' },
  { key: 'transmission', label: 'Transmission', parts: ['transmission', 'gearbox', 'clutch', 'differential'], icon: '🔧' },
  { key: 'suspension', label: 'Suspension & Brakes', parts: ['brake pad', 'shock', 'strut', 'spring', 'ball joint', 'tie rod'], icon: '🛞' },
];

const HealthCertificate = ({ services, currentOdometer, vehicleName }: HealthCertificateProps) => {
  const systemHealth = SYSTEMS.map(sys => {
    const related = services.filter(s =>
      sys.parts.some(p => s.part_name.toLowerCase().includes(p))
    );

    if (related.length === 0) return { ...sys, health: null, status: 'unknown' as const };

    const healths = related.map(s => {
      if (!s.replacement_interval_km || !s.odometer_at_service) return 100;
      const used = ((currentOdometer - s.odometer_at_service) / s.replacement_interval_km) * 100;
      return Math.max(0, 100 - used);
    });

    const avg = healths.reduce((a, b) => a + b, 0) / healths.length;
    const status = avg >= 70 ? 'good' as const : avg >= 40 ? 'fair' as const : 'critical' as const;

    return { ...sys, health: Math.round(avg), status };
  });

  const overallHealth = systemHealth.filter(s => s.health !== null);
  const overall = overallHealth.length > 0
    ? Math.round(overallHealth.reduce((a, s) => a + (s.health || 0), 0) / overallHealth.length)
    : null;

  const statusConfig = {
    good: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', icon: CheckCircle },
    fair: { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', icon: AlertTriangle },
    critical: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: AlertTriangle },
    unknown: { color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-muted/30', icon: Heart },
  };

  return (
    <div className="glass-card neon-border overflow-hidden">
      {/* Header */}
      <div className="relative border-b border-border/30 bg-card/50 px-6 py-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="scan-line absolute inset-0" />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-display text-sm font-bold tracking-wider text-primary uppercase">Vehicle Health Certificate</h3>
              <p className="font-mono text-xs text-muted-foreground">{vehicleName} · {currentOdometer.toLocaleString()} km</p>
            </div>
          </div>
          {overall !== null && (
            <div className="text-right">
              <div className={`font-display text-3xl font-bold ${overall >= 70 ? 'text-success' : overall >= 40 ? 'text-accent' : 'text-destructive'}`}>
                {overall}%
              </div>
              <div className="font-mono text-xs text-muted-foreground uppercase">Overall</div>
            </div>
          )}
        </div>
      </div>

      {/* Systems */}
      <div className="divide-y divide-border/20 p-4">
        {systemHealth.map(sys => {
          const cfg = statusConfig[sys.status];
          const Icon = cfg.icon;
          return (
            <div key={sys.key} className="flex items-center gap-4 py-3">
              <span className="text-2xl">{sys.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{sys.label}</span>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                    <span className={`font-mono text-sm font-bold ${cfg.color}`}>
                      {sys.health !== null ? `${sys.health}%` : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      sys.status === 'good' ? 'bg-success' : sys.status === 'fair' ? 'bg-accent' : sys.status === 'critical' ? 'bg-destructive' : 'bg-muted-foreground/30'
                    }`}
                    style={{ width: `${sys.health ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/20 px-6 py-3">
        <p className="font-mono text-xs text-muted-foreground text-center">
          Health calculated from service intervals. Log services with matching part names for accuracy.
        </p>
      </div>
    </div>
  );
};

export default HealthCertificate;
