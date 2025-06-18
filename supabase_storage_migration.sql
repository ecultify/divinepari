-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('user-photos', 'user-photos', true),
  ('generated-posters', 'generated-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for user-photos bucket
CREATE POLICY "Anyone can upload user photos" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'user-photos');

CREATE POLICY "Anyone can view user photos" ON storage.objects 
FOR SELECT USING (bucket_id = 'user-photos');

CREATE POLICY "Anyone can update user photos" ON storage.objects 
FOR UPDATE USING (bucket_id = 'user-photos');

CREATE POLICY "Anyone can delete user photos" ON storage.objects 
FOR DELETE USING (bucket_id = 'user-photos');

-- Set up storage policies for generated-posters bucket
CREATE POLICY "Anyone can upload generated posters" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'generated-posters');

CREATE POLICY "Anyone can view generated posters" ON storage.objects 
FOR SELECT USING (bucket_id = 'generated-posters');

CREATE POLICY "Anyone can update generated posters" ON storage.objects 
FOR UPDATE USING (bucket_id = 'generated-posters');

CREATE POLICY "Anyone can delete generated posters" ON storage.objects 
FOR DELETE USING (bucket_id = 'generated-posters');

-- Add image storage columns to existing tables
ALTER TABLE user_journey 
ADD COLUMN IF NOT EXISTS user_image_url TEXT,
ADD COLUMN IF NOT EXISTS user_image_path TEXT;

ALTER TABLE generation_results 
ADD COLUMN IF NOT EXISTS user_image_url TEXT,
ADD COLUMN IF NOT EXISTS user_image_path TEXT,
ADD COLUMN IF NOT EXISTS generated_image_url TEXT,
ADD COLUMN IF NOT EXISTS generated_image_path TEXT;

-- Create a new table specifically for image storage tracking
CREATE TABLE IF NOT EXISTS image_storage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  image_type TEXT NOT NULL CHECK (image_type IN ('user_photo', 'generated_poster')),
  original_filename TEXT,
  storage_path TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  upload_status TEXT DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for image storage table
CREATE INDEX IF NOT EXISTS idx_image_storage_session_id ON image_storage(session_id);
CREATE INDEX IF NOT EXISTS idx_image_storage_type ON image_storage(image_type);
CREATE INDEX IF NOT EXISTS idx_image_storage_status ON image_storage(upload_status);

-- Create a table for download tracking
CREATE TABLE IF NOT EXISTS download_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  image_type TEXT NOT NULL CHECK (image_type IN ('generated_poster')),
  download_method TEXT DEFAULT 'direct_download',
  user_agent TEXT,
  ip_address INET,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for download tracking
CREATE INDEX IF NOT EXISTS idx_download_tracking_session_id ON download_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_download_tracking_date ON download_tracking(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_download_tracking_type ON download_tracking(image_type); 