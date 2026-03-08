import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Wrench, Calendar, DollarSign, Gauge, Phone, ChevronRight, CalendarClock, Image as ImageIcon } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import driveDocLogo from '@/assets/drivedoc-logo.png';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const TRACKED_PARTS = [
  { key: 'engine oil', label: 'Engine Oil', defaultInterval: 5000, timeIntervalDays: 180 },
  { key: 'brake pad', label: 'Brake Pads', defaultInterval: 40000, timeIntervalDays: 730 },
  { key: 'timing belt', label: 'Timing Belt', defaultInterval: 100000, timeIntervalDays: 1825 },
  { key: 'gear oil', label: 'Gear Oil', defaultInterval: 40000, timeIntervalDays: 730 },
  { key: 'tire', label: 'Tires', defaultInterval: 50000, timeIntervalDays: 1095 },
  { key: 'air filter', label: 'Air Filter', defaultInterval: 20000, timeIntervalDays: 365 },
];

/* ─── Mini Health Ring (read-only) ─── */
const MiniRing = ({ percent, label, hasData }: { percent: number; label: string; hasData: boolean }) => {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const healthPct = hasData ? Math.max(0, Math.round(100 - percent)) : -1;
  const offset = hasData ? circ - (Math.min(Math.max(0, 100 - percent), 100) / 100) * circ : circ;
  const isCritical = hasData && healthPct < 20;
  const isNotLogged = !hasData;

  let stroke = 'hsl(var(--success))';
  if (hasData && percent >= 100) stroke = 'hsl(var(--destructive))';
  else if (hasData && percent >= 80) stroke = 'hsl(var(--accent))';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
          <circle cx="34" cy="34" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" />
          {!isNotLogged && (
            <circle cx="34" cy="34" r={r} fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-700" />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isNotLogged ? (
            <span className="font-mono text-[9px] text-muted-foreground">N/A</span>
          ) : (
            <span className={`font-mono text-sm font-bold ${isCritical ? 'text-destructive' : 'text-foreground'}`}>{healthPct}%</span>
          )}
        </div>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{label}</span>
      {isNotLogged && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] text-muted-foreground">Not Logged</span>}
      {isCritical && <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[8px] font-bold text-destructive">⚠ CRITICAL</span>}
    </div>
  );
};

