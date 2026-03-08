import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SparePart = {
  id: string;
  vehicle_id: string;
  user_id: string;
  part_name: string;
  part_number: string | null;
  brand: string | null;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const db = supabase as any;

export const useSpareParts = (vehicleId: string | null) => {
  return useQuery({
    queryKey: ['spare_parts', vehicleId],
    queryFn: async () => {
      const { data, error } = await db
        .from('spare_parts')
        .select('*')
        .eq('vehicle_id', vehicleId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SparePart[];
    },
    enabled: !!vehicleId,
  });
};

export const useAddSparePart = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (part: { vehicle_id: string; part_name: string; part_number?: string; brand?: string; quantity: number; notes?: string }) => {
      const { data, error } = await db
        .from('spare_parts')
        .insert({ ...part, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: any, vars: any) => qc.invalidateQueries({ queryKey: ['spare_parts', vars.vehicle_id] }),
  });
};

export const useUpdateSparePart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId, ...updates }: { id: string; vehicleId: string; quantity?: number; notes?: string }) => {
      const { error } = await db.from('spare_parts').update(updates).eq('id', id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId: string) => qc.invalidateQueries({ queryKey: ['spare_parts', vehicleId] }),
  });
};

export const useDeleteSparePart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      const { error } = await db.from('spare_parts').delete().eq('id', id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId: string) => qc.invalidateQueries({ queryKey: ['spare_parts', vehicleId] }),
  });
};
