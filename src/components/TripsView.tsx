import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation, Play, Square, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Vehicle } from '@/hooks/useVehicles';
import { useTrips, useActiveTrip, useStartTrip, useEndTrip } from '@/hooks/useTrips';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TripsViewProps {
  vehicle: Vehicle;
}

const TripsView = ({ vehicle }: TripsViewProps) => {
  const { data: trips } = useTrips(vehicle.id);
  const { data: activeTrip } = useActiveTrip(vehicle.id);
  const startTrip = useStartTrip();
  const endTrip = useEndTrip();

  const [tracking, setTracking] = useState(false);
  const [distance, setDistance] = useState(0);
  const lastPosRef = useRef<GeolocationCoordinates | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const handleStartTrip = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    try {
      await startTrip.mutateAsync({ vehicleId: vehicle.id, startOdometer: vehicle.current_odometer });
      setTracking(true);
      setDistance(0);
      lastPosRef.current = null;
      toast.success('Trip started! GPS tracking active.');
    } catch { toast.error('Failed to start trip'); }
  };

  const handleStopTrip = useCallback(async () => {
    if (!activeTrip) return;
    const endOdo = vehicle.current_odometer + distance;
    try {
      await endTrip.mutateAsync({
        tripId: activeTrip.id,
        vehicleId: vehicle.id,
        distanceKm: parseFloat(distance.toFixed(2)),
        endOdometer: endOdo,
      });
      setTracking(false);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      toast.success(`Trip ended! ${distance.toFixed(2)} km traveled.`);
    } catch { toast.error('Failed to end trip'); }
  }, [activeTrip, distance, endTrip, vehicle]);

  // GPS watcher
  useEffect(() => {
    if (!tracking || !activeTrip) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (lastPosRef.current) {
          const d = haversine(
            lastPosRef.current.latitude, lastPosRef.current.longitude,
            pos.coords.latitude, pos.coords.longitude
          );
          if (d > 0.005) { // min 5m to avoid jitter
            setDistance((prev) => prev + d);
          }
        }
        lastPosRef.current = pos.coords;
      },
      () => toast.error('GPS error'),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    watchIdRef.current = id;

    return () => {
      navigator.geolocation.clearWatch(id);
      watchIdRef.current = null;
    };
  }, [tracking, activeTrip]);

  // Sync active trip state
  useEffect(() => {
    if (activeTrip && !tracking) setTracking(true);
  }, [activeTrip, tracking]);

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-xl font-bold text-foreground">GPS Tracking</h2>

      {/* Active Trip */}
      <div className={`glass-card p-6 ${tracking ? 'animate-pulse-glow border-primary/30' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
              {tracking ? 'Trip in Progress' : 'Start a Trip'}
            </h3>
            {tracking && (
              <div className="mt-2">
                <span className="font-mono text-4xl font-bold text-primary">{distance.toFixed(2)}</span>
                <span className="ml-2 text-muted-foreground">km</span>
              </div>
            )}
          </div>
          {tracking ? (
            <Button onClick={handleStopTrip} disabled={endTrip.isPending} variant="destructive" className="gap-2 font-semibold">
              <Square className="h-4 w-4" /> Stop Trip
            </Button>
          ) : (
            <Button onClick={handleStartTrip} disabled={startTrip.isPending} className="gap-2 gradient-amber text-primary-foreground font-semibold">
              <Play className="h-4 w-4" /> Start Trip
            </Button>
          )}
        </div>
        {tracking && (
          <p className="mt-2 text-xs text-muted-foreground">
            <MapPin className="mr-1 inline h-3 w-3" />
            GPS is actively tracking your location. Odometer will auto-update when trip ends.
          </p>
        )}
      </div>

      {/* Trip History */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Recent Trips</h3>
        {!trips?.length ? (
          <div className="glass-card py-8 text-center text-muted-foreground">No trips recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {trips.filter(t => !t.is_active).map((trip) => (
              <div key={trip.id} className="glass-card flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Navigation className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-mono text-sm font-semibold text-foreground">{trip.distance_km.toFixed(2)} km</span>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(trip.start_time), 'MMM d, yyyy HH:mm')}
                      {trip.end_time && ` → ${format(new Date(trip.end_time), 'HH:mm')}`}
                    </p>
                  </div>
                </div>
                {trip.start_odometer != null && trip.end_odometer != null && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {trip.start_odometer.toLocaleString()} → {trip.end_odometer.toLocaleString()} km
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Haversine distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default TripsView;
