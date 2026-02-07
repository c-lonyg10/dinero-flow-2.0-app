import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xoiztyojdaipmbbxlwuu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaXp0eW9qZGFpcG1iYnhsd3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjI5MDQsImV4cCI6MjA4NjAzODkwNH0.jSgwnSfBuSJXcQ4kB3RK2wEk8Ju8tXdLHEYJs3zlaSg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)