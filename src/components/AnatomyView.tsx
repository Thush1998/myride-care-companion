import { useState } from 'react';
import { Zap, Plus, Pencil, Trash2 } from 'lucide-react';
import { ServiceLog, useAddServiceLog, useUpdateServiceLog, useDeleteServiceLog } from '@/hooks/useServiceLogs';
import { Vehicle } from '@/hooks/useVehicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AnatomyViewProps {
  vehicle: Vehicle;
  services: ServiceLog[];
}

const MAJOR_PARTS = [
  { key: 'alternator', label: 'Alternator', lifeKm: 150000 },
  { key: 'battery', label: 'Battery', lifeKm: 60000 },
  { key: 'turbo', label: 'Turbocharger', lifeKm: 200000 },
  { key: 'water pump', label: 'Water Pump', lifeKm: 100000 },
  { key: 'starter', label: 'Starter Motor', lifeKm: 120000 },
  { key: 'radiator', label: 'Radiator', lifeKm: 150000 },
  { key: 'compressor', label: 'A/C Compressor', lifeKm: 120000 },
  { key: 'fuel pump', label: 'Fuel Pump', lifeKm: 160000 },
  { key: 'catalytic', label: 'Catalytic Converter', lifeKm: 160000 },
  { key: 'exhaust', label: 'Exhaust System', lifeKm: 100000 },
];

const AnatomyView = ({ vehicle, services }: AnatomyViewProps) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editPart, setEditPart] = useState<ServiceLog | null>(null);
  const addService = useAddServiceLog();
  const updateService = useUpdateServiceLog();
  const deleteService = useDeleteServiceLog();

  const [form, setForm] = useState({
    part_name: '', service_date: new Date().toISOString().split('T')[0],
    odometer_at_service: '', replacement_interval_km: '',
  });

  const parts = MAJOR_PARTS.map(mp => {
    const matching = services
      .filter(s => s.part_name.toLowerCase().includes(mp.key))
      .sort((a, b) => (b.odometer_at_service || 0) - (a.odometer_at_service || 0));

    const latest = matching[0];
    const interval = latest?.replacement_interval_km || mp.lifeKm;
    const lastOdo = latest?.odometer_at_service || 0;
    const kmSince = vehicle.current_odometer - lastOdo;
    const hasData = lastOdo > 0;
    const lifeUsed = hasData ? Math.min(100, (kmSince / interval) * 100) : 0;
    const lifeRemaining = hasData ? Math.max(0, 100 - lifeUsed) : -1;

    return { ...mp, latest, lifeUsed, lifeRemaining, kmSince, interval, hasData };
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addService.mutateAsync({
        vehicle_id: vehicle.id,
        part_name: form.part_name,
        service_date: form.service_date,
        odometer_at_service: parseFloat(form.odometer_at_service) || undefined,
        replacement_interval_km: parseFloat(form.replacement_interval_km) || undefined,
        service_category: 'routine',
      } as any);
      toast.success('Part logged');
      setAddOpen(false);
      setForm({ part_name: '', service_date: new Date().toISOString().split('T')[0], odometer_at_service: '', replacement_interval_km: '' });
    } catch { toast.error('Failed to add'); }
  };

  const handleDelete = async (s: ServiceLog) => {
    if (!confirm('Delete this part record?')) return;
    await deleteService.mutateAsync({ id: s.id, vehicleId: vehicle.id });
    toast.success('Deleted');
  };

  const barColor = (pct: number) => {
    if (pct >= 70) return 'bg-success';
    if (pct >= 40) return 'bg-accent';
    return 'bg-destructive';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          <h2 className="font-display text-lg font-bold tracking-wider text-primary uppercase">Anatomy X-Ray</h2>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="gradient-cyan text-primary-foreground font-semibold">
          <Plus className="mr-1 h-4 w-4" /> Log Part
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {parts.map(p => (
          <div key={p.key} className="glass-card neon-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">{p.label}</span>
              <div className="flex items-center gap-2">
                {p.hasData ? (
                  <span className={`font-mono text-sm font-bold ${p.lifeRemaining >= 70 ? 'text-success' : p.lifeRemaining >= 40 ? 'text-accent' : 'text-destructive'}`}>
                    {Math.round(p.lifeRemaining)}%
                  </span>
                ) : (
                  <span className="font-mono text-xs font-medium text-muted-foreground">Not Logged</span>
                )}
                {p.latest && (
                  <button onClick={() => handleDelete(p.latest!)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mb-2">
              <div className={`h-full rounded-full transition-all duration-700 ${p.hasData ? barColor(p.lifeRemaining) : 'bg-muted'}`}
                style={{ width: p.hasData ? `${p.lifeRemaining}%` : '0%' }} />
            </div>
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>{p.hasData ? `Installed: ${p.latest?.service_date}` : 'No data'}</span>
              <span>Life: {p.interval.toLocaleString()} km</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Part Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-primary">Log Part Installation</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div><Label className="text-muted-foreground">Part Name *</Label>
              <Input value={form.part_name} onChange={e => setForm(f => ({ ...f, part_name: e.target.value }))}
                placeholder="e.g. Alternator, Battery..." className="bg-input border-border" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Install Date</Label>
                <Input type="date" value={form.service_date} onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))} className="bg-input border-border" />
              </div>
              <div><Label className="text-muted-foreground">Odometer at Install</Label>
                <Input type="number" value={form.odometer_at_service} onChange={e => setForm(f => ({ ...f, odometer_at_service: e.target.value }))} className="bg-input border-border" />
              </div>
            </div>
            <div><Label className="text-muted-foreground">Life Expectancy (km)</Label>
              <Input type="number" value={form.replacement_interval_km} onChange={e => setForm(f => ({ ...f, replacement_interval_km: e.target.value }))} className="bg-input border-border" />
            </div>
            <Button type="submit" disabled={addService.isPending} className="w-full gradient-cyan text-primary-foreground font-semibold">
              {addService.isPending ? 'Saving...' : 'Save Part'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnatomyView;
