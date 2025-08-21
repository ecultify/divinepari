const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nuoizrqsnxoldzcvwszu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2l6cnFzbnhvbGR6Y3Z3c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTAwOTAsImV4cCI6MjA2NTgyNjA5MH0.QBqYuv2uxdNiakLzrW_CosJnN0vTvTwlGT2UvAZFYlY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSessionId() {
  const sessionId = '57_k14ar8x57?';
  console.log(`\n🔍 Searching for session ID: ${sessionId}\n`);
  
  try {
    // Check user_sessions table
    console.log('=== Checking user_sessions table ===');
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_id', sessionId);
    
    if (sessionsError) {
      console.error('Error checking user_sessions:', sessionsError);
    } else {
      console.log('Found in user_sessions:', sessions?.length || 0, 'records');
      if (sessions && sessions.length > 0) {
        console.log('Data:', JSON.stringify(sessions, null, 2));
      }
    }

    // Check user_journey table
    console.log('\n=== Checking user_journey table ===');
    const { data: journeys, error: journeysError } = await supabase
      .from('user_journey')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false });
    
    if (journeysError) {
      console.error('Error checking user_journey:', journeysError);
    } else {
      console.log('Found in user_journey:', journeys?.length || 0, 'records');
      if (journeys && journeys.length > 0) {
        console.log('Journey steps:');
        journeys.forEach((journey, index) => {
          console.log(`  ${index + 1}. Step: ${journey.step}, Timestamp: ${journey.timestamp}`);
          if (journey.data) {
            console.log(`     Data: ${JSON.stringify(journey.data)}`);
          }
        });
      }
    }

    // Check generation_results table
    console.log('\n=== Checking generation_results table ===');
    const { data: results, error: resultsError } = await supabase
      .from('generation_results')
      .select('*')
      .eq('session_id', sessionId);
    
    if (resultsError) {
      console.error('Error checking generation_results:', resultsError);
    } else {
      console.log('Found in generation_results:', results?.length || 0, 'records');
      if (results && results.length > 0) {
        results.forEach((result, index) => {
          console.log(`\n  Result ${index + 1}:`);
          console.log(`    - Gender: ${result.gender}`);
          console.log(`    - Poster: ${result.poster_selected}`);
          console.log(`    - Processing Status: ${result.processing_status}`);
          console.log(`    - User Image Uploaded: ${result.user_image_uploaded}`);
          console.log(`    - Result Image Generated: ${result.result_image_generated}`);
          console.log(`    - Hair Swap Requested: ${result.hair_swap_requested}`);
          console.log(`    - Hair Swap Completed: ${result.hair_swap_completed}`);
          console.log(`    - Email Sent: ${result.email_sent}`);
          console.log(`    - User Name: ${result.user_name}`);
          console.log(`    - User Email: ${result.user_email}`);
          console.log(`    - Created At: ${result.created_at}`);
          if (result.error_message) {
            console.log(`    - Error: ${result.error_message}`);
          }
        });
      }
    }

    // Check background_jobs table
    console.log('\n=== Checking background_jobs table ===');
    const { data: jobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    
    if (jobsError) {
      console.error('Error checking background_jobs:', jobsError);
    } else {
      console.log('Found in background_jobs:', jobs?.length || 0, 'records');
      if (jobs && jobs.length > 0) {
        jobs.forEach((job, index) => {
          console.log(`\n  Job ${index + 1}:`);
          console.log(`    - Type: ${job.job_type}`);
          console.log(`    - Status: ${job.status}`);
          console.log(`    - Priority: ${job.priority}`);
          console.log(`    - Attempts: ${job.attempts}/${job.max_attempts}`);
          console.log(`    - Created: ${job.created_at}`);
          console.log(`    - Started: ${job.started_at}`);
          console.log(`    - Completed: ${job.completed_at}`);
          console.log(`    - Email Sent: ${job.email_sent}`);
          if (job.error_message) {
            console.log(`    - Error: ${job.error_message}`);
          }
          if (job.input_data) {
            console.log(`    - Input Data: ${JSON.stringify(job.input_data)}`);
          }
        });
      }
    }

    // Check image_storage table
    console.log('\n=== Checking image_storage table ===');
    const { data: images, error: imagesError } = await supabase
      .from('image_storage')
      .select('*')
      .eq('session_id', sessionId);
    
    if (imagesError) {
      console.error('Error checking image_storage:', imagesError);
    } else {
      console.log('Found in image_storage:', images?.length || 0, 'records');
      if (images && images.length > 0) {
        images.forEach((image, index) => {
          console.log(`\n  Image ${index + 1}:`);
          console.log(`    - Type: ${image.image_type}`);
          console.log(`    - Original Filename: ${image.original_filename}`);
          console.log(`    - Storage Path: ${image.storage_path}`);
          console.log(`    - Storage URL: ${image.storage_url}`);
          console.log(`    - Upload Status: ${image.upload_status}`);
          console.log(`    - File Size: ${image.file_size} bytes`);
          console.log(`    - MIME Type: ${image.mime_type}`);
          console.log(`    - Created: ${image.created_at}`);
        });
      }
    }

    // Check download_tracking table
    console.log('\n=== Checking download_tracking table ===');
    const { data: downloads, error: downloadsError } = await supabase
      .from('download_tracking')
      .select('*')
      .eq('session_id', sessionId);
    
    if (downloadsError) {
      console.error('Error checking download_tracking:', downloadsError);
    } else {
      console.log('Found in download_tracking:', downloads?.length || 0, 'records');
      if (downloads && downloads.length > 0) {
        downloads.forEach((download, index) => {
          console.log(`\n  Download ${index + 1}:`);
          console.log(`    - Image Type: ${download.image_type}`);
          console.log(`    - Method: ${download.download_method}`);
          console.log(`    - Downloaded At: ${download.downloaded_at}`);
          console.log(`    - User Agent: ${download.user_agent}`);
        });
      }
    }

    console.log('\n✅ Search completed!');

  } catch (error) {
    console.error('❌ Error during search:', error);
  }
}

// Execute the check
checkSessionId();