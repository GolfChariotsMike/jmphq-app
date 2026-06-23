-- Add journey_policies JSONB column to organisations
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS journey_policies jsonb NOT NULL DEFAULT '{
  "country": "AU",
  "max_continuous_drive_hours": 5,
  "min_break_minutes": 20,
  "min_consecutive_break_minutes": 10,
  "max_daily_drive_hours": 10,
  "jmp_required_km": 300,
  "jmp_required_unsealed": true,
  "jmp_required_adverse_weather": true,
  "min_water_litres": 10,
  "checkin_interval_hours": 3
}'::jsonb;
