import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddVehicle } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, ChevronRight, ChevronLeft, Check, AlertTriangle, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRACKED_COMPONENTS = [
  { key: 'engine oil', label: 'Engine Oil', defaultInterval: 5000 },
  { key: 'timing belt', label: 'Timing Belt', defaultInterval: 100000 },
  { key: 'gear oil', label: 'Gear Oil', defaultInterval: 40000 },
  { key: 'brake pad', label: 'Brake Pads', defaultInterval: 40000 },
  { key: 'air filter', label: 'Air Filter', defaultInterval: 20000 },
  { key: 'tire', label: 'Tires', defaultInterval: 50000 },
];

const INSPECTION_ITEMS = [
  { key: 'oil_leaks', label: 'No Oil Leaks' },
  { key: 'tire_tread', label: 'Tire Tread OK' },
  { key: 'smoke_level', label: 'No Exhaust Smoke' },
  { key: 'brake_feel', label: 'Brakes Feel Good' },
  { key: 'suspension', label: 'No Suspension Noise' },
  { key: 'lights', label: 'All Lights Working' },
  { key: 'fluid_levels', label: 'Fluid Levels OK' },
  { key: 'battery', label: 'Battery Healthy' },
];

type ComponentEntry = { lastMileage: string; status: 'known' | 'unknown' };

