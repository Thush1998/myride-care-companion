
-- Add technical specs columns to vehicles
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS chassis_number text,
  ADD COLUMN IF NOT EXISTS engine_number text,
  ADD COLUMN IF NOT EXISTS paint_code text,
  ADD COLUMN IF NOT EXISTS oil_grade text,
  ADD COLUMN IF NOT EXISTS tire_pressure_psi numeric;

-- Add service_category to service_logs
ALTER TABLE public.service_logs
  ADD COLUMN IF NOT EXISTS service_category text NOT NULL DEFAULT 'routine';

-- Create modifications table
CREATE TABLE public.modifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mod_name text NOT NULL,
  description text,
  mod_date date NOT NULL DEFAULT CURRENT_DATE,
  cost numeric,
  wiring_notes text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own modifications" ON public.modifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own modifications" ON public.modifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own modifications" ON public.modifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own modifications" ON public.modifications FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for modification photos
INSERT INTO storage.buckets (id, name, public) VALUES ('modification-photos', 'modification-photos', true) ON CONFLICT DO NOTHING;

-- Storage policy for modification photos
CREATE POLICY "Users can upload modification photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'modification-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Public can view modification photos" ON storage.objects FOR SELECT USING (bucket_id = 'modification-photos');
CREATE POLICY "Users can delete own modification photos" ON storage.objects FOR DELETE USING (bucket_id = 'modification-photos' AND auth.role() = 'authenticated');
