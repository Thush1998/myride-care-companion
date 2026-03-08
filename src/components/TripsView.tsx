import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation, Play, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Vehicle } from '@/hooks/useVehicles';
import { useTrips, useActiveTrip, useStartTrip, useEndTrip } from '@/hooks/useTrips';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ActiveTripDashboard from './ActiveTripDashboard';

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
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [speedSamples, setSpeedSamples] = useState<number[]>([]);
  const lastPosRef = useRef<{ coords: GeolocationCoordinates; timestamp: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const avgSpeed = speedSamples.length > 0
    ? speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length
    : 0;

  const handleStartTrip = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    try {
      await startTrip.mutateAsync({ vehicleId: vehicle.id, startOdometer: vehicle.current_odometer });
      setTracking(true);
      setDistance(0);
      setCurrentSpeed(0);
      setMaxSpeed(0);
      setSpeedSamples([]);
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
      setCurrentSpeed(0);
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
        const now = pos.timestamp;

        if (lastPosRef.current) {
          const d = haversine(
            lastPosRef.current.coords.latitude, lastPosRef.current.coords.longitude,
            pos.coords.latitude, pos.coords.longitude
          );

          // Calculate speed from GPS (pos.coords.speed or manual)
          let speedKmh = 0;
          if (pos.coords.speed != null && pos.coords.speed >= 0) {
            speedKmh = pos.coords.speed * 3.6; // m/s to km/h
          } else {
            const dtHours = (now - lastPosRef.current.timestamp) / 3600000;
            if (dtHours > 0) speedKmh = d / dtHours;
          }

          if (d > 0.005) { // min 5m to avoid jitter
            setDistance((prev) => prev + d);
          }

          setCurrentSpeed(speedKmh);
          setMaxSpeed((prev) => Math.max(prev, speedKmh));
          if (speedKmh > 0.5) {
            setSpeedSamples((prev) => [...prev.slice(-500), speedKmh]);
          }
        }
        lastPosRef.current = { coords: pos.coords, timestamp: now };
      },
      () => toast.error('GPS error'),
      { enableHighAccuracy: true, maximumAge: 3000 }
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

  // Show full-screen dashboard when trip is active
  if (tracking && activeTrip) {
    return (
      <ActiveTripDashboard
        vehicle={vehicle}
        activeTrip={activeTrip}
        onStopTrip={handleStopTrip}
        isEnding={endTrip.isPending}
        distance={distance}
        currentSpeed={currentSpeed}
        maxSpeed={maxSpeed}
        avgSpeed={avgSpeed}
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-xl font-bold text-foreground">GPS Tracking</h2>

      {/* Start Trip */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Start a Trip</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <MapPin className="mr-1 inline h-3 w-3" />
              GPS will track your route, speed and distance.
            </p>
          </div>
          <Button onClick={handleStartTrip} disabled={startTrip.isPending} className="gap-2 gradient-amber text-primary-foreground font-semibold">
            <Play className="h-4 w-4" /> Start Trip
          </Button>
        </div>
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
