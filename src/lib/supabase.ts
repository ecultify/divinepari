import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nuoizrqsnxoldzcvwszu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2l6cnFzbnhvbGR6Y3Z3c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTAwOTAsImV4cCI6MjA2NTgyNjA5MH0.QBqYuv2uxdNiakLzrW_CosJnN0vTvTwlGT2UvAZFYlY'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database tables
export interface UserSession {
  id?: string
  session_id: string
  created_at?: string
  updated_at?: string
}

export interface UserJourney {
  id?: string
  session_id: string
  step: 'gender_selection' | 'poster_selection' | 'photo_upload' | 'processing' | 'result_generated' | 'hair_swap_processing' | 'hair_swap_completed' | 'error'
  data?: any
  timestamp?: string
}

export interface GenerationResult {
  id?: string
  session_id: string
  gender: string
  poster_selected: string
  user_image_uploaded: boolean
  processing_status: 'started' | 'completed' | 'failed'
  result_image_generated: boolean
  hair_swap_requested?: boolean
  hair_swap_completed?: boolean
  hair_swap_image_url?: string
  hair_swap_image_path?: string
  user_image_url?: string
  user_image_path?: string
  generated_image_url?: string
  generated_image_path?: string
  user_name?: string
  user_email?: string
  email_sent?: boolean
  created_at?: string
  error_message?: string
}

export interface BackgroundJob {
  id?: string
  session_id: string
  job_type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority?: number
  input_data: any
  result_data?: any
  error_message?: string
  attempts?: number
  max_attempts?: number
  created_at?: string
  started_at?: string
  completed_at?: string
  next_retry_at?: string
  email_sent?: boolean
  email_sent_at?: string
}

export interface ImageStorage {
  id?: string
  session_id: string
  image_type: 'user_photo' | 'generated_poster'
  original_filename?: string
  storage_path: string
  storage_url: string
  file_size?: number
  mime_type?: string
  upload_status: 'uploading' | 'uploaded' | 'failed'
  created_at?: string
}

export interface DownloadTracking {
  id?: string
  session_id: string
  image_type: 'generated_poster'
  download_method?: string
  user_agent?: string
  ip_address?: string
  downloaded_at?: string
}

// Helper functions for tracking
export const trackUserSession = async (sessionId: string) => {
  try {
    // Use upsert to handle existing sessions
    const { data, error } = await supabase
      .from('user_sessions')
      .upsert([{ session_id: sessionId }], { 
        onConflict: 'session_id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Error tracking user session:', error);
      return null;
    }
    
    console.log('Session tracked successfully:', sessionId);
    return data
  } catch (error) {
    console.error('Exception tracking user session:', error)
    return null
  }
}

export const trackUserStep = async (sessionId: string, step: UserJourney['step'], data?: any) => {
  try {
    const { data: result, error } = await supabase
      .from('user_journey')
      .insert([{ 
        session_id: sessionId, 
        step, 
        data,
        timestamp: new Date().toISOString()
      }])
      .select()

    if (error) throw error
    return result
  } catch (error) {
    console.error('Error tracking user step:', error)
    return null
  }
}

