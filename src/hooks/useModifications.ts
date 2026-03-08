import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type Modification = {
  id: string;
  vehicle_id: string;
  user_id: string;
  mod_name: string;
  description: string | null;
  mod_date: string;
  cost: number | null;
  wiring_notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

const db = supabase as any;

export const useModifications = (vehicleId: string | null) => {
  return useQuery({
    queryKey: ['modifications', vehicleId],
    queryFn: async () => {
      const { data, error } = await db
        .from('modifications')
        .select('*')
        .eq('vehicle_id', vehicleId!)
        .order('mod_date', { ascending: false });
      if (error) throw error;
      return data as Modification[];
    },
    enabled: !!vehicleId,
  });
};

export const useAddModification = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (mod: {
      vehicle_id: string; mod_name: string; description?: string;
      mod_date: string; cost?: number; wiring_notes?: string; photo_url?: string;
    }) => {
      const { data, error } = await db
        .from('modifications')
        .insert({ ...mod, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: any, vars: any) => qc.invalidateQueries({ queryKey: ['modifications', vars.vehicle_id] }),
  });
};

export const useUpdateModification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId, ...updates }: {
      id: string; vehicleId: string; mod_name?: string; description?: string | null;
      mod_date?: string; cost?: number | null; wiring_notes?: string | null; photo_url?: string | null;
    }) => {
      const { error } = await db.from('modifications').update(updates).eq('id', id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId: string) => qc.invalidateQueries({ queryKey: ['modifications', vehicleId] }),
  });
};

export const useDeleteModification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      const { error } = await db.from('modifications').delete().eq('id', id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId: string) => qc.invalidateQueries({ queryKey: ['modifications', vehicleId] }),
  });
};
