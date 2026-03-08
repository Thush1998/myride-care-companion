import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type FuelLog = {
  id: string;
  vehicle_id: string;
  user_id: string;
  fuel_date: string;
  liters: number;
  price_per_liter: number | null;
  total_cost: number | null;
  odometer_at_fill: number | null;
  fuel_type: string | null;
  station: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const useFuelLogs = (vehicleId: string | null) => {
  return useQuery({
    queryKey: ['fuel_logs', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('*')
        .eq('vehicle_id', vehicleId!)
        .order('fuel_date', { ascending: false });
      if (error) throw error;
      return data as FuelLog[];
    },
    enabled: !!vehicleId,
  });
};

export const useAddFuelLog = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (log: {
      vehicle_id: string;
      liters: number;
      fuel_date: string;
      price_per_liter?: number;
      total_cost?: number;
      odometer_at_fill?: number;
      fuel_type?: string;
      station?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .insert({ ...log, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['fuel_logs', vars.vehicle_id] }),
  });
};

export const useDeleteFuelLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      const { error } = await supabase.from('fuel_logs').delete().eq('id', id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId) => qc.invalidateQueries({ queryKey: ['fuel_logs', vehicleId] }),
  });
};
