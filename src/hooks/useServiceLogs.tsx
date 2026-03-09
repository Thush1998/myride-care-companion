import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ServiceLog = {
  id: string;
  vehicle_id: string;
  user_id: string;
  part_name: string;
  part_number: string | null;
  location_shop: string | null;
  price: number | null;
  service_date: string;
  odometer_at_service: number | null;
  replacement_interval_km: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const useServiceLogs = (vehicleId: string | null) => {
  return useQuery({
    queryKey: ['service_logs', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_logs')
        .select('*')
        .eq('vehicle_id', vehicleId!)
        .order('service_date', { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceLog[];
    },
    enabled: !!vehicleId,
  });
};

export const useAddServiceLog = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (log: {
      vehicle_id: string;
      part_name: string;
      part_number?: string;
      location_shop?: string;
      price?: number;
      service_date: string;
      odometer_at_service?: number;
      replacement_interval_km?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('service_logs')
        .insert({ ...log, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['service_logs', vars.vehicle_id] }),
  });
};

export const useUpdateServiceLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId, ...updates }: {
      id: string; vehicleId: string;
      part_name?: string; part_number?: string | null; location_shop?: string | null;
      price?: number | null; service_date?: string; odometer_at_service?: number | null;
      replacement_interval_km?: number | null; notes?: string | null;
    }) => {
      const { error } = await supabase.from('service_logs').update(updates).eq('id', id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId) => qc.invalidateQueries({ queryKey: ['service_logs', vehicleId] }),
  });
};

export const useDeleteServiceLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      const { error } = await supabase.from('service_logs').delete().eq('id', id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId) => qc.invalidateQueries({ queryKey: ['service_logs', vehicleId] }),
  });
};
