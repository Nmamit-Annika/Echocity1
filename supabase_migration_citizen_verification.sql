-- Migration: Add citizen verification fields to complaints table
-- This adds support for the citizen verification workflow where
-- citizens must approve admin resolutions before complaints are marked as resolved

-- Add citizen_feedback column to store citizen's comments when verifying resolution
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS citizen_feedback TEXT;

-- Add verification_requested timestamp to track when admin requested verification
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS verification_requested TIMESTAMPTZ;

-- Add reopen_reason column to store AI-generated analysis when citizen rejects resolution
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS reopen_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN complaints.citizen_feedback IS 'Citizen feedback when approving or rejecting resolution';
COMMENT ON COLUMN complaints.verification_requested IS 'Timestamp when admin requested citizen verification';
COMMENT ON COLUMN complaints.reopen_reason IS 'AI-generated reason when case is reopened after citizen rejection';

-- Drop the old status check constraint
ALTER TABLE complaints 
DROP CONSTRAINT IF EXISTS complaints_status_check;

-- Add new status check constraint that includes 'pending-verification', 'approved', and 'reopened'
ALTER TABLE complaints 
ADD CONSTRAINT complaints_status_check 
CHECK (status IN ('pending', 'approved', 'in_progress', 'pending-verification', 'resolved', 'rejected', 'reopened'));
