import { useState, useRef } from 'react';
import { Gauge, Wrench, AlertTriangle, TrendingUp, Car, Pencil, Camera } from 'lucide-react';
import { Vehicle, useUpdateVehicle } from '@/hooks/useVehicles';
import { useServiceLogs } from '@/hooks/useServiceLogs';
import { useTrips } from '@/hooks/useTrips';
import { useFuelLogs } from '@/hooks/useFuelLogs';
import { useDocuments } from '@/hooks/useDocuments';
import { useModifications } from '@/hooks/useModifications';
import { useUpdateOdometer } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';
import HealthRings from './HealthRings';
import SpendingChart from './SpendingChart';
import PredictiveAlerts from './PredictiveAlerts';

interface DashboardViewProps {
  vehicle: Vehicle;
}

const DashboardView = ({ vehicle }: DashboardViewProps) => {
  const { user } = useAuth();
  const { data: services } = useServiceLogs(vehicle.id);
  const { data: trips } = useTrips(vehicle.id);
  const { data: fuelLogs } = useFuelLogs(vehicle.id);
  const { data: docs } = useDocuments(vehicle.id);
  const { data: mods } = useModifications(vehicle.id);
  const updateOdometer = useUpdateOdometer();
  const updateVehicle = useUpdateVehicle();
  const [newOdometer, setNewOdometer] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ make: '', model: '', year: '', plate_no: '', color: '', nickname: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const totalSpent = (services?.reduce((sum, s) => sum + (s.price || 0), 0) ?? 0)
    + (mods?.reduce((sum, m) => sum + (m.cost || 0), 0) ?? 0);
  const fuelSpent = fuelLogs?.reduce((sum, f) => sum + (f.total_cost || 0), 0) ?? 0;

  const warnings = (services || []).filter((s) => {
    if (!s.replacement_interval_km || !s.odometer_at_service) return false;
    return (vehicle.current_odometer - s.odometer_at_service) >= s.replacement_interval_km * 0.8;
  });

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

  const openEdit = () => {
    setEditForm({
      make: vehicle.make, model: vehicle.model, year: String(vehicle.year),
      plate_no: vehicle.plate_no, color: vehicle.color || '', nickname: vehicle.nickname || '',
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateVehicle.mutateAsync({
        id: vehicle.id, make: editForm.make.trim(), model: editForm.model.trim(),
        year: parseInt(editForm.year), plate_no: editForm.plate_no.trim(),
        color: editForm.color.trim() || undefined, nickname: editForm.nickname.trim() || undefined,
      });
      toast.success('Vehicle updated!');
      setEditOpen(false);
    } catch { toast.error('Failed to update vehicle'); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('vehicle-images').upload(path, file);
    if (uploadError) { toast.error('Upload failed'); setUploadingPhoto(false); return; }
    const { data: urlData } = supabase.storage.from('vehicle-images').getPublicUrl(path);
    await updateVehicle.mutateAsync({ id: vehicle.id, image_url: urlData.publicUrl });
    toast.success('Photo updated!');
    setUploadingPhoto(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Vehicle Header */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-stretch">
          <div className="relative h-40 w-40 shrink-0 bg-secondary/50 group">
            {vehicle.image_url ? (
              <img src={vehicle.image_url} alt={vehicle.make} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Car className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </button>
            <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>
          <div className="flex flex-1 items-center justify-between p-6">
            <div>
              {vehicle.nickname && <p className="mb-1 text-sm font-medium text-primary">{vehicle.nickname}</p>}
              <h2 className="text-2xl font-bold text-foreground">{vehicle.make} {vehicle.model}</h2>
              <p className="text-muted-foreground">{vehicle.year} · {vehicle.plate_no}{vehicle.color ? ` · ${vehicle.color}` : ''}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-right">
                <div className="font-mono text-3xl font-bold text-primary">{Number(vehicle.current_odometer).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">km</div>
              </div>
              <button onClick={openEdit} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Vehicle Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Edit Vehicle</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div><Label className="text-muted-foreground">Nickname</Label><Input value={editForm.nickname} onChange={e => setEditForm(f => ({ ...f, nickname: e.target.value }))} className="bg-input border-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Make *</Label><Input value={editForm.make} onChange={e => setEditForm(f => ({ ...f, make: e.target.value }))} className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Model *</Label><Input value={editForm.model} onChange={e => setEditForm(f => ({ ...f, model: e.target.value }))} className="bg-input border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Year *</Label><Input type="number" value={editForm.year} onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))} className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Plate No *</Label><Input value={editForm.plate_no} onChange={e => setEditForm(f => ({ ...f, plate_no: e.target.value }))} className="bg-input border-border" /></div>
            </div>
            <div><Label className="text-muted-foreground">Color</Label><Input value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} className="bg-input border-border" /></div>
            <Button type="submit" disabled={updateVehicle.isPending} className="w-full gradient-amber text-primary-foreground font-semibold">
              {updateVehicle.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Component Health Rings */}
      <HealthRings services={services || []} currentOdometer={vehicle.current_odometer} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Gauge} label="Odometer" value={`${Number(vehicle.current_odometer).toLocaleString()} km`} />
        <StatCard icon={Wrench} label="Total Services" value={String(services?.length ?? 0)} />
        <StatCard icon={TrendingUp} label="Service + Mods" value={`$${totalSpent.toLocaleString()}`} />
        <StatCard icon={TrendingUp} label="Fuel Spent" value={`$${fuelSpent.toLocaleString()}`} />
      </div>

      {/* Spending Chart + Predictive Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SpendingChart services={services || []} />
        <PredictiveAlerts services={services || []} fuelLogs={fuelLogs || []} currentOdometer={vehicle.current_odometer} />
      </div>

      {/* Warnings */}
      {(warnings.length > 0 || expiringDocs.length > 0) && (
        <div className="glass-card border-warning/30 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" /> Alerts ({warnings.length + expiringDocs.length})
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
                      <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-destructive' : 'bg-warning'}`} style={{ width: `${pct}%` }} />
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
          <Input type="number" value={newOdometer} onChange={e => setNewOdometer(e.target.value)}
            placeholder={`Current: ${Number(vehicle.current_odometer).toLocaleString()} km`} className="bg-input border-border font-mono" />
          <Button onClick={handleOdometerUpdate} disabled={updateOdometer.isPending} className="gradient-amber text-primary-foreground font-semibold">Update</Button>
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
