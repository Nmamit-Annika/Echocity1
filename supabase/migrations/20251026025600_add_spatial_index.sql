-- Enable PostGIS extension if not enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add point geometry column
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS location_geom geometry(Point, 4326);

-- Update existing rows (if any)
UPDATE public.complaints
SET location_geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE location_geom IS NULL;

-- Create function to check for nearby complaints
CREATE OR REPLACE FUNCTION public.check_nearby_complaints(
  _latitude DECIMAL,
  _longitude DECIMAL,
  _category_id UUID,
  _radius_meters INTEGER DEFAULT 100, -- Default 100m radius
  _time_window_hours INTEGER DEFAULT 24 -- Default 24 hour window
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  status TEXT,
  distance_meters DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.title,
    c.status,
    ST_Distance(
      c.location_geom,
      ST_SetSRID(ST_MakePoint(_longitude, _latitude), 4326)::geography
    ) as distance_meters,
    c.created_at
  FROM complaints c
  WHERE 
    c.category_id = _category_id
    AND c.created_at >= NOW() - (_time_window_hours || ' hours')::INTERVAL
    AND ST_DWithin(
      c.location_geom::geography,
      ST_SetSRID(ST_MakePoint(_longitude, _latitude), 4326)::geography,
      _radius_meters
    )
  ORDER BY c.created_at DESC;
$$;

-- Create trigger to automatically update geometry
CREATE OR REPLACE FUNCTION public.update_complaint_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location_geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_complaint_geom
  BEFORE INSERT OR UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_complaint_geom();