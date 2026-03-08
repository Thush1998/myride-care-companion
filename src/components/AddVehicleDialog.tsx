import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddVehicle } from '@/hooks/useVehicles';
import { toast } from 'sonner';

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddVehicleDialog = ({ open, onOpenChange }: AddVehicleDialogProps) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNo, setPlateNo] = useState('');
  const [color, setColor] = useState('');
  const addVehicle = useAddVehicle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !year || !plateNo.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await addVehicle.mutateAsync({
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        plate_no: plateNo.trim(),
        color: color.trim() || undefined,
      });
      toast.success('Vehicle added!');
      onOpenChange(false);
      setMake(''); setModel(''); setYear(''); setPlateNo(''); setColor('');
    } catch {
      toast.error('Failed to add vehicle');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Make *</Label>
              <Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" className="bg-input border-border" />
            </div>
            <div>
              <Label className="text-muted-foreground">Model *</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Corolla" className="bg-input border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Year *</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" className="bg-input border-border" />
            </div>
            <div>
              <Label className="text-muted-foreground">Plate No *</Label>
              <Input value={plateNo} onChange={(e) => setPlateNo(e.target.value)} placeholder="ABC-1234" className="bg-input border-border" />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">Color</Label>
            <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Silver" className="bg-input border-border" />
          </div>
          <Button type="submit" disabled={addVehicle.isPending} className="w-full gradient-amber text-primary-foreground font-semibold">
            {addVehicle.isPending ? 'Adding...' : 'Add Vehicle'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;
