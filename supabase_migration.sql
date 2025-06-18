-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create user_journey table  
CREATE TABLE IF NOT EXISTS user_journey (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('gender_selection', 'poster_selection', 'photo_upload', 'processing', 'result_generated', 'error')),
  data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create generation_results table
CREATE TABLE IF NOT EXISTS generation_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
  gender TEXT NOT NULL,
  poster_selected TEXT NOT NULL,
  user_image_uploaded BOOLEAN DEFAULT FALSE,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('started', 'completed', 'failed')),
  result_image_generated BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_journey_session_id ON user_journey(session_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_step ON user_journey(step);
CREATE INDEX IF NOT EXISTS idx_generation_results_session_id ON generation_results(session_id);
CREATE INDEX IF NOT EXISTS idx_generation_results_status ON generation_results(processing_status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_sessions table
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 