import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type Trip = {
  id: string;
  vehicle_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  distance_km: number;
  start_odometer: number | null;
  end_odometer: number | null;
  is_active: boolean;
  created_at: string;
};

export const useTrips = (vehicleId: string | null) => {
  return useQuery({
    queryKey: ['trips', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('vehicle_id', vehicleId!)
        .order('start_time', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as Trip[];
    },
    enabled: !!vehicleId,
  });
};

export const useActiveTrip = (vehicleId: string | null) => {
  return useQuery({
    queryKey: ['active_trip', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('vehicle_id', vehicleId!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as Trip | null;
    },
    enabled: !!vehicleId,
    refetchInterval: 5000,
  });
};

export const useStartTrip = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ vehicleId, startOdometer }: { vehicleId: string; startOdometer: number }) => {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          vehicle_id: vehicleId,
          user_id: user!.id,
          start_odometer: startOdometer,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['trips', vars.vehicleId] });
      qc.invalidateQueries({ queryKey: ['active_trip', vars.vehicleId] });
    },
  });
};

export const useEndTrip = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, vehicleId, distanceKm, endOdometer }: {
      tripId: string;
      vehicleId: string;
      distanceKm: number;
      endOdometer: number;
    }) => {
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          is_active: false,
          end_time: new Date().toISOString(),
          distance_km: distanceKm,
          end_odometer: endOdometer,
        })
        .eq('id', tripId);
      if (tripError) throw tripError;

      const { error: vehError } = await supabase
        .from('vehicles')
        .update({ current_odometer: endOdometer })
        .eq('id', vehicleId);
      if (vehError) throw vehError;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['trips', vars.vehicleId] });
      qc.invalidateQueries({ queryKey: ['active_trip', vars.vehicleId] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};
