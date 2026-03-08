import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddVehicle } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Car } from 'lucide-react';

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddVehicleDialog = ({ open, onOpenChange }: AddVehicleDialogProps) => {
  const { user } = useAuth();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNo, setPlateNo] = useState('');
  const [color, setColor] = useState('');
  const [nickname, setNickname] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addVehicle = useAddVehicle();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !year || !plateNo.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    let imageUrl: string | undefined;

    if (imageFile && user) {
      setUploading(true);
      const ext = imageFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(path, imageFile);
      if (uploadError) {
        toast.error('Image upload failed');
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('vehicle-images').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
      setUploading(false);
    }

    try {
      await addVehicle.mutateAsync({
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        plate_no: plateNo.trim(),
        color: color.trim() || undefined,
        nickname: nickname.trim() || undefined,
        image_url: imageUrl,
      });
      toast.success('Vehicle added!');
      onOpenChange(false);
      setMake(''); setModel(''); setYear(''); setPlateNo(''); setColor(''); setNickname('');
      setImageFile(null); setImagePreview(null);
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
          {/* Image Upload */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary/50"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Add Photo</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <div>
            <Label className="text-muted-foreground">Nickname</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="My Beast 🔥" className="bg-input border-border" />
          </div>

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
          <Button type="submit" disabled={addVehicle.isPending || uploading} className="w-full gradient-amber text-primary-foreground font-semibold">
            {uploading ? 'Uploading...' : addVehicle.isPending ? 'Adding...' : 'Add Vehicle'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;
