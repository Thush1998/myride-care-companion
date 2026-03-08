import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type Document = {
  id: string;
  vehicle_id: string;
  user_id: string;
  doc_type: string;
  doc_name: string;
  file_url: string | null;
  expiry_date: string | null;
  issue_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const useDocuments = (vehicleId: string | null) => {
  return useQuery({
    queryKey: ['documents', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('vehicle_id', vehicleId!)
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!vehicleId,
  });
};

export const useAddDocument = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (doc: {
      vehicle_id: string;
      doc_type: string;
      doc_name: string;
      file_url?: string;
      expiry_date?: string;
      issue_date?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('documents')
        .insert({ ...doc, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['documents', vars.vehicle_id] }),
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vehicleId, fileUrl }: { id: string; vehicleId: string; fileUrl?: string | null }) => {
      // Delete file from storage if exists
      if (fileUrl) {
        const path = fileUrl.split('/vehicle-documents/')[1];
        if (path) {
          await supabase.storage.from('vehicle-documents').remove([path]);
        }
      }
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: (vehicleId) => qc.invalidateQueries({ queryKey: ['documents', vehicleId] }),
  });
};