const VehicleHistory = () => {
  const [searchParams] = useSearchParams();
  const { vehicleId: routeVehicleId } = useParams<{ vehicleId: string }>();
  const vehicleId = routeVehicleId || searchParams.get('v');
  const contactPhone = searchParams.get('phone');
  const [vehicle, setVehicle] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [mods, setMods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) { setError('No vehicle specified'); setLoading(false); return; }
    const load = async () => {
      try {
        const backendUrl = 'https://vpgebrgwuneqgrprhoxg.supabase.co';
        const endpoint = `${backendUrl}/functions/v1/public-vehicle?id=${encodeURIComponent(vehicleId)}`;
        const res = await fetch(endpoint);

        if (!res.ok) {
          if (res.status === 404) {
            setError('Vehicle not found');
          } else {
            setError('Failed to load vehicle data');
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
      setLoading(false);
    };
    load();
  }, [vehicleId]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-background text-foreground font-mono text-sm">Loading vehicle profile...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-background text-destructive">{error}</div>;

  /* ─── Compute health data ─── */
  const allOdos = services.filter((s: any) => s.odometer_at_service > 0).sort((a: any, b: any) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime());
  let avgDailyKm = 30;
  if (allOdos.length >= 2) {
    const days = differenceInDays(new Date(allOdos[allOdos.length - 1].service_date), new Date(allOdos[0].service_date));
    const km = (allOdos[allOdos.length - 1].odometer_at_service || 0) - (allOdos[0].odometer_at_service || 0);
    if (days > 0 && km > 0) avgDailyKm = km / days;
  }

  const healthParts = TRACKED_PARTS.map(tp => {
    const matching = services.filter((s: any) => s.part_name.toLowerCase().includes(tp.key)).sort((a: any, b: any) => (b.odometer_at_service || 0) - (a.odometer_at_service || 0));
    const latest = matching[0];
    const interval = latest?.replacement_interval_km || tp.defaultInterval;
    const lastOdo = latest?.odometer_at_service || 0;
    const kmSince = vehicle.current_odometer - lastOdo;
    let timePercent = 0;
    if (latest) { timePercent = (differenceInDays(new Date(), new Date(latest.service_date)) / tp.timeIntervalDays) * 100; }
    const mileagePercent = lastOdo > 0 ? (kmSince / interval) * 100 : 100;
    const usedPercent = Math.max(mileagePercent, timePercent);
    return { ...tp, usedPercent, hasData: lastOdo > 0 };
  });

  /* ─── Maintenance forecast ─── */
  const forecasts = TRACKED_PARTS.map(tp => {
    const matching = services.filter((s: any) => s.part_name.toLowerCase().includes(tp.key)).sort((a: any, b: any) => (b.odometer_at_service || 0) - (a.odometer_at_service || 0));
    const latest = matching[0];
    if (!latest?.odometer_at_service) return null;
    const interval = latest.replacement_interval_km || tp.defaultInterval;
    const kmRemaining = Math.max(0, (latest.odometer_at_service + interval) - vehicle.current_odometer);
    const isOverdue = kmRemaining <= 0;
    const daysSince = differenceInDays(new Date(), new Date(latest.service_date));
    const timeDaysRemaining = Math.max(0, tp.timeIntervalDays - daysSince);
    const daysRemaining = isOverdue ? 0 : Math.min(avgDailyKm > 0 ? Math.ceil(kmRemaining / avgDailyKm) : 999, timeDaysRemaining);
    return { label: tp.key === 'engine oil' ? 'Oil Change' : tp.label, kmRemaining, daysRemaining, isOverdue };
  }).filter(Boolean) as any[];
  forecasts.sort((a: any, b: any) => a.daysRemaining - b.daysRemaining);
  const nextService = forecasts[0];

  /* ─── Photo gallery ─── */
  const photos: { url: string; caption: string }[] = [];
  if (vehicle.image_url) photos.push({ url: vehicle.image_url, caption: `${vehicle.make} ${vehicle.model}` });
  mods.forEach((m: any) => { if (m.photo_url) photos.push({ url: m.photo_url, caption: m.mod_name }); });

  const totalSpent = services.reduce((s: number, l: any) => s + (l.price || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border/30 bg-card/60 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <img src={driveDocLogo} alt="DriveDoc" className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{vehicle.make} {vehicle.model}</h1>
            <p className="text-sm text-muted-foreground">{vehicle.year} · {vehicle.plate_no}
              {vehicle.color && <span> · {vehicle.color}</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
        {/* Next service alert */}
        {nextService && (
          <div className={`rounded-xl p-4 ${nextService.isOverdue ? 'bg-destructive/10 border border-destructive/30' : 'bg-primary/5 border border-primary/20'}`}>
            <div className="flex items-center gap-3">
              <CalendarClock className={`h-5 w-5 shrink-0 ${nextService.isOverdue ? 'text-destructive' : 'text-primary'}`} />
              <div>
                <p className={`text-sm font-semibold ${nextService.isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                  {nextService.isOverdue ? `${nextService.label} — Service Overdue!` : `Next: ${nextService.label}`}
                </p>
                {!nextService.isOverdue && (
                  <p className="text-xs text-muted-foreground">
                    {nextService.kmRemaining.toLocaleString()} km remaining · ~{nextService.daysRemaining} days
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
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
            <div className="font-mono text-base font-bold text-foreground">Rs. {totalSpent.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Spent</div>
          </div>
        </div>

        {/* Component Health Rings */}
        <div className="glass-card p-4">
          <h2 className="mb-3 text-xs font-bold tracking-wider text-primary uppercase">Component Health</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {healthParts.map(p => (
              <MiniRing key={p.key} percent={p.usedPercent} label={p.label} hasData={p.hasData} />
            ))}
          </div>
        </div>

        {/* Maintenance Forecast */}
        {forecasts.length > 0 && (
          <div className="glass-card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase">
              <CalendarClock className="h-4 w-4" /> Maintenance Forecast
            </h2>
            <div className="space-y-2">
              {forecasts.slice(0, 4).map((f: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`h-3.5 w-3.5 ${f.isOverdue ? 'text-destructive' : 'text-primary'}`} />
                    <div>
                      <span className="text-sm font-medium text-foreground">{f.label}</span>
                      <p className={`text-xs ${f.isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        {f.isOverdue ? 'Service overdue!' : `${f.kmRemaining.toLocaleString()} km remaining`}
                      </p>
                    </div>
                  </div>
                  {f.isOverdue ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">OVERDUE</span>
                  ) : (
                    <div className="text-right">
                      <span className="font-mono text-lg font-bold text-primary">{f.daysRemaining}</span>
                      <span className="ml-1 text-xs text-muted-foreground">days</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <div className="glass-card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase">
              <ImageIcon className="h-4 w-4" /> Photo Gallery
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setLightboxImg(p.url)} className="group relative aspect-square overflow-hidden rounded-lg bg-secondary">
                  <img src={p.url} alt={p.caption} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <span className="text-[10px] font-medium text-white">{p.caption}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image lightbox */}
        <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
          <DialogContent className="max-w-lg bg-card border-border p-2">
            {lightboxImg && <img src={lightboxImg} alt="Vehicle photo" className="w-full rounded-lg object-contain" />}
          </DialogContent>
        </Dialog>

        {/* Service History */}
        <div className="glass-card p-4">
          <h2 className="mb-3 text-xs font-bold tracking-wider text-primary uppercase">Service History</h2>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No service records yet.</p>
          ) : (
            <div className="space-y-2">
              {services.map((s: any) => (
                <div key={s.id} className="flex items-start justify-between rounded-lg bg-secondary/30 p-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm">{s.part_name}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{s.service_date}</span>
                      {s.brand_used && <span>· {s.brand_used}</span>}
                      {s.location_shop && <span>· {s.location_shop}</span>}
                    </div>
                    {s.odometer_at_service && <p className="text-xs text-muted-foreground mt-0.5">{Number(s.odometer_at_service).toLocaleString()} km</p>}
                    {s.notes && <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{s.notes}</p>}
                  </div>
                  {s.price != null && <span className="ml-2 shrink-0 font-mono text-sm font-semibold text-primary">Rs. {s.price}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modifications */}
        {mods.length > 0 && (
          <div className="glass-card p-4">
            <h2 className="mb-3 text-xs font-bold tracking-wider text-primary uppercase">Modifications & Upgrades</h2>
            <div className="space-y-2">
              {mods.map((m: any) => (
                <div key={m.id} className="flex overflow-hidden rounded-lg bg-secondary/30">
                  {m.photo_url && (
                    <button onClick={() => setLightboxImg(m.photo_url)} className="shrink-0">
                      <img src={m.photo_url} alt={m.mod_name} className="h-20 w-20 object-cover" />
                    </button>
                  )}
                  <div className="p-3 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{m.mod_name}</p>
                    {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-1">
                      <span>{format(new Date(m.mod_date), 'MMM d, yyyy')}</span>
                      {m.cost != null && <span className="font-mono text-primary">Rs. {m.cost}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle Specs */}
        {(vehicle.chassis_number || vehicle.engine_number || vehicle.oil_grade || vehicle.paint_code) && (
          <div className="glass-card p-4">
            <h2 className="mb-3 text-xs font-bold tracking-wider text-primary uppercase">Vehicle Specs</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {vehicle.chassis_number && <div><span className="text-muted-foreground">Chassis:</span> <span className="font-mono text-foreground">{vehicle.chassis_number}</span></div>}
              {vehicle.engine_number && <div><span className="text-muted-foreground">Engine:</span> <span className="font-mono text-foreground">{vehicle.engine_number}</span></div>}
              {vehicle.oil_grade && <div><span className="text-muted-foreground">Oil Grade:</span> <span className="font-mono text-foreground">{vehicle.oil_grade}</span></div>}
              {vehicle.paint_code && <div><span className="text-muted-foreground">Paint Code:</span> <span className="font-mono text-foreground">{vehicle.paint_code}</span></div>}
              {vehicle.tire_pressure_psi && <div><span className="text-muted-foreground">Tire PSI:</span> <span className="font-mono text-foreground">{vehicle.tire_pressure_psi}</span></div>}
            </div>
          </div>
        )}

        {/* Contact Owner */}
        {contactPhone && (
          <a href={`tel:${contactPhone}`} className="flex items-center justify-center gap-2 rounded-xl bg-primary p-4 text-primary-foreground font-semibold transition-opacity hover:opacity-90">
            <Phone className="h-5 w-5" />
            Contact Owner
          </a>
        )}

        <p className="pb-4 text-center text-xs text-muted-foreground/60">Powered by AutoDoc · Data synced in real-time</p>
      </div>
    </div>
  );
};

export default VehicleHistory;
