-- Add structured location fields to vehicles for geo-based filtering
ALTER TABLE vehicles
  ADD COLUMN location_country TEXT,
  ADD COLUMN location_province TEXT,
  ADD COLUMN location_region TEXT;

COMMENT ON COLUMN vehicles.location_country IS 'ISO 3166-1 alpha-2 code (ES, FR, DE...)';
COMMENT ON COLUMN vehicles.location_province IS 'Spanish province name, NULL for non-Spain';
COMMENT ON COLUMN vehicles.location_region IS 'Spanish autonomous community, NULL for non-Spain';

CREATE INDEX idx_vehicles_location_country ON vehicles(location_country);
CREATE INDEX idx_vehicles_location_province ON vehicles(location_province);
CREATE INDEX idx_vehicles_location_region ON vehicles(location_region);
