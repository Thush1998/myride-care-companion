import { useState, useRef } from 'react';
import { FileText, Plus, Trash2, AlertTriangle, Upload, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDocuments, useAddDocument, useDeleteDocument } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { Vehicle } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

interface DocumentsViewProps {
  vehicle: Vehicle;
}

const DOC_TYPES = [
  { value: 'revenue_license', label: 'Revenue License' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'emission_test', label: 'Emission Test' },
  { value: 'other', label: 'Other' },
];

const DocumentsView = ({ vehicle }: DocumentsViewProps) => {
  const { user } = useAuth();
  const { data: docs, isLoading } = useDocuments(vehicle.id);
  const addDoc = useAddDocument();
  const deleteDoc = useDeleteDocument();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    doc_type: 'revenue_license', doc_name: '', expiry_date: '', issue_date: '', notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doc_name.trim()) { toast.error('Document name is required'); return; }

    let fileUrl: string | undefined;

    if (selectedFile && user) {
      setUploading(true);
      const ext = selectedFile.name.split('.').pop();
      const path = `${user.id}/${vehicle.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(path, selectedFile);
      if (uploadError) { toast.error('File upload failed'); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('vehicle-documents').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
      setUploading(false);
    }

    try {
      await addDoc.mutateAsync({
        vehicle_id: vehicle.id,
        doc_type: form.doc_type,
        doc_name: form.doc_name.trim(),
        file_url: fileUrl,
        expiry_date: form.expiry_date || undefined,
        issue_date: form.issue_date || undefined,
        notes: form.notes.trim() || undefined,
      });
      toast.success('Document added!');
      setOpen(false);
      setForm({ doc_type: 'revenue_license', doc_name: '', expiry_date: '', issue_date: '', notes: '' });
      setSelectedFile(null);
    } catch { toast.error('Failed to add document'); }
  };

  // Expiry warnings
  const expiringDocs = (docs || []).filter(d => {
    if (!d.expiry_date) return false;
    const daysLeft = differenceInDays(new Date(d.expiry_date), new Date());
    return daysLeft <= 30;
  });

  const getExpiryStatus = (expiryDate: string) => {
    const daysLeft = differenceInDays(new Date(expiryDate), new Date());
    if (daysLeft < 0) return { label: `Expired ${Math.abs(daysLeft)}d ago`, color: 'text-destructive bg-destructive/10' };
    if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: 'text-destructive bg-destructive/10' };
    if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'text-warning bg-warning/10' };
    return { label: `${daysLeft}d left`, color: 'text-success bg-success/10' };
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Documents</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-amber text-primary-foreground font-semibold">
              <Plus className="h-4 w-4" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Document Type</Label>
                <Select value={form.doc_type} onValueChange={(v) => setForm(f => ({ ...f, doc_type: v }))}>
                  <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">Document Name *</Label>
                <Input value={form.doc_name} onChange={(e) => setForm(f => ({ ...f, doc_name: e.target.value }))} placeholder="Insurance Policy 2026" className="bg-input border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Issue Date</Label>
                  <Input type="date" value={form.issue_date} onChange={(e) => setForm(f => ({ ...f, issue_date: e.target.value }))} className="bg-input border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <Input type="date" value={form.expiry_date} onChange={(e) => setForm(f => ({ ...f, expiry_date: e.target.value }))} className="bg-input border-border" />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Upload File (PDF/Image)</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="w-full gap-2 border-border text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  {selectedFile ? selectedFile.name : 'Choose file...'}
                </Button>
              </div>
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className="bg-input border-border" />
              </div>
              <Button type="submit" disabled={addDoc.isPending || uploading} className="w-full gradient-amber text-primary-foreground font-semibold">
                {uploading ? 'Uploading...' : addDoc.isPending ? 'Adding...' : 'Add Document'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expiry Alerts */}
      {expiringDocs.length > 0 && (
        <div className="glass-card border-warning/30 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" />
            Expiry Alerts
          </h3>
          <div className="space-y-2">
            {expiringDocs.map(d => {
              const status = getExpiryStatus(d.expiry_date!);
              return (
                <div key={d.id} className="flex items-center justify-between rounded-lg bg-warning/5 px-4 py-2">
                  <div>
                    <span className="text-sm font-medium text-foreground">{d.doc_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({DOC_TYPES.find(t => t.value === d.doc_type)?.label})</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.color}`}>{status.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document List */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !docs?.length ? (
        <div className="glass-card flex flex-col items-center py-12 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">No documents yet. Add your license, insurance, or emission test records.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const status = doc.expiry_date ? getExpiryStatus(doc.expiry_date) : null;
            return (
              <div key={doc.id} className="glass-card flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-semibold text-foreground">{doc.doc_name}</span>
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      {DOC_TYPES.find(t => t.value === doc.doc_type)?.label}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {doc.issue_date && <span>Issued: {format(new Date(doc.issue_date), 'MMM d, yyyy')}</span>}
                    {doc.expiry_date && (
                      <span className={status?.color}>Expires: {format(new Date(doc.expiry_date), 'MMM d, yyyy')} ({status?.label})</span>
                    )}
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> View File
                      </a>
                    )}
                  </div>
                  {doc.notes && <p className="mt-1 text-xs text-muted-foreground/70">{doc.notes}</p>}
                </div>
                <button
                  onClick={() => deleteDoc.mutate({ id: doc.id, vehicleId: vehicle.id, fileUrl: doc.file_url })}
                  className="ml-3 shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentsView;
