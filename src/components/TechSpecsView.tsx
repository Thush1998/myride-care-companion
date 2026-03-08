import { useState } from 'react';
import { Pencil, Save, X, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vehicle, useUpdateVehicle } from '@/hooks/useVehicles';
import { toast } from 'sonner';

interface TechSpecsViewProps {
  vehicle: Vehicle;
}

const FIELDS = [
  { key: 'chassis_number', label: 'Chassis Number', placeholder: 'e.g. V45W-0123456' },
  { key: 'engine_number', label: 'Engine Number', placeholder: 'e.g. 6G72-AX1234' },
  { key: 'paint_code', label: 'Paint Code', placeholder: 'e.g. A31 Ivory White' },
  { key: 'oil_grade', label: 'Oil Grade', placeholder: 'e.g. 10W-30' },
  { key: 'tire_pressure_psi', label: 'Tire Pressure (PSI)', placeholder: 'e.g. 32' },
];

const TechSpecsView = ({ vehicle }: TechSpecsViewProps) => {
  const updateVehicle = useUpdateVehicle();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const startEdit = () => {
    const v = vehicle as any;
    setForm({
      chassis_number: v.chassis_number || '',
      engine_number: v.engine_number || '',
      paint_code: v.paint_code || '',
      oil_grade: v.oil_grade || '',
      tire_pressure_psi: v.tire_pressure_psi != null ? String(v.tire_pressure_psi) : '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateVehicle.mutateAsync({
        id: vehicle.id,
        chassis_number: form.chassis_number.trim() || undefined,
        engine_number: form.engine_number.trim() || undefined,
        paint_code: form.paint_code.trim() || undefined,
        oil_grade: form.oil_grade.trim() || undefined,
        tire_pressure_psi: form.tire_pressure_psi ? parseFloat(form.tire_pressure_psi) : undefined,
      } as any);
      toast.success('Technical specs saved!');
      setEditing(false);
    } catch {
      toast.error('Failed to save specs');
    }
  };

  const v = vehicle as any;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Technical Specs</h2>
        {editing ? (
          <div className="flex gap-2">
            <Button onClick={() => setEditing(false)} variant="outline" size="sm" className="gap-1 border-border">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateVehicle.isPending} size="sm" className="gap-1 gradient-amber text-primary-foreground font-semibold">
              <Save className="h-4 w-4" /> {updateVehicle.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        ) : (
          <Button onClick={startEdit} variant="outline" size="sm" className="gap-1 border-border text-muted-foreground">
            <Pencil className="h-4 w-4" /> Edit Specs
          </Button>
        )}
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">{vehicle.make} {vehicle.model} — {vehicle.year}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map(f => (
            <div key={f.key}>
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              {editing ? (
                <Input
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="mt-1 bg-input border-border font-mono"
                  type={f.key === 'tire_pressure_psi' ? 'number' : 'text'}
                />
              ) : (
                <p className="mt-1 font-mono text-sm text-foreground">
                  {v[f.key] != null && v[f.key] !== '' ? (
                    f.key === 'tire_pressure_psi' ? `${v[f.key]} PSI` : v[f.key]
                  ) : (
                    <span className="text-muted-foreground/50">Not set</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechSpecsView;
