import { useState } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import PartNameCombobox from '@/components/PartNameCombobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSpareParts, useAddSparePart, useDeleteSparePart, useUpdateSparePart } from '@/hooks/useSpareParts';
import { toast } from 'sonner';

interface SparePartsViewProps {
  vehicleId: string;
}

const SparePartsView = ({ vehicleId }: SparePartsViewProps) => {
  const { data: parts, isLoading } = useSpareParts(vehicleId);
  const addPart = useAddSparePart();
  const deletePart = useDeleteSparePart();
  const updatePart = useUpdateSparePart();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ part_name: '', part_number: '', brand: '', quantity: '1', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.part_name.trim()) { toast.error('Part name required'); return; }
    await addPart.mutateAsync({
      vehicle_id: vehicleId,
      part_name: form.part_name.trim(),
      part_number: form.part_number.trim() || undefined,
      brand: form.brand.trim() || undefined,
      quantity: parseInt(form.quantity) || 1,
      notes: form.notes.trim() || undefined,
    });
    toast.success('Spare part added!');
    setOpen(false);
    setForm({ part_name: '', part_number: '', brand: '', quantity: '1', notes: '' });
  };

  const adjustQty = async (id: string, current: number, delta: number) => {
    const newQty = Math.max(0, current + delta);
    await updatePart.mutateAsync({ id, vehicleId, quantity: newQty });
  };

  return (
    <div className="glass-card neon-border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xs font-bold tracking-wider text-primary uppercase flex items-center gap-2">
          <Package className="h-4 w-4" /> Spare Parts Inventory
        </h3>
        <Button onClick={() => setOpen(true)} size="sm" variant="outline" className="gap-1 border-primary/30 text-primary hover:bg-primary/10 text-xs">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : !parts?.length ? (
        <p className="py-4 text-center font-mono text-xs text-muted-foreground/60">No spare parts in stock. Add parts you have at home.</p>
      ) : (
        <div className="space-y-2">
          {parts.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{p.part_name}</span>
                  {p.brand && <span className="text-xs text-muted-foreground">({p.brand})</span>}
                </div>
                {p.part_number && <span className="font-mono text-xs text-muted-foreground">#{p.part_number}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => adjustQty(p.id, p.quantity, -1)} className="h-6 w-6 rounded bg-secondary text-foreground text-sm font-bold hover:bg-secondary/80">−</button>
                <span className="font-mono text-sm font-bold text-primary w-6 text-center">{p.quantity}</span>
                <button onClick={() => adjustQty(p.id, p.quantity, 1)} className="h-6 w-6 rounded bg-secondary text-foreground text-sm font-bold hover:bg-secondary/80">+</button>
                <button onClick={() => deletePart.mutate({ id: p.id, vehicleId })} className="ml-1 rounded p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-primary">Add Spare Part</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label className="text-muted-foreground">Part Name *</Label><Input value={form.part_name} onChange={e => setForm(f => ({ ...f, part_name: e.target.value }))} placeholder="Oil Filter" className="bg-input border-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Brand</Label><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Sakura" className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Quantity</Label><Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="bg-input border-border" /></div>
            </div>
            <div><Label className="text-muted-foreground">Part Number</Label><Input value={form.part_number} onChange={e => setForm(f => ({ ...f, part_number: e.target.value }))} placeholder="OEM-12345" className="bg-input border-border" /></div>
            <div><Label className="text-muted-foreground">Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Bought from Amazon" className="bg-input border-border" /></div>
            <Button type="submit" disabled={addPart.isPending} className="w-full gradient-cyan text-primary-foreground font-semibold">
              {addPart.isPending ? 'Adding...' : 'Add to Inventory'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SparePartsView;