export const trackGenerationResult = async (sessionId: string, resultData: Omit<GenerationResult, 'id' | 'session_id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('generation_results')
      .insert([{ 
        session_id: sessionId,
        ...resultData,
        created_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error tracking generation result:', error)
    return null
  }
}

export const updateGenerationResult = async (sessionId: string, updates: Partial<GenerationResult>) => {
  try {
    const { data, error } = await supabase
      .from('generation_results')
      .update(updates)
      .eq('session_id', sessionId)
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating generation result:', error)
    return null
  }
}

// Generate unique session ID
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Image storage functions
export const uploadImageToStorage = async (
  file: File | Blob, 
  sessionId: string, 
  imageType: 'user_photo' | 'generated_poster'
): Promise<{ url: string; path: string } | null> => {
  try {
    const bucket = imageType === 'user_photo' ? 'user-photos' : 'generated-posters'
    const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg'
    const fileName = `${sessionId}_${Date.now()}.${fileExt}`
    const filePath = `${imageType}/${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (error) {
      console.error('Error uploading image:', error)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Error in uploadImageToStorage:', error)
    return null
  }
}

export const trackImageStorage = async (
  sessionId: string,
  imageType: 'user_photo' | 'generated_poster',
  storagePath: string,
  storageUrl: string,
  file?: File | Blob,
  originalFilename?: string
) => {
  try {
    const imageData: Omit<ImageStorage, 'id' | 'created_at'> = {
      session_id: sessionId,
      image_type: imageType,
      original_filename: originalFilename || (file instanceof File ? file.name : undefined),
      storage_path: storagePath,
      storage_url: storageUrl,
      file_size: file?.size,
      mime_type: file?.type,
      upload_status: 'uploaded'
    }

    const { data, error } = await supabase
      .from('image_storage')
      .insert([imageData])
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error tracking image storage:', error)
    return null
  }
}

export const convertBase64ToBlob = (base64: string): Blob => {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '')
  
  // Convert base64 to binary
  const binaryString = window.atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  return new Blob([bytes], { type: 'image/jpeg' })
}

export const uploadBase64Image = async (
  base64Image: string,
  sessionId: string,
  imageType: 'user_photo' | 'generated_poster',
  filename?: string
): Promise<{ url: string; path: string } | null> => {
  try {
    const blob = convertBase64ToBlob(base64Image)
    const result = await uploadImageToStorage(blob, sessionId, imageType)
    
    if (result) {
      // Track the image storage
      await trackImageStorage(
        sessionId,
        imageType,
        result.path,
        result.url,
        blob,
        filename
      )
    }
    
    return result
  } catch (error) {
    console.error('Error uploading base64 image:', error)
    return null
  }
}

// Background Job functions
export async function queueBackgroundJob(
  sessionId: string,
  inputData: {
    gender: string
    posterName: string
    userImageUrl: string
    userName?: string
    userEmail?: string
  },
  priority: number = 1
): Promise<boolean> {
  try {
    console.log('Queuing background job for session:', sessionId);
    
    const jobData: Omit<BackgroundJob, 'id' | 'created_at'> = {
      session_id: sessionId,
      job_type: 'face_swap_generation',
      status: 'pending',
      priority,
      input_data: inputData,
      attempts: 0,
      max_attempts: 3
    };

    const { error } = await supabase
      .from('background_jobs')
      .insert([jobData]);

    if (error) {
      console.error('Error queuing background job:', error);
      return false;
    }

    console.log('Background job queued successfully');
    return true;
  } catch (error) {
    console.error('Exception queuing background job:', error);
    return false;
  }
}

export async function checkIfEmailAlreadySent(sessionId: string): Promise<boolean> {
  try {
    // Check if email was sent via normal flow
    const { data: generationResult } = await supabase
      .from('generation_results')
      .select('email_sent, email_sent_via_background')
      .eq('session_id', sessionId)
      .single();

    if (generationResult?.email_sent || generationResult?.email_sent_via_background) {
      return true;
    }

    // Check if email was sent via background job
    const { data: backgroundJob } = await supabase
      .from('background_jobs')
      .select('email_sent')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .eq('email_sent', true)
      .limit(1)
      .single();

    return !!backgroundJob;
  } catch (error) {
    console.error('Error checking email status:', error);
    return false;
  }
}

export async function markEmailSentViaBackground(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('generation_results')
      .update({ email_sent_via_background: true })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error marking email sent via background:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception marking email sent via background:', error);
    return false;
  }
}

// Download tracking function
export const trackDownload = async (
  sessionId: string,
  imageType: 'generated_poster' = 'generated_poster',
  downloadMethod: string = 'direct_download'
) => {
  try {
    const downloadData: Omit<DownloadTracking, 'id' | 'downloaded_at'> = {
      session_id: sessionId,
      image_type: imageType,
      download_method: downloadMethod,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    }

    const { data, error } = await supabase
      .from('download_tracking')
      .insert([downloadData])
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error tracking download:', error)
    return null
  }
} 