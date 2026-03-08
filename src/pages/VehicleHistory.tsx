import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Calendar, DollarSign, Gauge } from 'lucide-react';
import driveDocLogo from '@/assets/drivedoc-logo.png';

const VehicleHistory = () => {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('v');
  const [vehicle, setVehicle] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vehicleId) { setError('No vehicle specified'); setLoading(false); return; }
    const load = async () => {
      const { data: v } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single();
      if (!v) { setError('Vehicle not found'); setLoading(false); return; }
      const { data: s } = await supabase.from('service_logs').select('*').eq('vehicle_id', vehicleId).order('service_date', { ascending: false });
      setVehicle(v);
      setServices(s || []);
      setLoading(false);
    };
    load();
  }, [vehicleId]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-background text-destructive">{error}</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <img src={driveDocLogo} alt="DriveDoc" className="h-10 w-10" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{vehicle.make} {vehicle.model}</h1>
            <p className="text-sm text-muted-foreground">{vehicle.year} · {vehicle.plate_no}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <Gauge className="mx-auto h-5 w-5 text-primary mb-1" />
            <div className="font-mono text-lg font-bold text-foreground">{Number(vehicle.current_odometer).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">km</div>
          </div>
          <div className="glass-card p-3 text-center">
            <Wrench className="mx-auto h-5 w-5 text-primary mb-1" />
            <div className="font-mono text-lg font-bold text-foreground">{services.length}</div>
            <div className="text-xs text-muted-foreground">Services</div>
          </div>
          <div className="glass-card p-3 text-center">
            <DollarSign className="mx-auto h-5 w-5 text-primary mb-1" />
            <div className="font-mono text-lg font-bold text-foreground">Rs. {services.reduce((s, l) => s + (l.price || 0), 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Spent</div>
          </div>
        </div>

        {/* Service History */}
        <div className="glass-card p-4">
          <h2 className="mb-4 text-lg font-bold text-foreground">Service History</h2>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No service records yet.</p>
          ) : (
            <div className="space-y-3">
              {services.map(s => (
                <div key={s.id} className="flex items-start justify-between rounded-lg bg-secondary/30 p-3">
                  <div>
                    <p className="font-semibold text-foreground">{s.part_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {s.service_date}
                      {s.brand_used && <span>· {s.brand_used}</span>}
                    </div>
                    {s.odometer_at_service && <p className="text-xs text-muted-foreground mt-1">{Number(s.odometer_at_service).toLocaleString()} km</p>}
                  </div>
                  {s.price != null && <span className="font-mono text-sm font-semibold text-primary">${s.price}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">Powered by AutoDoc</p>
      </div>
    </div>
  );
};

export default VehicleHistory;
