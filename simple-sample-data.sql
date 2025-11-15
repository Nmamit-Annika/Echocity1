-- SIMPLE SAMPLE DATA - Only add complaints for existing users
-- Run this in Supabase SQL Editor

-- First, let's see what we have
SELECT 'Current data summary:' as info;
SELECT 'Profiles:' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Categories:', COUNT(*) FROM categories  
UNION ALL
SELECT 'Departments:', COUNT(*) FROM departments
UNION ALL
SELECT 'Complaints:', COUNT(*) FROM complaints;

-- Get your current user ID
SELECT 'Your user ID:' as info, id, full_name FROM profiles WHERE role = 'citizen';

-- Add realistic complaints using your existing user
DO $$
DECLARE
    category_roads UUID;
    category_waste UUID;
    category_water UUID;
    category_lighting UUID;
    category_parks UUID;
    category_safety UUID;
    category_noise UUID;
    category_building UUID;
    category_transport UUID;
    
    dept_pwd UUID;
    dept_waste UUID;
    dept_water UUID;
    dept_electricity UUID;
    dept_parks UUID;
    dept_police UUID;
    dept_pollution UUID;
    dept_building UUID;
    dept_transport UUID;
    
    current_user_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO category_roads FROM categories WHERE name = 'Roads & Traffic';
    SELECT id INTO category_waste FROM categories WHERE name = 'Waste Management';
    SELECT id INTO category_water FROM categories WHERE name = 'Water & Sewage';
    SELECT id INTO category_lighting FROM categories WHERE name = 'Street Lighting';
    SELECT id INTO category_parks FROM categories WHERE name = 'Parks & Recreation';
    SELECT id INTO category_safety FROM categories WHERE name = 'Public Safety';
    SELECT id INTO category_noise FROM categories WHERE name = 'Noise Pollution';
    SELECT id INTO category_building FROM categories WHERE name = 'Building & Construction';
    SELECT id INTO category_transport FROM categories WHERE name = 'Public Transport';
    
    -- Get department IDs
    SELECT id INTO dept_pwd FROM departments WHERE name = 'Public Works Department';
    SELECT id INTO dept_waste FROM departments WHERE name = 'Waste Management Corporation';
    SELECT id INTO dept_water FROM departments WHERE name = 'Water Board';
    SELECT id INTO dept_electricity FROM departments WHERE name = 'Electricity Board';
    SELECT id INTO dept_parks FROM departments WHERE name = 'Parks Department';
    SELECT id INTO dept_police FROM departments WHERE name = 'Police Department';
    SELECT id INTO dept_pollution FROM departments WHERE name = 'Pollution Control Board';
    SELECT id INTO dept_building FROM departments WHERE name = 'Building Department';
    SELECT id INTO dept_transport FROM departments WHERE name = 'Transport Authority';
    
    -- Get your user ID
    SELECT id INTO current_user_id FROM profiles WHERE role = 'citizen' LIMIT 1;
    
    -- Insert realistic complaints (all from your user for now)
    INSERT INTO public.complaints (
        title, description, category_id, department_id, user_id,
        location_lat, location_lng, location_address,
        status, priority, created_at
    ) VALUES
        -- Roads & Traffic complaints
        ('Massive pothole on Western Express Highway', 'There is a huge pothole near Bandra flyover that has caused several accidents. Urgent repair needed.', 
         category_roads, dept_pwd, current_user_id, 19.0596, 72.8295, 'Western Express Highway, Bandra West', 'pending', 'high', NOW() - INTERVAL '2 days'),
         
        ('Traffic signal not working at Linking Road', 'The traffic signal at Linking Road junction has been non-functional for 3 days causing major traffic jams.',
         category_roads, dept_pwd, current_user_id, 19.0544, 72.8265, 'Linking Road, Bandra West', 'in_progress', 'high', NOW() - INTERVAL '1 day'),
         
        ('Road construction debris blocking traffic', 'Construction material left on road at Andheri East is causing severe traffic congestion.',
         category_roads, dept_pwd, current_user_id, 19.1136, 72.8697, 'Andheri East Main Road', 'approved', 'medium', NOW() - INTERVAL '3 days'),
         
        -- Waste Management complaints  
        ('Garbage not collected for 5 days', 'Garbage bins are overflowing in our society. No collection for almost a week.',
         category_waste, dept_waste, current_user_id, 19.0728, 72.8826, 'Juhu Scheme, Juhu', 'pending', 'medium', NOW() - INTERVAL '1 day'),
         
        ('Illegal dumping near Powai Lake', 'People are dumping construction waste near Powai Lake. This is harming the environment.',
         category_waste, dept_waste, current_user_id, 19.1197, 72.9089, 'Powai Lake Area', 'resolved', 'high', NOW() - INTERVAL '5 days'),
         
        -- Water & Sewage
        ('Water leakage flooding the street', 'Major water pipe burst on SV Road causing street flooding and water wastage.',
         category_water, dept_water, current_user_id, 19.0892, 72.8346, 'SV Road, Malad West', 'in_progress', 'high', NOW() - INTERVAL '4 hours'),
         
        ('No water supply for 2 days', 'Our entire building has no water supply. Tank seems to be empty and no water tanker has come.',
         category_water, dept_water, current_user_id, 19.2028, 72.9699, 'Thane West', 'approved', 'high', NOW() - INTERVAL '1 day'),
         
        -- Street Lighting
        ('Street lights not working in entire lane', 'All street lights in our lane have been off for over a week. Very unsafe at night.',
         category_lighting, dept_electricity, current_user_id, 19.0411, 72.8661, 'Kandivali West', 'pending', 'medium', NOW() - INTERVAL '2 days'),
         
        ('Flickering street light causing disturbance', 'Street light outside our building keeps flickering throughout the night.',
         category_lighting, dept_electricity, current_user_id, 19.0748, 72.8272, 'Carter Road, Bandra West', 'resolved', 'low', NOW() - INTERVAL '6 days'),
         
        -- Parks & Recreation
        ('Playground equipment broken and dangerous', 'Swings in the park are broken and pose safety risk to children.',
         category_parks, dept_parks, current_user_id, 19.1075, 72.8263, 'Lokhandwala Park, Andheri West', 'approved', 'medium', NOW() - INTERVAL '3 days'),
         
        ('Park maintenance required', 'The garden needs trimming and cleaning. Overgrown bushes and litter everywhere.',
         category_parks, dept_parks, current_user_id, 19.0369, 72.8536, 'Mahim Nature Park', 'pending', 'low', NOW() - INTERVAL '1 day'),
         
        -- Public Safety
        ('Suspicious activity reported', 'Group of people loitering near school premises. Parents are concerned about safety.',
         category_safety, dept_police, current_user_id, 19.0521, 72.8774, 'Near Juhu School', 'in_progress', 'high', NOW() - INTERVAL '6 hours'),
         
        ('Street light pole fallen after storm', 'Heavy rains caused an electric pole to fall. Live wires are exposed.',
         category_safety, dept_electricity, current_user_id, 19.1718, 72.8479, 'Borivali East', 'pending', 'high', NOW() - INTERVAL '2 hours'),
         
        -- Noise Pollution
        ('Construction noise during night hours', 'Building construction is going on till 2 AM violating noise regulations.',
         category_noise, dept_pollution, current_user_id, 19.0330, 72.8570, 'Worli Sea Face', 'pending', 'medium', NOW() - INTERVAL '1 day'),
         
        ('Loud music from restaurant disturbing residents', 'Restaurant plays extremely loud music till late night affecting our sleep.',
         category_noise, dept_pollution, current_user_id, 19.0760, 72.8777, 'Mumbai Central', 'approved', 'medium', NOW() - INTERVAL '4 days'),
         
        -- Public Transport
        ('Bus stop shelter damaged', 'Bus stop roof is broken and passengers have no protection from rain.',
         category_transport, dept_transport, current_user_id, 19.0895, 72.8656, 'Goregaon East Bus Stop', 'pending', 'low', NOW() - INTERVAL '3 days'),
         
        ('Auto rickshaw overcharging', 'Auto drivers at this stand refuse to go by meter and demand double fare.',
         category_transport, dept_transport, current_user_id, 19.0176, 72.8562, 'Colaba Causeway', 'resolved', 'medium', NOW() - INTERVAL '7 days');
         
END $$;

-- Update some complaints to show progress
UPDATE complaints 
SET admin_notes = 'Work order issued to contractor. Expected completion in 3 days.',
    updated_at = NOW()
WHERE status = 'approved';

UPDATE complaints 
SET admin_notes = 'Issue resolved. Roads repaired and area cleaned.',
    resolved_at = NOW() - INTERVAL '1 day',
    updated_at = NOW()
WHERE status = 'resolved';

UPDATE complaints 
SET admin_notes = 'Team dispatched. Work in progress.',
    updated_at = NOW()
WHERE status = 'in_progress';

-- Show final summary
SELECT 'Final data summary:' as info;
SELECT 'Profiles:' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Categories:', COUNT(*) FROM categories  
UNION ALL
SELECT 'Departments:', COUNT(*) FROM departments
UNION ALL
SELECT 'Complaints:', COUNT(*) FROM complaints;

SELECT 'Complaints by status:' as info;
SELECT status, COUNT(*) as count 
FROM complaints 
GROUP BY status 
ORDER BY count DESC;