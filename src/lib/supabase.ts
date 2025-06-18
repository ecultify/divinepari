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
  step: 'gender_selection' | 'poster_selection' | 'photo_upload' | 'processing' | 'result_generated' | 'error'
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
  created_at?: string
  error_message?: string
}

// Helper functions for tracking
export const trackUserSession = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert([{ session_id: sessionId }])
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error tracking user session:', error)
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