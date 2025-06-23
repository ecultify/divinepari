-- Hair Swap Jobs Table Migration
-- Run this in Supabase SQL Editor

-- Create hair_swap_jobs table for async processing
CREATE TABLE IF NOT EXISTS hair_swap_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  request_id TEXT NOT NULL UNIQUE,
  poll_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
  face_swapped_image_url TEXT NOT NULL,
  user_original_image_url TEXT NOT NULL,
  result_image_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hair_swap_jobs_session_id ON hair_swap_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_hair_swap_jobs_request_id ON hair_swap_jobs(request_id);
CREATE INDEX IF NOT EXISTS idx_hair_swap_jobs_status ON hair_swap_jobs(status);
CREATE INDEX IF NOT EXISTS idx_hair_swap_jobs_created_at ON hair_swap_jobs(created_at);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_hair_swap_jobs_updated_at 
  BEFORE UPDATE ON hair_swap_jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 