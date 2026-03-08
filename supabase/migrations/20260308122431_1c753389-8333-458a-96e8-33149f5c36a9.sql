
ALTER TABLE public.vehicles
  ADD COLUMN engine_oil_capacity text,
  ADD COLUMN coolant_capacity text,
  ADD COLUMN gear_oil_capacity text,
  ADD COLUMN brake_fluid_capacity text,
  ADD COLUMN power_steering_fluid text,
  ADD COLUMN wheel_nut_torque text,
  ADD COLUMN cylinder_head_torque text;
