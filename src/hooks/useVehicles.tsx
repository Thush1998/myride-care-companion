import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type Vehicle = {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  plate_no: string;
  color: string | null;
  current_odometer: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export const useVehicles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vehicles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!user,
  });
};

export const useAddVehicle = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (vehicle: { make: string; model: string; year: number; plate_no: string; color?: string }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({ ...vehicle, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
};

export const useDeleteVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
};

export const useUpdateOdometer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, odometer }: { id: string; odometer: number }) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ current_odometer: odometer })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
};
