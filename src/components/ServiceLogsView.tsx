import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useServiceLogs, useAddServiceLog, useUpdateServiceLog, useDeleteServiceLog, ServiceLog } from '@/hooks/useServiceLogs';
import { Vehicle } from '@/hooks/useVehicles';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ServiceLogsViewProps {
  vehicle: Vehicle;
}

const CATEGORIES = [
  { value: 'routine', label: 'Routine Service' },
  { value: 'emergency', label: 'Emergency Repair' },
  { value: 'upgrade', label: 'Upgrade' },
];

const emptyForm = () => ({
  part_name: '', part_number: '', location_shop: '', price: '',
  service_date: new Date().toISOString().split('T')[0],
  odometer_at_service: '', replacement_interval_km: '', notes: '',
  service_category: 'routine',
});

const ServiceLogsView = ({ vehicle }: ServiceLogsViewProps) => {
  const { data: logs, isLoading } = useServiceLogs(vehicle.id);
  const addLog = useAddServiceLog();
  const updateLog = useUpdateServiceLog();
  const deleteLog = useDeleteServiceLog();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setOpen(true); };

  const openEdit = (log: ServiceLog) => {
    setEditingId(log.id);
    setForm({
      part_name: log.part_name, part_number: log.part_number || '', location_shop: log.location_shop || '',
      price: log.price != null ? String(log.price) : '', service_date: log.service_date,
      odometer_at_service: log.odometer_at_service != null ? String(log.odometer_at_service) : '',
      replacement_interval_km: log.replacement_interval_km != null ? String(log.replacement_interval_km) : '',
      notes: log.notes || '',
      service_category: (log as any).service_category || 'routine',
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.part_name.trim()) { toast.error('Part name is required'); return; }
    try {
      const payload: any = {
        part_name: form.part_name.trim(),
        part_number: form.part_number.trim() || null,
        location_shop: form.location_shop.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        service_date: form.service_date,
        odometer_at_service: form.odometer_at_service ? parseFloat(form.odometer_at_service) : null,
        replacement_interval_km: form.replacement_interval_km ? parseFloat(form.replacement_interval_km) : null,
        notes: form.notes.trim() || null,
        service_category: form.service_category,
      };
      if (editingId) {
        await updateLog.mutateAsync({ id: editingId, vehicleId: vehicle.id, ...payload });
        toast.success('Service log updated!');
      } else {
        await addLog.mutateAsync({ vehicle_id: vehicle.id, ...payload });
        toast.success('Service log added!');
      }
      setOpen(false); setForm(emptyForm()); setEditingId(null);
    } catch { toast.error('Failed to save service log'); }
  };

  const getCatLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label || cat;
  const getCatColor = (cat: string) => {
    if (cat === 'emergency') return 'bg-destructive/10 text-destructive';
    if (cat === 'upgrade') return 'bg-success/10 text-success';
    return 'bg-primary/10 text-primary';
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Service Logs</h2>
        <Button onClick={openAdd} className="gap-2 gradient-amber text-primary-foreground font-semibold">
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? 'Edit Service Record' : 'New Service Record'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Part Name *</Label><Input value={form.part_name} onChange={e => setForm(f => ({...f, part_name: e.target.value}))} placeholder="Oil Filter" className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Category</Label>
                <Select value={form.service_category} onValueChange={v => setForm(f => ({...f, service_category: v}))}>
                  <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Part Number</Label><Input value={form.part_number} onChange={e => setForm(f => ({...f, part_number: e.target.value}))} placeholder="OEM-12345" className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Shop / Location</Label><Input value={form.location_shop} onChange={e => setForm(f => ({...f, location_shop: e.target.value}))} placeholder="AutoZone" className="bg-input border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} placeholder="45.99" className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Date</Label><Input type="date" value={form.service_date} onChange={e => setForm(f => ({...f, service_date: e.target.value}))} className="bg-input border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Odometer</Label><Input type="number" value={form.odometer_at_service} onChange={e => setForm(f => ({...f, odometer_at_service: e.target.value}))} placeholder="50000" className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Replace Interval (km)</Label><Input type="number" value={form.replacement_interval_km} onChange={e => setForm(f => ({...f, replacement_interval_km: e.target.value}))} placeholder="5000" className="bg-input border-border" /></div>
            </div>
            <div><Label className="text-muted-foreground">Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Synthetic oil change" className="bg-input border-border" /></div>
            <Button type="submit" disabled={addLog.isPending || updateLog.isPending} className="w-full gradient-amber text-primary-foreground font-semibold">
              {editingId ? (updateLog.isPending ? 'Saving...' : 'Save Changes') : (addLog.isPending ? 'Adding...' : 'Add Service Record')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !logs?.length ? (
        <div className="glass-card flex flex-col items-center py-12 text-center">
          <p className="text-muted-foreground">No service logs yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="glass-card flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{log.part_name}</span>
                  {log.part_number && <span className="font-mono text-xs text-muted-foreground">#{log.part_number}</span>}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCatColor((log as any).service_category || 'routine')}`}>
                    {getCatLabel((log as any).service_category || 'routine')}
                  </span>
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
              <div className="ml-3 flex shrink-0 gap-1">
                <button onClick={() => openEdit(log)} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deleteLog.mutate({ id: log.id, vehicleId: vehicle.id })} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceLogsView;
