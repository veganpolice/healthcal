import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: number
          user_id: string
          date: string
          type: string
          provider: string
          duration: string
          estimated_cost: string
          status: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          date: string
          type: string
          provider: string
          duration: string
          estimated_cost: string
          status?: string
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          date?: string
          type?: string
          provider?: string
          duration?: string
          estimated_cost?: string
          status?: string
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          step: string
          preferences: any
          completed_at: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

interface UserPreferences {
  timePreference?: string
  importantServices?: string[]
  healthConcerns?: string
  travelDistance?: number
  providerGender?: string
  languagePreference?: string
  alternativeTherapies?: string
  [key: string]: any
}

interface InsuranceCoverage {
  [key: string]: {
    percentage: number
    annualLimit?: number
    frequency?: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (req.method === 'POST') {
      return await generateSchedule(supabaseClient, user.id)
    } else if (req.method === 'GET') {
      return await getSchedule(supabaseClient, user.id)
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Error in generate-schedule function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function generateSchedule(supabaseClient: any, userId: string) {
  try {
    // Get user preferences
    const { data: preferencesData, error: preferencesError } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('step', 'questionnaire')
      .single()

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch preferences: ${preferencesError.message}`)
    }

    const userPreferences: UserPreferences = preferencesData?.preferences || {}

    // Get insurance coverage data
    const { data: insuranceData, error: insuranceError } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('step', 'upload')
      .single()

    if (insuranceError && insuranceError.code !== 'PGRST116') {
      console.warn('No insurance data found, using defaults')
    }

    const insuranceCoverage: InsuranceCoverage = insuranceData?.preferences?.extractedData?.coverage || getDefaultCoverage()

    // Clear existing appointments for this user
    const { error: deleteError } = await supabaseClient
      .from('appointments')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.warn('Failed to clear existing appointments:', deleteError.message)
    }

    // Generate new schedule
    const appointments = generateAppointments(userPreferences, insuranceCoverage, userId)

    // Insert new appointments
    const { data: insertedAppointments, error: insertError } = await supabaseClient
      .from('appointments')
      .insert(appointments)
      .select()

    if (insertError) {
      throw new Error(`Failed to insert appointments: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        data: insertedAppointments, 
        error: null,
        message: `Generated ${insertedAppointments.length} appointments`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error generating schedule:', error)
    return new Response(
      JSON.stringify({ data: null, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

async function getSchedule(supabaseClient: any, userId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ data: data || [], error: null }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return new Response(
      JSON.stringify({ data: [], error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

function generateAppointments(userPreferences: UserPreferences, insuranceCoverage: InsuranceCoverage, userId: string) {
  const appointments = []
  const currentYear = new Date().getFullYear()
  
  // Define appointment templates based on insurance coverage and preferences
  const appointmentTemplates = [
    // Dental appointments
    {
      type: "Dental Cleaning",
      category: "dental",
      duration: "60 minutes",
      frequency: "every 6 months",
      priority: "high",
      provider: "Dr. Michael Rodriguez"
    },
    {
      type: "Dental Checkup",
      category: "dental",
      duration: "45 minutes",
      frequency: "every 6 months",
      priority: "high",
      provider: "Dr. Michael Rodriguez"
    },
    // Vision care
    {
      type: "Eye Exam",
      category: "vision",
      duration: "45 minutes",
      frequency: "every 2 years",
      priority: "medium",
      provider: "Dr. Amanda Foster"
    },
    {
      type: "Vision Screening",
      category: "vision",
      duration: "30 minutes",
      frequency: "yearly",
      priority: "medium",
      provider: "Dr. Amanda Foster"
    },
    // Medical appointments
    {
      type: "Annual Physical",
      category: "medical",
      duration: "45 minutes",
      frequency: "yearly",
      priority: "high",
      provider: "Dr. Jennifer Kim"
    },
    {
      type: "Blood Work",
      category: "medical",
      duration: "20 minutes",
      frequency: "yearly",
      priority: "high",
      provider: "Dr. Jennifer Kim"
    },
    {
      type: "Preventive Screening",
      category: "medical",
      duration: "30 minutes",
      frequency: "yearly",
      priority: "medium",
      provider: "Dr. Jennifer Kim"
    },
    // Physiotherapy
    {
      type: "Physiotherapy Assessment",
      category: "physio",
      duration: "60 minutes",
      frequency: "as needed",
      priority: "medium",
      provider: "Dr. Sarah Chen"
    },
    {
      type: "Physiotherapy Session",
      category: "physio",
      duration: "45 minutes",
      frequency: "monthly",
      priority: "medium",
      provider: "Dr. Sarah Chen"
    },
    // Massage therapy
    {
      type: "Massage Therapy",
      category: "massage",
      duration: "60 minutes",
      frequency: "monthly",
      priority: "low",
      provider: "Lisa Thompson"
    },
    {
      type: "Therapeutic Massage",
      category: "massage",
      duration: "90 minutes",
      frequency: "quarterly",
      priority: "low",
      provider: "Lisa Thompson"
    },
    // Mental health
    {
      type: "Mental Health Consultation",
      category: "mental",
      duration: "50 minutes",
      frequency: "quarterly",
      priority: "medium",
      provider: "Dr. Emily Watson"
    },
    // Chiropractic
    {
      type: "Chiropractic Assessment",
      category: "chiro",
      duration: "45 minutes",
      frequency: "as needed",
      priority: "low",
      provider: "Dr. Mark Johnson"
    }
  ]

  // Filter templates based on user preferences and insurance coverage
  const relevantTemplates = appointmentTemplates.filter(template => {
    // Always include high priority appointments
    if (template.priority === 'high') return true
    
    // Check if user selected this service as important
    const serviceMap = {
      'dental': 'Dental care',
      'vision': 'Vision care',
      'physio': 'Physiotherapy',
      'massage': 'Massage therapy',
      'medical': 'Preventive care',
      'mental': 'Mental health',
      'chiro': 'Chiropractic care'
    }
    
    const importantServices = userPreferences.importantServices || []
    if (importantServices.includes(serviceMap[template.category])) return true
    
    // Check if insurance covers this service
    if (insuranceCoverage[template.category]) return true
    
    return false
  })

  // Generate appointments from templates
  relevantTemplates.forEach(template => {
    const dates = generateAppointmentDates(template.frequency, currentYear, userPreferences)
    
    dates.forEach(date => {
      const cost = calculateCost(template.category, insuranceCoverage)
      
      appointments.push({
        user_id: userId,
        date: date.toISOString().split('T')[0],
        type: template.type,
        provider: template.provider,
        duration: template.duration,
        estimated_cost: cost,
        status: 'proposed',
        category: template.category
      })
    })
  })

  return appointments
}

function generateAppointmentDates(frequency: string, year: number, userPreferences: UserPreferences): Date[] {
  const dates: Date[] = []
  
  switch (frequency) {
    case 'every 6 months':
      dates.push(
        getOptimalDate(new Date(year, 0, 15), userPreferences),
        getOptimalDate(new Date(year, 5, 15), userPreferences)
      )
      break
    case 'yearly':
      dates.push(getOptimalDate(new Date(year, 5, 20), userPreferences))
      break
    case 'every 2 years':
      if (year % 2 === 1) {
        dates.push(getOptimalDate(new Date(year, 0, 28), userPreferences))
      }
      break
    case 'monthly':
      // Generate 6 appointments throughout the year (every 2 months)
      for (let i = 0; i < 6; i++) {
        const month = i * 2
        dates.push(getOptimalDate(new Date(year, month, 15), userPreferences))
      }
      break
    case 'quarterly':
      // Generate 4 appointments throughout the year
      for (let i = 0; i < 4; i++) {
        const month = i * 3
        dates.push(getOptimalDate(new Date(year, month, 15), userPreferences))
      }
      break
    case 'as needed':
      // Generate 2-3 appointments for assessment and follow-ups
      dates.push(
        getOptimalDate(new Date(year, 2, 10), userPreferences),
        getOptimalDate(new Date(year, 7, 14), userPreferences)
      )
      break
  }
  
  return dates
}

function getOptimalDate(baseDate: Date, userPreferences: UserPreferences): Date {
  // Add some randomization to avoid clustering
  const randomDays = Math.floor(Math.random() * 14) - 7 // +/- 7 days
  const optimizedDate = new Date(baseDate)
  optimizedDate.setDate(optimizedDate.getDate() + randomDays)
  
  // Ensure it's a weekday for most appointments
  while (optimizedDate.getDay() === 0 || optimizedDate.getDay() === 6) {
    optimizedDate.setDate(optimizedDate.getDate() + 1)
  }
  
  return optimizedDate
}

function calculateCost(category: string, insuranceCoverage: InsuranceCoverage): string {
  const baseCosts = {
    'dental': 150,
    'vision': 120,
    'physio': 85,
    'massage': 120,
    'medical': 200,
    'mental': 180,
    'chiro': 90
  }

  const baseCost = baseCosts[category] || 100
  const coverage = insuranceCoverage[category]

  if (!coverage) {
    return `$${baseCost} (no coverage)`
  }

  const insurancePays = (baseCost * coverage.percentage) / 100
  const userPays = baseCost - insurancePays

  if (userPays === 0) {
    return "$0 (fully covered)"
  } else {
    return `$${Math.round(userPays)} (after insurance)`
  }
}

function getDefaultCoverage(): InsuranceCoverage {
  return {
    dental: { percentage: 80, annualLimit: 1500 },
    vision: { percentage: 100, frequency: "Every 2 years" },
    physio: { percentage: 100, annualLimit: 2000 },
    massage: { percentage: 80, annualLimit: 500 },
    medical: { percentage: 100 },
    mental: { percentage: 80, annualLimit: 1200 },
    chiro: { percentage: 80, annualLimit: 800 }
  }
}