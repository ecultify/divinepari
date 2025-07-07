// @ts-ignore
import { supabase } from './supabase.js';

async function checkSupabaseContents() {
  try {
    // Check user_sessions
    console.log('\n=== Checking user_sessions ===');
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .limit(5);
    
    if (sessionsError) throw sessionsError;
    console.log('Recent Sessions:', sessions);

    // Check user_journey
    console.log('\n=== Checking user_journey ===');
    const { data: journeys, error: journeysError } = await supabase
      .from('user_journey')
      .select('*')
      .limit(5);
    
    if (journeysError) throw journeysError;
    console.log('Recent Journeys:', journeys);

    // Check generation_results
    console.log('\n=== Checking generation_results ===');
    const { data: results, error: resultsError } = await supabase
      .from('generation_results')
      .select('*')
      .limit(5);
    
    if (resultsError) throw resultsError;
    console.log('Recent Results:', results);

    // Check image_storage
    console.log('\n=== Checking image_storage ===');
    const { data: images, error: imagesError } = await supabase
      .from('image_storage')
      .select('*')
      .limit(5);
    
    if (imagesError) throw imagesError;
    console.log('Recent Images:', images);

    // Check download_tracking
    console.log('\n=== Checking download_tracking ===');
    const { data: downloads, error: downloadsError } = await supabase
      .from('download_tracking')
      .select('*')
      .limit(5);
    
    if (downloadsError) throw downloadsError;
    console.log('Recent Downloads:', downloads);

    // Check storage buckets
    console.log('\n=== Checking Storage Buckets ===');
    
    // Check user-photos bucket
    const { data: userPhotos, error: userPhotosError } = await supabase
      .storage
      .from('user-photos')
      .list();
    
    if (userPhotosError) throw userPhotosError;
    console.log('User Photos in Storage:', userPhotos?.length);
    
    // Check generated-posters bucket
    const { data: generatedPosters, error: postersError } = await supabase
      .storage
      .from('generated-posters')
      .list();
    
    if (postersError) throw postersError;
    console.log('Generated Posters in Storage:', generatedPosters?.length);

    // Get some statistics
    console.log('\n=== Statistics ===');
    
    // Total users
    const { data: sessionCount, error: countError } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log('Total Sessions:', sessionCount);

    // Successful generations
    const { data: genCount, error: genCountError } = await supabase
      .from('generation_results')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'completed');
    
    if (genCountError) throw genCountError;
    console.log('Successful Generations:', genCount);

  } catch (error) {
    console.error('Error checking Supabase contents:', error);
  }
}

// Execute the check
checkSupabaseContents(); 