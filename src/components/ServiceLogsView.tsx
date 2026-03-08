import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useServiceLogs, useAddServiceLog, useDeleteServiceLog } from '@/hooks/useServiceLogs';
import { Vehicle } from '@/hooks/useVehicles';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ServiceLogsViewProps {
  vehicle: Vehicle;
}

const ServiceLogsView = ({ vehicle }: ServiceLogsViewProps) => {
  const { data: logs, isLoading } = useServiceLogs(vehicle.id);
  const addLog = useAddServiceLog();
  const deleteLog = useDeleteServiceLog();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    part_name: '', part_number: '', location_shop: '', price: '',
    service_date: new Date().toISOString().split('T')[0],
    odometer_at_service: '', replacement_interval_km: '', notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.part_name.trim()) { toast.error('Part name is required'); return; }
    try {
      await addLog.mutateAsync({
        vehicle_id: vehicle.id,
        part_name: form.part_name.trim(),
        part_number: form.part_number.trim() || undefined,
        location_shop: form.location_shop.trim() || undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        service_date: form.service_date,
        odometer_at_service: form.odometer_at_service ? parseFloat(form.odometer_at_service) : undefined,
        replacement_interval_km: form.replacement_interval_km ? parseFloat(form.replacement_interval_km) : undefined,
        notes: form.notes.trim() || undefined,
      });
      toast.success('Service log added!');
      setOpen(false);
      setForm({ part_name: '', part_number: '', location_shop: '', price: '', service_date: new Date().toISOString().split('T')[0], odometer_at_service: '', replacement_interval_km: '', notes: '' });
    } catch { toast.error('Failed to add service log'); }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Service Logs</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-amber text-primary-foreground font-semibold">
              <Plus className="h-4 w-4" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">New Service Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground">Part Name *</Label><Input value={form.part_name} onChange={(e) => setForm(f => ({...f, part_name: e.target.value}))} placeholder="Oil Filter" className="bg-input border-border" /></div>
                <div><Label className="text-muted-foreground">Part Number</Label><Input value={form.part_number} onChange={(e) => setForm(f => ({...f, part_number: e.target.value}))} placeholder="OEM-12345" className="bg-input border-border" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground">Shop / Location</Label><Input value={form.location_shop} onChange={(e) => setForm(f => ({...f, location_shop: e.target.value}))} placeholder="AutoZone" className="bg-input border-border" /></div>
                <div><Label className="text-muted-foreground">Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm(f => ({...f, price: e.target.value}))} placeholder="45.99" className="bg-input border-border" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground">Date</Label><Input type="date" value={form.service_date} onChange={(e) => setForm(f => ({...f, service_date: e.target.value}))} className="bg-input border-border" /></div>
                <div><Label className="text-muted-foreground">Odometer at Service</Label><Input type="number" value={form.odometer_at_service} onChange={(e) => setForm(f => ({...f, odometer_at_service: e.target.value}))} placeholder="50000" className="bg-input border-border" /></div>
              </div>
              <div>
                <Label className="text-muted-foreground">Replacement Interval (km)</Label>
                <Input type="number" value={form.replacement_interval_km} onChange={(e) => setForm(f => ({...f, replacement_interval_km: e.target.value}))} placeholder="5000" className="bg-input border-border" />
              </div>
              <div><Label className="text-muted-foreground">Notes</Label><Input value={form.notes} onChange={(e) => setForm(f => ({...f, notes: e.target.value}))} placeholder="Synthetic oil change" className="bg-input border-border" /></div>
              <Button type="submit" disabled={addLog.isPending} className="w-full gradient-amber text-primary-foreground font-semibold">
                {addLog.isPending ? 'Adding...' : 'Add Service Record'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !logs?.length ? (
        <div className="glass-card flex flex-col items-center py-12 text-center">
          <p className="text-muted-foreground">No service logs yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="glass-card flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{log.part_name}</span>
                  {log.part_number && <span className="font-mono text-xs text-muted-foreground">#{log.part_number}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{format(new Date(log.service_date), 'MMM d, yyyy')}</span>
                  {log.location_shop && <span>📍 {log.location_shop}</span>}
                  {log.price != null && <span className="text-primary font-mono">${log.price}</span>}
                  {log.odometer_at_service != null && <span>{log.odometer_at_service.toLocaleString()} km</span>}
                  {log.replacement_interval_km != null && <span>🔄 every {log.replacement_interval_km.toLocaleString()} km</span>}
                </div>
                {log.notes && <p className="mt-1 text-xs text-muted-foreground/70">{log.notes}</p>}
              </div>
              <button
                onClick={() => deleteLog.mutate({ id: log.id, vehicleId: vehicle.id })}
                className="ml-3 shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceLogsView;
