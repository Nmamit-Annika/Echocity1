-- CHECK CURRENT DATA - Run this to see what we actually have
-- This will show us if the sample data was added properly

SELECT 'Current complaints data:' as info;

-- Check total complaints
SELECT COUNT(*) as total_complaints FROM complaints;

-- Check complaints with coordinates
SELECT COUNT(*) as complaints_with_coords 
FROM complaints 
WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Check sample of complaint data
SELECT 
    id,
    title,
    location_lat as lat,
    location_lng as lng,
    location_address as address,
    status,
    created_at
FROM complaints 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if any complaints exist for your user
SELECT 'Complaints by user:' as info;
SELECT 
    p.full_name,
    COUNT(c.id) as complaint_count
FROM profiles p
LEFT JOIN complaints c ON p.id = c.user_id
GROUP BY p.id, p.full_name
ORDER BY complaint_count DESC;