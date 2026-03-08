import { useState } from 'react';
import { Fuel, Plus, Trash2, TrendingDown, Pencil, Gauge } from 'lucide-react';
import { calcKmPerLiter, calcLitersPer100km, calcCostPerKm } from '@/lib/fuelCalcs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFuelLogs, useAddFuelLog, useUpdateFuelLog, useDeleteFuelLog, FuelLog } from '@/hooks/useFuelLogs';
import { Vehicle, useUpdateOdometer } from '@/hooks/useVehicles';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FuelLogViewProps {
  vehicle: Vehicle;
}

const emptyForm = () => ({
  liters: '', price_per_liter: '', total_cost: '', fuel_date: new Date().toISOString().split('T')[0],
  odometer_at_fill: '', fuel_type: 'Petrol', station: '', notes: '',
});

const FuelLogView = ({ vehicle }: FuelLogViewProps) => {
  const { data: logs, isLoading } = useFuelLogs(vehicle.id);
  const addLog = useAddFuelLog();
  const updateLog = useUpdateFuelLog();
  const deleteLog = useDeleteFuelLog();
  const updateOdometer = useUpdateOdometer();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [odoDialogOpen, setOdoDialogOpen] = useState(false);
  const [newOdometer, setNewOdometer] = useState('');

  const totalLiters = logs?.reduce((sum, l) => sum + l.liters, 0) ?? 0;
  const avgKmPerL = calcKmPerLiter(logs || []);
  const lPer100 = calcLitersPer100km(logs || []);
  const costPerKm = calcCostPerKm(logs || []);

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setOpen(true); };

  const openEdit = (log: FuelLog) => {
    setEditingId(log.id);
    setForm({
      liters: String(log.liters), price_per_liter: log.price_per_liter != null ? String(log.price_per_liter) : '',
      total_cost: log.total_cost != null ? String(log.total_cost) : '', fuel_date: log.fuel_date,
      odometer_at_fill: log.odometer_at_fill != null ? String(log.odometer_at_fill) : '',
      fuel_type: log.fuel_type || 'Petrol', station: log.station || '', notes: log.notes || '',
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.liters) { toast.error('Liters is required'); return; }
    try {
      const payload = {
        liters: parseFloat(form.liters),
        fuel_date: form.fuel_date,
        price_per_liter: form.price_per_liter ? parseFloat(form.price_per_liter) : null,
        total_cost: form.total_cost ? parseFloat(form.total_cost) : null,
        odometer_at_fill: form.odometer_at_fill ? parseFloat(form.odometer_at_fill) : null,
        fuel_type: form.fuel_type,
        station: form.station.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editingId) {
        await updateLog.mutateAsync({ id: editingId, vehicleId: vehicle.id, ...payload });
        toast.success('Fuel log updated!');
      } else {
        await addLog.mutateAsync({ vehicle_id: vehicle.id, ...payload as any });
        toast.success('Fuel log added!');
      }
      // Sync vehicle odometer if fuel log odometer is higher
      if (payload.odometer_at_fill && payload.odometer_at_fill > vehicle.current_odometer) {
        await updateOdometer.mutateAsync({ id: vehicle.id, odometer: payload.odometer_at_fill });
      }
      setOpen(false); setForm(emptyForm()); setEditingId(null);
    } catch { toast.error('Failed to save fuel log'); }
  };

  const handleLitersChange = (val: string) => {
    setForm(f => {
      const n = { ...f, liters: val };
      if (val && f.price_per_liter) n.total_cost = (parseFloat(val) * parseFloat(f.price_per_liter)).toFixed(2);
      return n;
    });
  };
  const handlePriceChange = (val: string) => {
    setForm(f => {
      const n = { ...f, price_per_liter: val };
      if (val && f.liters) n.total_cost = (parseFloat(f.liters) * parseFloat(val)).toFixed(2);
      return n;
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Fuel Log</h2>
        <Button onClick={openAdd} className="gap-2 gradient-amber text-primary-foreground font-semibold">
          <Plus className="h-4 w-4" /> Add Fill-up
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">{editingId ? 'Edit Fuel Log' : 'Log Fuel Fill-up'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Liters *</Label><Input type="number" step="0.01" value={form.liters} onChange={(e) => handleLitersChange(e.target.value)} placeholder="40.0" className="bg-input border-border font-mono" /></div>
              <div><Label className="text-muted-foreground">Price/Liter</Label><Input type="number" step="0.01" value={form.price_per_liter} onChange={(e) => handlePriceChange(e.target.value)} placeholder="1.85" className="bg-input border-border font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Total Cost</Label><Input type="number" step="0.01" value={form.total_cost} onChange={(e) => setForm(f => ({ ...f, total_cost: e.target.value }))} placeholder="74.00" className="bg-input border-border font-mono" /></div>
              <div><Label className="text-muted-foreground">Odometer</Label><Input type="number" value={form.odometer_at_fill} onChange={(e) => setForm(f => ({ ...f, odometer_at_fill: e.target.value }))} placeholder={String(vehicle.current_odometer)} className="bg-input border-border font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Date</Label><Input type="date" value={form.fuel_date} onChange={(e) => setForm(f => ({ ...f, fuel_date: e.target.value }))} className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Fuel Type</Label>
                <Select value={form.fuel_type} onValueChange={(v) => setForm(f => ({ ...f, fuel_type: v }))}>
                  <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="EV">Electric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-muted-foreground">Station</Label><Input value={form.station} onChange={(e) => setForm(f => ({ ...f, station: e.target.value }))} placeholder="Shell Main St" className="bg-input border-border" /></div>
            <Button type="submit" disabled={addLog.isPending || updateLog.isPending} className="w-full gradient-amber text-primary-foreground font-semibold">
              {editingId ? (updateLog.isPending ? 'Saving...' : 'Save Changes') : (addLog.isPending ? 'Adding...' : 'Log Fill-up')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Fuel className="h-5 w-5 text-primary" /></div>
          <div><div className="text-xs text-muted-foreground">Total Fuel</div><div className="font-mono text-lg font-semibold text-foreground">{totalLiters.toFixed(1)} L</div></div>
        </div>
        <div className="glass-card flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><TrendingDown className="h-5 w-5 text-primary" /></div>
          <div><div className="text-xs text-muted-foreground">Avg Consumption</div><div className="font-mono text-lg font-semibold text-foreground">{avgKmPerL != null ? `${avgKmPerL.toFixed(1)} km/L` : 'N/A'}</div></div>
        </div>
        <div className="glass-card flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Gauge className="h-5 w-5 text-primary" /></div>
          <div><div className="text-xs text-muted-foreground">L / 100 km</div><div className="font-mono text-lg font-semibold text-foreground">{lPer100 != null ? lPer100.toFixed(1) : 'N/A'}</div></div>
        </div>
        <div className="glass-card flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><span className="text-sm font-bold text-destructive">Rs.</span></div>
          <div><div className="text-xs text-muted-foreground">Cost/km</div><div className="font-mono text-lg font-semibold text-foreground">{costPerKm != null ? `Rs. ${costPerKm.toFixed(2)}` : 'N/A'}</div></div>
        </div>
      </div>

      {/* Logs */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !logs?.length ? (
        <div className="glass-card flex flex-col items-center py-12 text-center">
          <Fuel className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">No fuel logs yet. Log your first fill-up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="glass-card flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{log.liters} L</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{log.fuel_type}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{format(new Date(log.fuel_date), 'MMM d, yyyy')}</span>
                  {log.station && <span>⛽ {log.station}</span>}
                  {log.total_cost != null && <span className="font-mono text-primary">Rs. {log.total_cost}</span>}
                  {log.price_per_liter != null && <span className="font-mono">Rs. {log.price_per_liter}/L</span>}
                  {log.odometer_at_fill != null && <span>{log.odometer_at_fill.toLocaleString()} km</span>}
                </div>
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

export default FuelLogView;
