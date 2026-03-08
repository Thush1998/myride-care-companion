import { useState, useRef } from 'react';
import { Plus, Trash2, Pencil, ScanLine, Camera, FileText, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useServiceLogs, useAddServiceLog, useUpdateServiceLog, useDeleteServiceLog, ServiceLog } from '@/hooks/useServiceLogs';
import { Vehicle } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/supabase/client';
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
  service_category: 'routine', brand_used: '',
});

const ServiceLogsView = ({ vehicle }: ServiceLogsViewProps) => {
  const { data: logs, isLoading } = useServiceLogs(vehicle.id);
  const addLog = useAddServiceLog();
  const updateLog = useUpdateServiceLog();
  const deleteLog = useDeleteServiceLog();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  // Scan state
  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanType, setScanType] = useState<'bill' | 'part'>('bill');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

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
      brand_used: (log as any).brand_used || '',
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
        brand_used: form.brand_used.trim() || null,
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

  const handleScanImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    setPreviewUrl(URL.createObjectURL(file));
    setScanning(true);
    setScanResult(null);

    try {
      // Convert to base64
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke('scan-part', {
        body: { image_base64: base64, scan_type: scanType },
      });

      if (error) throw error;

      if (data?.result?.parse_error) {
        toast.error('Could not parse AI response. Try a clearer image.');
        setScanResult(null);
      } else {
        setScanResult(data);
        toast.success('Scan complete! Review the results below.');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      toast.error(err.message || 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const applyScanToForm = () => {
    if (!scanResult?.result) return;
    const r = scanResult.result;

    if (scanResult.scan_type === 'bill') {
      // Bill scan → fill from extracted bill data
      const firstPart = r.parts?.[0];
      setForm({
        part_name: firstPart?.name || r.vendor || '',
        part_number: firstPart?.part_number || '',
        location_shop: r.vendor || '',
        price: r.total_amount != null ? String(r.total_amount) : (firstPart?.price != null ? String(firstPart.price) : ''),
        service_date: r.date || new Date().toISOString().split('T')[0],
        odometer_at_service: '',
        replacement_interval_km: '',
        notes: r.notes || (r.parts?.length > 1 ? `Parts: ${r.parts.map((p: any) => p.name).join(', ')}` : ''),
        service_category: r.category || 'routine',
      });
    } else {
      // Part scan → fill from part identification
      setForm({
        part_name: r.part_name || '',
        part_number: '',
        location_shop: '',
        price: '',
        service_date: new Date().toISOString().split('T')[0],
        odometer_at_service: '',
        replacement_interval_km: '',
        notes: `Condition: ${r.condition || 'unknown'}. ${r.recommended_action || ''} ${r.notes || ''}`.trim(),
        service_category: r.category || 'routine',
      });
    }

    setScanOpen(false);
    setScanResult(null);
    setPreviewUrl(null);
    setEditingId(null);
    setOpen(true);
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
        <h2 className="font-display text-lg font-bold tracking-wider text-foreground uppercase">Service Logs</h2>
        <div className="flex gap-2">
          <Button onClick={() => { setScanOpen(true); setScanResult(null); setPreviewUrl(null); }} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold">
            <ScanLine className="h-4 w-4" /> AI Scan
          </Button>
          <Button onClick={openAdd} className="gap-2 gradient-cyan text-primary-foreground font-semibold">
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        </div>
      </div>

      {/* AI Scan Dialog */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-primary">
              <Sparkles className="h-5 w-5" /> AI Part & Bill Scanner
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Scan Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScanType('bill')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
                  scanType === 'bill' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                }`}>
                <FileText className="h-4 w-4" /> Scan Bill
              </button>
              <button
                onClick={() => setScanType('part')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
                  scanType === 'part' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                }`}>
                <Camera className="h-4 w-4" /> Scan Part
              </button>
            </div>

            <p className="font-mono text-xs text-muted-foreground">
              {scanType === 'bill'
                ? 'Upload a photo of a service bill, receipt, or invoice to extract vendor, date, amount, and parts.'
                : 'Upload a photo of a vehicle part to identify it and assess its condition.'}
            </p>

            {/* Upload Area */}
            <div
              onClick={() => !scanning && scanInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
                scanning ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-primary/5'
              }`}>
              {scanning ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="font-display text-sm tracking-wider text-primary uppercase">Analyzing image...</span>
                </div>
              ) : previewUrl ? (
                <img src={previewUrl} alt="Scan preview" className="max-h-48 rounded-lg object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ScanLine className="h-10 w-10" />
                  <span className="text-sm font-medium">Tap to capture or upload photo</span>
                </div>
              )}
            </div>
            <input ref={scanInputRef} type="file" accept="image/*" capture="environment" onChange={handleScanImage} className="hidden" />

            {/* Scan Results */}
            {scanResult && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <h4 className="font-display text-xs font-bold tracking-wider text-primary uppercase">Scan Results</h4>

                {scanResult.scan_type === 'bill' ? (
                  <div className="space-y-2 font-mono text-sm">
                    {scanResult.result.vendor && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Vendor</span><span className="text-foreground">{scanResult.result.vendor}</span></div>
                    )}
                    {scanResult.result.date && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{scanResult.result.date}</span></div>
                    )}
                    {scanResult.result.total_amount != null && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-primary font-bold">${scanResult.result.total_amount}</span></div>
                    )}
                    {scanResult.result.parts?.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Parts:</span>
                        <ul className="mt-1 space-y-1 pl-3">
                          {scanResult.result.parts.map((p: any, i: number) => (
                            <li key={i} className="text-foreground">• {p.name}{p.price != null ? ` ($${p.price})` : ''}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {scanResult.result.category && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Category</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCatColor(scanResult.result.category)}`}>{getCatLabel(scanResult.result.category)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-sm">
                    {scanResult.result.part_name && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Part</span><span className="text-foreground">{scanResult.result.part_name}</span></div>
                    )}
                    {scanResult.result.condition && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Condition</span>
                        <span className={`font-bold ${scanResult.result.condition === 'good' ? 'text-success' : scanResult.result.condition === 'worn' ? 'text-accent' : 'text-destructive'}`}>
                          {scanResult.result.condition}
                        </span>
                      </div>
                    )}
                    {scanResult.result.estimated_life_remaining_percent != null && (
                      <div>
                        <div className="flex justify-between mb-1"><span className="text-muted-foreground">Life Remaining</span><span className="text-foreground">{scanResult.result.estimated_life_remaining_percent}%</span></div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div className={`h-full rounded-full transition-all ${
                            scanResult.result.estimated_life_remaining_percent >= 70 ? 'bg-success' : scanResult.result.estimated_life_remaining_percent >= 40 ? 'bg-accent' : 'bg-destructive'
                          }`} style={{ width: `${scanResult.result.estimated_life_remaining_percent}%` }} />
                        </div>
                      </div>
                    )}
                    {scanResult.result.recommended_action && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Action</span><span className="text-foreground">{scanResult.result.recommended_action}</span></div>
                    )}
                  </div>
                )}

                <Button onClick={applyScanToForm} className="w-full gradient-cyan text-primary-foreground font-semibold gap-2">
                  <Sparkles className="h-4 w-4" /> Create Service Log from Scan
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">{editingId ? 'Edit Service Record' : 'New Service Record'}</DialogTitle>
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
              <div><Label className="text-muted-foreground">Brand Used</Label><Input value={form.brand_used} onChange={e => setForm(f => ({...f, brand_used: e.target.value}))} placeholder="Sakura, Vic, OEM..." className="bg-input border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Shop / Location</Label><Input value={form.location_shop} onChange={e => setForm(f => ({...f, location_shop: e.target.value}))} placeholder="AutoZone" className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} placeholder="45.99" className="bg-input border-border" /></div>
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
            <Button type="submit" disabled={addLog.isPending || updateLog.isPending} className="w-full gradient-cyan text-primary-foreground font-semibold">
              {editingId ? (updateLog.isPending ? 'Saving...' : 'Save Changes') : (addLog.isPending ? 'Adding...' : 'Add Service Record')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !logs?.length ? (
        <div className="glass-card neon-border flex flex-col items-center py-12 text-center">
          <ScanLine className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">No service logs yet.</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground/60">Use AI Scan to auto-fill from a bill photo.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="glass-card neon-border flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{log.part_name}</span>
                  {log.part_number && <span className="font-mono text-xs text-muted-foreground">#{log.part_number}</span>}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCatColor((log as any).service_category || 'routine')}`}>
                    {getCatLabel((log as any).service_category || 'routine')}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                  <span>{format(new Date(log.service_date), 'MMM d, yyyy')}</span>
                  {log.location_shop && <span>📍 {log.location_shop}</span>}
                  {log.price != null && <span className="text-primary font-bold">${log.price}</span>}
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
