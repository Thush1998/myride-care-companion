
ALTER TABLE public.service_logs ADD COLUMN IF NOT EXISTS brand_used text;

CREATE TABLE public.spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  part_name text NOT NULL,
  part_number text,
  brand text,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spare_parts" ON public.spare_parts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spare_parts" ON public.spare_parts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spare_parts" ON public.spare_parts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spare_parts" ON public.spare_parts FOR DELETE USING (auth.uid() = user_id);
