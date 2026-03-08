import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Printer, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface VehicleQRCodeProps {
  vehicleId: string;
  vehicleName: string;
  plateNo: string;
}

const VehicleQRCode = ({ vehicleId, vehicleName, plateNo }: VehicleQRCodeProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState('');
  
  const PRODUCTION_URL = 'https://myride-care-companion.lovable.app';
  const baseUrl = `${PRODUCTION_URL}/history?v=${vehicleId}`;
  const url = phone.trim() ? `${baseUrl}&phone=${encodeURIComponent(phone.trim())}` : baseUrl;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>AutoDoc QR – ${plateNo}</title>
      <style>
        body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; background: #fff; }
        .card { text-align: center; padding: 24px; border: 2px solid #0ee; border-radius: 12px; }
        .card h2 { margin: 12px 0 4px; font-size: 18px; }
        .card p { margin: 0; color: #666; font-size: 12px; }
        .card small { display: block; margin-top: 12px; color: #999; font-size: 10px; }
      </style></head><body>
      <div class="card">${content.innerHTML}</div>
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-border text-muted-foreground">
          <QrCode className="h-4 w-4" /> QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">Engine Bay QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={printRef} className="flex flex-col items-center gap-3">
            <QRCodeSVG value={url} size={200} bgColor="transparent" fgColor="hsl(var(--primary))" level="H" />
            <h2 className="text-lg font-bold text-foreground">{vehicleName}</h2>
            <p className="text-sm text-muted-foreground">{plateNo}</p>
            <small className="text-xs text-muted-foreground/60">Scan to view service history · AutoDoc</small>
          </div>
          
          <div className="w-full space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> Contact number (optional)
            </Label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+94 77 123 4567"
              className="bg-input border-border font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground/60">Adds a "Contact Owner" button to the public profile.</p>
          </div>

          <p className="text-xs text-center text-muted-foreground">Print and stick inside your engine bay. Anyone who scans it will see this vehicle's full service history.</p>
          <Button onClick={handlePrint} className="w-full gap-2 gradient-cyan text-primary-foreground font-semibold">
            <Printer className="h-4 w-4" /> Print QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleQRCode;