const AddVehicleDialog = ({ open, onOpenChange }: AddVehicleDialogProps) => {
  const { user } = useAuth();
  const addVehicle = useAddVehicle();
  const fileRef = useRef<HTMLInputElement>(null);

  // Step tracking
  const [step, setStep] = useState(0);

  // Step 1: Basic info
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNo, setPlateNo] = useState('');
  const [color, setColor] = useState('');
  const [nickname, setNickname] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [odometer, setOdometer] = useState('');

  // Step 2: Component baselines
  const [components, setComponents] = useState<Record<string, ComponentEntry>>(() => {
    const init: Record<string, ComponentEntry> = {};
    TRACKED_COMPONENTS.forEach(c => { init[c.key] = { lastMileage: '', status: 'unknown' }; });
    return init;
  });

  // Step 3: Inspection checklist
  const [inspections, setInspections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    INSPECTION_ITEMS.forEach(i => { init[i.key] = false; });
    return init;
  });

  // AI Inspection
  const [aiScanning, setAiScanning] = useState(false);
  const [aiFindings, setAiFindings] = useState<any>(null);
  const [aiPhotoPreview, setAiPhotoPreview] = useState<string | null>(null);
  const aiPhotoRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateComponent = (key: string, field: keyof ComponentEntry, value: string) => {
    setComponents(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: field === 'status' ? value : value },
    }));
  };

  const inspectionScore = () => {
    const checked = Object.values(inspections).filter(Boolean).length;
    return Math.round((checked / INSPECTION_ITEMS.length) * 100);
  };

  const canProceedStep1 = make.trim() && model.trim() && year && plateNo.trim() && odometer;

  const resetForm = () => {
    setStep(0);
    setMake(''); setModel(''); setYear(''); setPlateNo(''); setColor(''); setNickname('');
    setImageFile(null); setImagePreview(null); setOdometer('');
    const compInit: Record<string, ComponentEntry> = {};
    TRACKED_COMPONENTS.forEach(c => { compInit[c.key] = { lastMileage: '', status: 'unknown' }; });
    setComponents(compInit);
    const inspInit: Record<string, boolean> = {};
    INSPECTION_ITEMS.forEach(i => { inspInit[i.key] = false; });
    setInspections(inspInit);
  };

  const handleSubmit = async () => {
    if (!user) return;
    let imageUrl: string | undefined;

    if (imageFile) {
      setUploading(true);
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('vehicle-images').upload(path, imageFile);
      if (uploadError) { toast.error('Image upload failed'); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('vehicle-images').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
      setUploading(false);
    }

    try {
      const odoVal = parseFloat(odometer) || 0;
      const vehicleData = await addVehicle.mutateAsync({
        make: make.trim(), model: model.trim(), year: parseInt(year),
        plate_no: plateNo.trim(), color: color.trim() || undefined,
        nickname: nickname.trim() || undefined, image_url: imageUrl,
      });

      // Update odometer
      if (odoVal > 0) {
        await supabase.from('vehicles').update({ current_odometer: odoVal } as any).eq('id', vehicleData.id);
      }

      // Insert initial service logs for known components
      const serviceLogs: any[] = [];
      TRACKED_COMPONENTS.forEach(tc => {
        const comp = components[tc.key];
        if (comp.status === 'known' && comp.lastMileage) {
          serviceLogs.push({
            vehicle_id: vehicleData.id,
            user_id: user.id,
            part_name: tc.label,
            service_category: 'routine',
            service_date: new Date().toISOString().split('T')[0],
            odometer_at_service: parseFloat(comp.lastMileage),
            replacement_interval_km: tc.defaultInterval,
            notes: 'Initial condition setup — last known service mileage',
          });
        } else if (comp.status === 'unknown') {
          serviceLogs.push({
            vehicle_id: vehicleData.id,
            user_id: user.id,
            part_name: tc.label,
            service_category: 'inspection',
            service_date: new Date().toISOString().split('T')[0],
            odometer_at_service: 0,
            replacement_interval_km: tc.defaultInterval,
            notes: '⚠ Needs Inspection — last service mileage unknown',
          });
        }
      });

      if (serviceLogs.length > 0) {
        await supabase.from('service_logs').insert(serviceLogs);
      }

      toast.success(`Vehicle added with ${inspectionScore()}% initial health score!`);
      onOpenChange(false);
      resetForm();
    } catch {
      toast.error('Failed to add vehicle');
    }
  };

  const steps = ['Vehicle Info', 'Service History', 'Inspection'];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Vehicle</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary/20 text-primary border border-primary' : 'bg-secondary text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`h-px w-6 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Vehicle Info */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-center">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary/50">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Camera className="h-5 w-5" /><span className="text-[10px]">Photo</span>
                  </div>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <div><Label className="text-muted-foreground">Nickname</Label><Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="My Beast 🔥" className="bg-input border-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Make *</Label><Input value={make} onChange={e => setMake(e.target.value)} placeholder="Mitsubishi" className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Model *</Label><Input value={model} onChange={e => setModel(e.target.value)} placeholder="Pajero" className="bg-input border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Year *</Label><Input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="1998" className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Plate No *</Label><Input value={plateNo} onChange={e => setPlateNo(e.target.value)} placeholder="ABC-1234" className="bg-input border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Color</Label><Input value={color} onChange={e => setColor(e.target.value)} placeholder="Silver" className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Odometer (km) *</Label><Input type="number" value={odometer} onChange={e => setOdometer(e.target.value)} placeholder="150000" className="bg-input border-border" /></div>
            </div>
            <Button onClick={() => setStep(1)} disabled={!canProceedStep1} className="w-full gap-2 gradient-cyan text-primary-foreground font-semibold">
              Next: Service History <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Component Baselines */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-muted-foreground">Set the last known service mileage for each component, or mark as "Needs Inspection" if unknown.</p>
            <div className="space-y-3">
              {TRACKED_COMPONENTS.map(tc => {
                const comp = components[tc.key];
                return (
                  <div key={tc.key} className={`rounded-lg p-3 transition-colors ${comp.status === 'unknown' ? 'bg-accent/10 border border-accent/30' : comp.lastMileage ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/30 border border-border'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">{tc.label}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateComponent(tc.key, 'status', 'known')}
                          className={`rounded-md px-2 py-1 text-[10px] font-bold transition-colors ${comp.status === 'known' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}
                        >Known</button>
                        <button
                          type="button"
                          onClick={() => updateComponent(tc.key, 'status', 'unknown')}
                          className={`rounded-md px-2 py-1 text-[10px] font-bold transition-colors ${comp.status === 'unknown' ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'}`}
                        >Unknown</button>
                      </div>
                    </div>
                    {comp.status === 'known' ? (
                      <Input
                        type="number"
                        value={comp.lastMileage}
                        onChange={e => updateComponent(tc.key, 'lastMileage', e.target.value)}
                        placeholder={`Last serviced at (km) — interval: ${tc.defaultInterval.toLocaleString()} km`}
                        className="bg-input border-border font-mono text-xs h-8"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 text-accent">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Needs Inspection</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(0)} variant="outline" className="flex-1 gap-1 border-border">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1 gap-1 gradient-cyan text-primary-foreground font-semibold">
                Next: Inspection <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Physical Inspection */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-muted-foreground">Check off items you've physically verified. This calculates the initial health score.</p>

            {/* Score Display */}
            <div className="flex items-center justify-center">
              <div className={`flex flex-col items-center rounded-xl p-4 ${inspectionScore() >= 80 ? 'bg-primary/10' : inspectionScore() >= 50 ? 'bg-accent/10' : 'bg-destructive/10'}`}>
                <span className={`font-mono text-3xl font-bold ${inspectionScore() >= 80 ? 'text-primary' : inspectionScore() >= 50 ? 'text-accent' : 'text-destructive'}`}>
                  {inspectionScore()}%
                </span>
                <span className="text-xs text-muted-foreground">Initial Health Score</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {INSPECTION_ITEMS.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setInspections(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors ${
                    inspections[item.key] ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/30 border border-border'
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded-md transition-colors ${inspections[item.key] ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}>
                    {inspections[item.key] && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <span className={`text-sm ${inspections[item.key] ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1 gap-1 border-border">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={addVehicle.isPending || uploading} className="flex-1 gap-1 gradient-amber text-primary-foreground font-semibold">
                {uploading ? 'Uploading...' : addVehicle.isPending ? 'Adding...' : 'Add Vehicle'} <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;
