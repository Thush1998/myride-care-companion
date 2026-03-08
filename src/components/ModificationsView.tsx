import { useState, useRef } from 'react';
import { Plus, Trash2, Pencil, Wrench, Camera, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useModifications, useAddModification, useUpdateModification, useDeleteModification, Modification } from '@/hooks/useModifications';
import { Vehicle } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ModificationsViewProps {
  vehicle: Vehicle;
}

const emptyForm = () => ({
  mod_name: '', description: '', mod_date: new Date().toISOString().split('T')[0],
  cost: '', wiring_notes: '',
});

const ModificationsView = ({ vehicle }: ModificationsViewProps) => {
  const { user } = useAuth();
  const { data: mods, isLoading } = useModifications(vehicle.id);
  const addMod = useAddModification();
  const updateMod = useUpdateModification();
  const deleteMod = useDeleteModification();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setSelectedFile(null); setOpen(true); };

  const openEdit = (mod: Modification) => {
    setEditingId(mod.id);
    setForm({
      mod_name: mod.mod_name,
      description: mod.description || '',
      mod_date: mod.mod_date,
      cost: mod.cost != null ? String(mod.cost) : '',
      wiring_notes: mod.wiring_notes || '',
    });
    setSelectedFile(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mod_name.trim()) { toast.error('Modification name is required'); return; }

    let photoUrl: string | undefined;
    if (selectedFile && user) {
      setUploading(true);
      const ext = selectedFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('modification-photos').upload(path, selectedFile);
      if (uploadError) { toast.error('Photo upload failed'); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('modification-photos').getPublicUrl(path);
      photoUrl = urlData.publicUrl;
      setUploading(false);
    }

    try {
      if (editingId) {
        await updateMod.mutateAsync({
          id: editingId, vehicleId: vehicle.id,
          mod_name: form.mod_name.trim(),
          description: form.description.trim() || null,
          mod_date: form.mod_date,
          cost: form.cost ? parseFloat(form.cost) : null,
          wiring_notes: form.wiring_notes.trim() || null,
          ...(photoUrl ? { photo_url: photoUrl } : {}),
        });
        toast.success('Modification updated!');
      } else {
        await addMod.mutateAsync({
          vehicle_id: vehicle.id,
          mod_name: form.mod_name.trim(),
          description: form.description.trim() || undefined,
          mod_date: form.mod_date,
          cost: form.cost ? parseFloat(form.cost) : undefined,
          wiring_notes: form.wiring_notes.trim() || undefined,
          photo_url: photoUrl,
        });
        toast.success('Modification added!');
      }
      setOpen(false); setForm(emptyForm()); setEditingId(null); setSelectedFile(null);
    } catch { toast.error('Failed to save modification'); }
  };

  const totalCost = mods?.reduce((sum, m) => sum + (m.cost || 0), 0) ?? 0;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Modifications</h2>
          {mods && mods.length > 0 && (
            <p className="text-xs text-muted-foreground">{mods.length} mods · Rs. {totalCost.toLocaleString()} invested</p>
          )}
        </div>
        <Button onClick={openAdd} className="gap-2 gradient-amber text-primary-foreground font-semibold">
          <Plus className="h-4 w-4" /> Add Mod
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? 'Edit Modification' : 'New Modification'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Modification Name *</Label>
              <Input value={form.mod_name} onChange={e => setForm(f => ({ ...f, mod_name: e.target.value }))} placeholder="Winch Installation" className="bg-input border-border" />
            </div>
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Warn VR8-S 8000lb synthetic rope" className="bg-input border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-muted-foreground">Date</Label><Input type="date" value={form.mod_date} onChange={e => setForm(f => ({ ...f, mod_date: e.target.value }))} className="bg-input border-border" /></div>
              <div><Label className="text-muted-foreground">Cost (Rs.)</Label><Input type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="350" className="bg-input border-border font-mono" /></div>
            </div>
            <div>
              <Label className="text-muted-foreground">Wiring Notes / Technical Details</Label>
              <textarea
                value={form.wiring_notes}
                onChange={e => setForm(f => ({ ...f, wiring_notes: e.target.value }))}
                placeholder="Red wire → ACC fuse, Black → chassis ground..."
                className="mt-1 w-full rounded-md border border-border bg-input p-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Photo</Label>
              <input ref={fileRef} type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="w-full gap-2 border-border text-muted-foreground">
                <Camera className="h-4 w-4" />
                {selectedFile ? selectedFile.name : 'Choose photo...'}
              </Button>
            </div>
            <Button type="submit" disabled={addMod.isPending || updateMod.isPending || uploading} className="w-full gradient-amber text-primary-foreground font-semibold">
              {uploading ? 'Uploading...' : editingId ? (updateMod.isPending ? 'Saving...' : 'Save Changes') : (addMod.isPending ? 'Adding...' : 'Add Modification')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !mods?.length ? (
        <div className="glass-card flex flex-col items-center py-12 text-center">
          <Wrench className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">No modifications logged yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mods.map(mod => (
            <div key={mod.id} className="glass-card overflow-hidden">
              <div className="flex">
                {mod.photo_url && (
                  <img src={mod.photo_url} alt={mod.mod_name} className="h-28 w-28 shrink-0 object-cover" />
                )}
                <div className="flex flex-1 items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">{mod.mod_name}</span>
                    {mod.description && <p className="mt-0.5 text-xs text-muted-foreground">{mod.description}</p>}
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{format(new Date(mod.mod_date), 'MMM d, yyyy')}</span>
                      {mod.cost != null && <span className="font-mono text-primary">Rs. {mod.cost}</span>}
                    </div>
                    {mod.wiring_notes && (
                      <p className="mt-1.5 rounded bg-secondary/50 p-2 font-mono text-xs text-muted-foreground">
                        {mod.wiring_notes}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex shrink-0 gap-1">
                    <button onClick={() => openEdit(mod)} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteMod.mutate({ id: mod.id, vehicleId: vehicle.id })} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModificationsView;
