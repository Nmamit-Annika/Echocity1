-- CHECK COMPLAINTS TABLE STRUCTURE
-- This will show us exactly what columns exist

SELECT 'Complaints table structure:' as info;

-- Check what columns exist in complaints table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'complaints' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if location columns exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'location_lat') 
        THEN 'location_lat EXISTS' 
        ELSE 'location_lat MISSING' 
    END as lat_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'location_lng') 
        THEN 'location_lng EXISTS' 
        ELSE 'location_lng MISSING' 
    END as lng_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'location_address') 
        THEN 'location_address EXISTS' 
        ELSE 'location_address MISSING' 
    END as address_status;

-- Show sample complaints with all available columns
SELECT * FROM complaints LIMIT 2;