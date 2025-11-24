-- COMPREHENSIVE SCHEMA FIX AND DATA UPDATE
-- This will ensure everything works properly

-- First, ensure the complaints table has all the right columns
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Check what columns we now have
SELECT 'Updated complaints table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'complaints' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Update existing complaints to have coordinates and addresses
-- This will add locations to any complaints that don't have them
UPDATE complaints 
SET 
    location_lat = CASE 
        WHEN title ILIKE '%pothole%' OR title ILIKE '%road%' THEN 19.0596
        WHEN title ILIKE '%traffic%' THEN 19.0544  
        WHEN title ILIKE '%garbage%' OR title ILIKE '%waste%' THEN 19.0728
        WHEN title ILIKE '%water%' THEN 19.0892
        WHEN title ILIKE '%light%' THEN 19.0411
        WHEN title ILIKE '%park%' THEN 19.1075
        WHEN title ILIKE '%noise%' THEN 19.0330
        WHEN title ILIKE '%bus%' OR title ILIKE '%transport%' THEN 19.0895
        ELSE 19.0760 -- Default Mumbai center
    END,
    location_lng = CASE 
        WHEN title ILIKE '%pothole%' OR title ILIKE '%road%' THEN 72.8295
        WHEN title ILIKE '%traffic%' THEN 72.8265
        WHEN title ILIKE '%garbage%' OR title ILIKE '%waste%' THEN 72.8826
        WHEN title ILIKE '%water%' THEN 72.8346
        WHEN title ILIKE '%light%' THEN 72.8661
        WHEN title ILIKE '%park%' THEN 72.8263
        WHEN title ILIKE '%noise%' THEN 72.8570
        WHEN title ILIKE '%bus%' OR title ILIKE '%transport%' THEN 72.8656
        ELSE 72.8777 -- Default Mumbai center
    END,
    location_address = CASE 
        WHEN title ILIKE '%pothole%' OR title ILIKE '%road%' THEN 'Western Express Highway, Bandra West'
        WHEN title ILIKE '%traffic%' THEN 'Linking Road, Bandra West'
        WHEN title ILIKE '%garbage%' OR title ILIKE '%waste%' THEN 'Juhu Scheme, Juhu'
        WHEN title ILIKE '%water%' THEN 'SV Road, Malad West'
        WHEN title ILIKE '%light%' THEN 'Kandivali West'
        WHEN title ILIKE '%park%' THEN 'Lokhandwala Park, Andheri West'
        WHEN title ILIKE '%noise%' THEN 'Worli Sea Face'
        WHEN title ILIKE '%bus%' OR title ILIKE '%transport%' THEN 'Goregaon East'
        ELSE 'Mumbai, Maharashtra'
    END
WHERE location_lat IS NULL OR location_lng IS NULL OR location_address IS NULL;

-- Verify the update worked
SELECT 'Updated complaints with coordinates:' as info;
SELECT 
    title,
    location_lat,
    location_lng,
    location_address,
    status
FROM complaints 
WHERE location_lat IS NOT NULL 
ORDER BY created_at DESC;

-- Show final count
SELECT 'Final data summary:' as info;
SELECT 
    COUNT(*) as total_complaints,
    COUNT(CASE WHEN location_lat IS NOT NULL AND location_lng IS NOT NULL THEN 1 END) as with_coordinates,
    COUNT(CASE WHEN location_address IS NOT NULL THEN 1 END) as with_addresses
FROM complaints;