const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nuoizrqsnxoldzcvwszu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2l6cnFzbnhvbGR6Y3Z3c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTAwOTAsImV4cCI6MjA2NTgyNjA5MH0.QBqYuv2uxdNiakLzrW_CosJnN0vTvTwlGT2UvAZFYlY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSimilarSessions() {
  console.log(`\n🔍 Searching for sessions similar to: 57_k14ar8x57?\n`);
  
  try {
    // Check for sessions containing "57" or "k14ar8x57"
    console.log('=== Checking for sessions containing "57" ===');
    const { data: sessions57, error: sessions57Error } = await supabase
      .from('user_sessions')
      .select('*')
      .ilike('session_id', '%57%')
      .limit(10);
    
    if (sessions57Error) {
      console.error('Error checking sessions with "57":', sessions57Error);
    } else {
      console.log('Found sessions containing "57":', sessions57?.length || 0);
      if (sessions57 && sessions57.length > 0) {
        sessions57.forEach((session, index) => {
          console.log(`  ${index + 1}. ${session.session_id} (created: ${session.created_at})`);
        });
      }
    }

    // Check for sessions containing "k14ar8x57"
    console.log('\n=== Checking for sessions containing "k14ar8x57" ===');
    const { data: sessionsK14, error: sessionsK14Error } = await supabase
      .from('user_sessions')
      .select('*')
      .ilike('session_id', '%k14ar8x57%')
      .limit(10);
    
    if (sessionsK14Error) {
      console.error('Error checking sessions with "k14ar8x57":', sessionsK14Error);
    } else {
      console.log('Found sessions containing "k14ar8x57":', sessionsK14?.length || 0);
      if (sessionsK14 && sessionsK14.length > 0) {
        sessionsK14.forEach((session, index) => {
          console.log(`  ${index + 1}. ${session.session_id} (created: ${session.created_at})`);
        });
      }
    }

    // Check recent sessions to see the format
    console.log('\n=== Recent sessions (last 10) ===');
    const { data: recentSessions, error: recentError } = await supabase
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.error('Error checking recent sessions:', recentError);
    } else {
      console.log('Recent sessions:', recentSessions?.length || 0);
      if (recentSessions && recentSessions.length > 0) {
        recentSessions.forEach((session, index) => {
          console.log(`  ${index + 1}. ${session.session_id} (created: ${session.created_at})`);
        });
      }
    }

    // Also check generation_results table for similar patterns
    console.log('\n=== Checking generation_results for sessions containing "57" ===');
    const { data: genResults57, error: genResults57Error } = await supabase
      .from('generation_results')
      .select('session_id, processing_status, created_at')
      .ilike('session_id', '%57%')
      .limit(10);
    
    if (genResults57Error) {
      console.error('Error checking generation_results with "57":', genResults57Error);
    } else {
      console.log('Found generation results containing "57":', genResults57?.length || 0);
      if (genResults57 && genResults57.length > 0) {
        genResults57.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.session_id} - Status: ${result.processing_status} (${result.created_at})`);
        });
      }
    }

    console.log('\n✅ Similar session search completed!');

  } catch (error) {
    console.error('❌ Error during search:', error);
  }
}

// Execute the check
checkSimilarSessions();