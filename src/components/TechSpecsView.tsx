import { useState } from 'react';
import { Pencil, Save, X, Cpu, Droplets, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vehicle, useUpdateVehicle } from '@/hooks/useVehicles';
import { toast } from 'sonner';

interface TechSpecsViewProps {
  vehicle: Vehicle;
}

type FieldDef = { key: string; label: string; placeholder: string; type?: string };

const IDENTITY_FIELDS: FieldDef[] = [
  { key: 'chassis_number', label: 'Chassis Number', placeholder: 'e.g. V45W-0123456' },
  { key: 'engine_number', label: 'Engine Number', placeholder: 'e.g. 6G72-AX1234' },
  { key: 'paint_code', label: 'Paint Code', placeholder: 'e.g. A31 Ivory White' },
  { key: 'oil_grade', label: 'Oil Grade', placeholder: 'e.g. 10W-30' },
  { key: 'tire_pressure_psi', label: 'Tire Pressure (PSI)', placeholder: 'e.g. 32', type: 'number' },
];

const FLUID_FIELDS: FieldDef[] = [
  { key: 'engine_oil_capacity', label: 'Engine Oil Capacity', placeholder: 'e.g. 7.5L' },
  { key: 'coolant_capacity', label: 'Coolant Capacity', placeholder: 'e.g. 10L' },
  { key: 'gear_oil_capacity', label: 'Gear Oil Capacity', placeholder: 'e.g. 3.5L' },
  { key: 'brake_fluid_capacity', label: 'Brake Fluid Capacity', placeholder: 'e.g. 1L' },
  { key: 'power_steering_fluid', label: 'Power Steering Fluid', placeholder: 'e.g. Dexron III' },
];

const TORQUE_FIELDS: FieldDef[] = [
  { key: 'wheel_nut_torque', label: 'Wheel Nut Torque', placeholder: 'e.g. 100 Nm' },
  { key: 'cylinder_head_torque', label: 'Cylinder Head Torque', placeholder: 'e.g. 78 Nm (3 stages)' },
];

const ALL_FIELDS = [...IDENTITY_FIELDS, ...FLUID_FIELDS, ...TORQUE_FIELDS];

const TechSpecsView = ({ vehicle }: TechSpecsViewProps) => {
  const updateVehicle = useUpdateVehicle();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const startEdit = () => {
    const v = vehicle as any;
    const f: Record<string, string> = {};
    ALL_FIELDS.forEach(field => {
      f[field.key] = v[field.key] != null ? String(v[field.key]) : '';
    });
    setForm(f);
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const updates: Record<string, any> = { id: vehicle.id };
      ALL_FIELDS.forEach(field => {
        const val = form[field.key]?.trim();
        if (field.type === 'number') {
          updates[field.key] = val ? parseFloat(val) : null;
        } else {
          updates[field.key] = val || null;
        }
      });
      await updateVehicle.mutateAsync(updates as any);
      toast.success('Technical specs saved!');
      setEditing(false);
    } catch {
      toast.error('Failed to save specs');
    }
  };

  const v = vehicle as any;

  const renderFieldGroup = (title: string, icon: React.ReactNode, fields: typeof IDENTITY_FIELDS) => (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(f => (
          <div key={f.key}>
            <Label className="text-xs text-muted-foreground">{f.label}</Label>
            {editing ? (
              <Input
                value={form[f.key] || ''}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-1 bg-input border-border font-mono"
                type={f.type === 'number' ? 'number' : 'text'}
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
  );

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

      <div className="text-xs text-muted-foreground">{vehicle.make} {vehicle.model} — {vehicle.year}</div>

      {renderFieldGroup('Identity & Basics', <Cpu className="h-5 w-5 text-primary" />, IDENTITY_FIELDS)}
      {renderFieldGroup('Fluid Capacities', <Droplets className="h-5 w-5 text-primary" />, FLUID_FIELDS)}
      {renderFieldGroup('Torque Specifications', <Wrench className="h-5 w-5 text-primary" />, TORQUE_FIELDS)}
    </div>
  );
};

export default TechSpecsView;
