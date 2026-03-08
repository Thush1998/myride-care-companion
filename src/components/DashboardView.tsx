import { Gauge, Wrench, AlertTriangle, TrendingUp, Car } from 'lucide-react';
import { Vehicle } from '@/hooks/useVehicles';
import { useServiceLogs } from '@/hooks/useServiceLogs';
import { useTrips } from '@/hooks/useTrips';
import { useFuelLogs } from '@/hooks/useFuelLogs';
import { useDocuments } from '@/hooks/useDocuments';
import { useUpdateOdometer } from '@/hooks/useVehicles';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';

interface DashboardViewProps {
  vehicle: Vehicle;
}

const DashboardView = ({ vehicle }: DashboardViewProps) => {
  const { data: services } = useServiceLogs(vehicle.id);
  const { data: trips } = useTrips(vehicle.id);
  const { data: fuelLogs } = useFuelLogs(vehicle.id);
  const { data: docs } = useDocuments(vehicle.id);
  const updateOdometer = useUpdateOdometer();
  const [newOdometer, setNewOdometer] = useState('');

  const totalSpent = services?.reduce((sum, s) => sum + (s.price || 0), 0) ?? 0;
  const totalTrips = trips?.length ?? 0;
  const totalDistance = trips?.reduce((sum, t) => sum + t.distance_km, 0) ?? 0;
  const fuelSpent = fuelLogs?.reduce((sum, f) => sum + (f.total_cost || 0), 0) ?? 0;

  // Maintenance warnings
  const warnings = (services || []).filter((s) => {
    if (!s.replacement_interval_km || !s.odometer_at_service) return false;
    const kmSince = vehicle.current_odometer - s.odometer_at_service;
    return kmSince >= s.replacement_interval_km * 0.8;
  });

  // Document expiry warnings
  const expiringDocs = (docs || []).filter(d => {
    if (!d.expiry_date) return false;
    return differenceInDays(new Date(d.expiry_date), new Date()) <= 30;
  });

  const handleOdometerUpdate = async () => {
    const val = parseFloat(newOdometer);
    if (isNaN(val) || val < vehicle.current_odometer) {
      toast.error('Odometer must be greater than current value');
      return;
    }
    await updateOdometer.mutateAsync({ id: vehicle.id, odometer: val });
    toast.success('Odometer updated');
    setNewOdometer('');
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Vehicle Header */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-stretch">
          {/* Vehicle Image */}
          <div className="relative h-40 w-40 shrink-0 bg-secondary/50">
            {vehicle.image_url ? (
              <img src={vehicle.image_url} alt={vehicle.make} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Car className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="flex flex-1 items-center justify-between p-6">
            <div>
              {vehicle.nickname && (
                <p className="mb-1 text-sm font-medium text-primary">{vehicle.nickname}</p>
              )}
              <h2 className="text-2xl font-bold text-foreground">{vehicle.make} {vehicle.model}</h2>
              <p className="text-muted-foreground">{vehicle.year} · {vehicle.plate_no}{vehicle.color ? ` · ${vehicle.color}` : ''}</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-3xl font-bold text-primary">{Number(vehicle.current_odometer).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">km</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Gauge} label="Odometer" value={`${Number(vehicle.current_odometer).toLocaleString()} km`} />
        <StatCard icon={Wrench} label="Total Services" value={String(services?.length ?? 0)} />
        <StatCard icon={TrendingUp} label="Service Spent" value={`$${totalSpent.toLocaleString()}`} />
        <StatCard icon={TrendingUp} label="Fuel Spent" value={`$${fuelSpent.toLocaleString()}`} />
      </div>

      {/* Warnings */}
      {(warnings.length > 0 || expiringDocs.length > 0) && (
        <div className="glass-card border-warning/30 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" />
            Alerts ({warnings.length + expiringDocs.length})
          </h3>
          <div className="space-y-2">
            {warnings.map((w) => {
              const kmSince = vehicle.current_odometer - (w.odometer_at_service || 0);
              const pct = Math.min(100, (kmSince / (w.replacement_interval_km || 1)) * 100);
              return (
                <div key={w.id} className="flex items-center justify-between rounded-lg bg-warning/5 px-4 py-2">
                  <span className="text-sm text-foreground">🔧 {w.part_name}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-destructive' : 'bg-warning'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{kmSince.toLocaleString()} / {(w.replacement_interval_km || 0).toLocaleString()} km</span>
                  </div>
                </div>
              );
            })}
            {expiringDocs.map((d) => {
              const daysLeft = differenceInDays(new Date(d.expiry_date!), new Date());
              return (
                <div key={d.id} className="flex items-center justify-between rounded-lg bg-warning/5 px-4 py-2">
                  <span className="text-sm text-foreground">📄 {d.doc_name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${daysLeft < 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Odometer Update */}
      <div className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Update Odometer</h3>
        <div className="flex gap-3">
          <Input
            type="number"
            value={newOdometer}
            onChange={(e) => setNewOdometer(e.target.value)}
            placeholder={`Current: ${Number(vehicle.current_odometer).toLocaleString()} km`}
            className="bg-input border-border font-mono"
          />
          <Button onClick={handleOdometerUpdate} disabled={updateOdometer.isPending} className="gradient-amber text-primary-foreground font-semibold">
            Update
          </Button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="glass-card flex items-center gap-4 p-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold text-foreground">{value}</div>
    </div>
  </div>
);

export default DashboardView;
