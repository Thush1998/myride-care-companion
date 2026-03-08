
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate_no TEXT NOT NULL,
  color TEXT,
  current_odometer NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service logs table
CREATE TABLE public.service_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  part_number TEXT,
  location_shop TEXT,
  price NUMERIC,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  odometer_at_service NUMERIC,
  replacement_interval_km NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own service_logs" ON public.service_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own service_logs" ON public.service_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own service_logs" ON public.service_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own service_logs" ON public.service_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_service_logs_updated_at BEFORE UPDATE ON public.service_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trips table for GPS tracking
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  distance_km NUMERIC NOT NULL DEFAULT 0,
  start_odometer NUMERIC,
  end_odometer NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trips" ON public.trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
